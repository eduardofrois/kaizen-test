import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';

const fonte = await readFile(new URL('../src/componentes/ui.jsx', import.meta.url), 'utf8');
const { code } = await transformWithEsbuild(fonte, 'ui.jsx', {
  loader: 'jsx', jsx: 'transform',
  jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
});
const reactUrl = new URL('../node_modules/react/index.js', import.meta.url).href;
const modulo = 'import React from ' + JSON.stringify(reactUrl) + ';\n' + code;
const { Paginacao } = await import('data:text/javascript;base64,' + Buffer.from(modulo).toString('base64'));

function montar(pagina, totalPaginas) {
  const chamadas = [];
  const arvore = Paginacao({
    paginacao: { pagina, total_paginas: totalPaginas, total: 30 },
    aoMudar: nova => chamadas.push(nova),
  });
  const elementos = arvore.props.children[1].props.children;
  const botoes = elementos.map(elemento => elemento.type(elemento.props));
  return { arvore, botoes, chamadas };
}

for (const [pagina, total, anterior, proxima] of [
  [1, 2, true, false], [2, 2, false, true],
  [1, 3, true, false], [2, 3, false, false], [3, 3, false, true],
]) {
  test('limites e callbacks em ' + pagina + '/' + total, () => {
    const { arvore, botoes, chamadas } = montar(pagina, total);
    assert.deepEqual(botoes.map(b => b.props.disabled), [anterior, proxima]);
    const html = renderToStaticMarkup(arvore);
    const tags = html.match(/<button\b[^>]*>/g);
    assert.equal(tags.length, 2);
    assert.deepEqual(tags.map(tag => /\bdisabled=/.test(tag)), [anterior, proxima]);
    assert.match(html, /aria-label="Paginacao"/);
    assert.ok(html.includes('Página ' + pagina + ' de ' + total));
    const esperadas = [];
    if (!anterior) { botoes[0].props.onClick(); esperadas.push(pagina - 1); }
    if (!proxima) { botoes[1].props.onClick(); esperadas.push(pagina + 1); }
    assert.deepEqual(chamadas, esperadas);
  });
}

for (const paginacao of [undefined, null, { pagina: 1, total_paginas: 0 }, { pagina: 1, total_paginas: 1 }]) {
  test('oculta paginacao: ' + JSON.stringify(paginacao), () => {
    assert.equal(Paginacao({ paginacao, aoMudar: () => assert.fail('nao deve navegar') }), null);
  });
}
