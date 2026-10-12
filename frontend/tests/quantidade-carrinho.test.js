import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

const fonte = await readFile(new URL('../src/componentes/LinhaItemCarrinho.jsx', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(fonte, 'LinhaItemCarrinho.jsx', {
  loader: 'jsx', jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
});
const resolvido = code.replaceAll('"react-router-dom"', JSON.stringify(import.meta.resolve('react-router-dom')))
  .replaceAll('"../api/cliente.js"', JSON.stringify(new URL('../src/api/cliente.js', import.meta.url).href));
const modulo = 'import React from ' + JSON.stringify(new URL('../node_modules/react/index.js', import.meta.url).href) + ';\n' + resolvido;
const { LinhaItemCarrinho } = await import('data:text/javascript;base64,' + Buffer.from(modulo).toString('base64'));

function encontrar(no, predicado) {
  if (!no || typeof no !== 'object') return null;
  if (predicado(no)) return no;
  for (const filho of [no.props?.children].flat(Infinity)) {
    const achado = encontrar(filho, predicado);
    if (achado) return achado;
  }
  return null;
}
function montar(opcoes = {}, ocupado = false) {
  const alteracoes = [], remocoes = [];
  const arvore = LinhaItemCarrinho({ item: {
    codigo_produto: 'A', descricao: 'Teste', preco_unitario: 20, valor_total: 100,
    quantidade: 5, estoque: 3, disponivel: false, quantidade_editavel: true,
    problema: 'Restam apenas 3 em estoque.', ...opcoes,
  }, ocupado, aoAlterar: (...args) => alteracoes.push(args), aoRemover: codigo => remocoes.push(codigo) });
  return { arvore, input: encontrar(arvore, no => no.type === 'input'),
    remover: encontrar(arvore, no => no.type === 'button'), alteracoes, remocoes };
}
const mudar = (input, value) => input.props.onChange({ target: { value } });

test('FIX-006: linha pendente permite reduzir sem remover', () => {
  const { arvore, input, remover, alteracoes, remocoes } = montar();
  assert.equal(input.props.disabled, false);
  assert.equal(input.props.value, 5);
  assert.equal(input.props.max, 3);
  assert.equal(input.props.min, '1');
  assert.equal(encontrar(arvore, no => no.type === 'label').props.htmlFor, input.props.id);
  assert.ok(encontrar(arvore, no => no.props?.children === 'Restam apenas 3 em estoque.'));
  mudar(input, '3');
  assert.deepEqual(alteracoes, [['A', 3]]);
  assert.deepEqual(remocoes, []);
  remover.props.onClick();
  assert.deepEqual(remocoes, ['A']);
});
for (const [nome, opcoes, ocupado] of [
  ['ocupado', {}, true], ['zero', { estoque: 0, quantidade_editavel: false }, false],
  ['inativo', { estoque: 10, quantidade_editavel: false }, false],
  ['ausente', { estoque: undefined, quantidade_editavel: false }, false],
]) {
  test('FIX-006: bloqueios de ' + nome, () => {
    const { input, remover, alteracoes } = montar(opcoes, ocupado);
    assert.equal(input.props.disabled, true);
    assert.equal(remover.props.disabled, ocupado);
    mudar(input, '1');
    assert.deepEqual(alteracoes, []);
  });
}
for (const [estoque, limite, validos, invalidos] of [
  [3, 3, ['1', '3'], ['', '0', '-1', '1.5', 'abc', 'Infinity', '4']],
  [150, 99, ['1', '99'], ['100']],
]) {
  test('FIX-006: limites com estoque ' + estoque, () => {
    const { input, alteracoes } = montar({ estoque, disponivel: true });
    assert.equal(input.props.max, limite);
    for (const valor of invalidos) mudar(input, valor);
    assert.deepEqual(alteracoes, []);
    for (const valor of validos) mudar(input, valor);
    assert.deepEqual(alteracoes, validos.map(valor => ['A', Number(valor)]));
  });
}
