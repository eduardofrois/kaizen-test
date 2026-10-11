import test from 'node:test';
import assert from 'node:assert/strict';
import { atualizarParametroCatalogo } from '../src/lib/parametrosCatalogo.js';

for (const [nome, chave, valor] of [
  ['nova busca', 'busca', 'amortecedor'],
  ['busca repetida', 'busca', 'pastilha'],
  ['busca vazia', 'busca', ''],
  ['categoria', 'categoria', 'MOTOR'],
  ['Todas', 'categoria', ''],
  ['estoque ligado', 'somente_disponiveis', true],
  ['estoque desligado', 'somente_disponiveis', false],
  ['remover com null', 'categoria', null],
]) {
  test('reinicia pagina: ' + nome, () => {
    const origem = new URLSearchParams('pagina=3&busca=pastilha&categoria=FREIOS&somente_disponiveis=true&extra=ok');
    const antes = origem.toString();
    const resultado = atualizarParametroCatalogo(origem, chave, valor);
    assert.equal(resultado.has('pagina'), false);
    assert.equal(Number(resultado.get('pagina') ?? '1'), 1);
    assert.equal(resultado.get(chave), valor === '' || valor === false || valor === null ? null : String(valor));
    for (const outra of ['busca', 'categoria', 'somente_disponiveis', 'extra']) {
      if (outra !== chave) assert.equal(resultado.get(outra), origem.get(outra));
    }
    assert.equal(origem.toString(), antes);
  });
}

test('paginacao explicita preserva filtros e entrada', () => {
  const origem = new URLSearchParams('pagina=1&busca=pastilha&categoria=FREIOS&somente_disponiveis=true');
  const antes = origem.toString();
  const resultado = atualizarParametroCatalogo(origem, 'pagina', 2);
  assert.equal(resultado.get('pagina'), '2');
  for (const chave of ['busca', 'categoria', 'somente_disponiveis']) {
    assert.equal(resultado.get(chave), origem.get(chave));
  }
  assert.equal(origem.toString(), antes);
});

test('primeira busca preserva encoding', () => {
  const resultado = atualizarParametroCatalogo(new URLSearchParams(), 'busca', 'direção & motor');
  assert.equal(new URLSearchParams(resultado.toString()).get('busca'), 'direção & motor');
  assert.equal(resultado.has('pagina'), false);
});
