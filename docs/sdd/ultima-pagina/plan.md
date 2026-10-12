# Plano de implementação — Acesso à última página

**Versão:** 1
**Estado:** Implementado — validação manual pendente
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** a1c60d6; 2026-10-11
**Objetivo:** permitir chegar à última página pelo botão Próxima.
**Arquitetura:** corrigir comparação no componente compartilhado Paginacao.
**Stack:** React 19, Vite 7, JavaScript ESM, node:test e react-dom/server.
**Aprovação do desenho:** usuário “aprovado”, em 2026-10-11.
**Aprovação para implementar:** 2026-10-11; usuário “aprovado”, após apresentação deste plano versão 1.
**Execução:** nesta sessão, sequencial, sem delegação.

## Restrições globais

REQ-01 a REQ-05: preservar props, callbacks, textos, visual, URL do catálogo,
estado de Pedidos e ocultação com 0/1 páginas. Sem API, ERP, schema, env,
dependências novas, pedidos reais ou normalização de parâmetros inválidos.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | frontend/src/componentes/ui.jsx | Comparação de limite de Próxima |
| Criar | frontend/tests/paginacao.test.js | Componente real, HTML e callbacks |
| Atualizar | docs/sdd/ultima-pagina/spec.md e plan.md | Aprovação, execução e aceite |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Evidências e pendências |

## Tarefa 1 — Regressão e correção compartilhada

**Cobertura:** AC-01 a AC-04 e AC-06; REQ-01/02/04/05.
**Interface:** Paginacao({ paginacao: { pagina, total_paginas, total }, aoMudar }).
O teste importa o módulo real completo transformado de JSX para JavaScript
com transformWithEsbuild, exportado pelo Vite já instalado. Não copiar função
nem extrair expressão de produção. O módulo ui.jsx não tem imports próprios;
o teste adiciona import absoluto de React para JSX clássico. Import via data
URL evita arquivo temporário, servidor Vite, watcher e leitura de .env.

- [x] Registrar aprovação explícita do plano e conferir status/diff antes de editar.
- [x] Criar frontend/tests/paginacao.test.js com o conteúdo:

```js
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
```

- [x] Executar em frontend/: `node --test tests/paginacao.test.js` antes da correção.
  Esperado RED em 1/2 e 2/3 pela propriedade disabled incorreta. Outros cenários
  devem passar. Se houver falha do harness, corrigir setup antes de aceitar RED.
- [x] Em frontend/src/componentes/ui.jsx/Paginacao trocar somente:

```jsx
disabled={pagina >= totalPaginas}
```

- [x] Reexecutar teste focado; esperado nove casos passando. Registrar números reais.
- [x] Executar `npm test` em frontend/ e backend/ e `npm run build` em frontend/.
  Esperado sucesso, preservando testes de busca/filtros, sessão e dinheiro.
- [x] Executar `git diff --check`; revisar diff: produção somente comparação.

## Tarefa 2 — Integração manual e documentação

**Cobertura:** AC-05/06; REQ-03. Consome callbacks existentes das telas, sem alterá-los.

- [ ] Catálogo: escolher resultado com pelo menos duas páginas; clicar Próxima
  até a última, verificar URL pagina e requisição GET do catálogo no Network.
  Na última Próxima desabilitada; Anterior permite voltar. Repetir mantendo
  busca/categoria/estoque na URL quando houver resultados suficientes.
- [ ] Pedidos: se histórico existente tiver pelo menos duas páginas, navegar
  até a última e voltar; verificar GET /api/pedidos com pagina correspondente.
  Não criar pedidos para aumentar histórico. Se insuficiente, registrar que
  integração manual desta tela não foi executada; teste compartilhado é isolado.
- [ ] Registrar validação manual somente quando realizada ou confirmada pelo
  usuário. HTML estático e callback direto não comprovam clique/navegação real.
- [x] Atualizar estado, aceites, RED/GREEN e pendências em spec/plano, inventário,
  relatório, investigação e índice SDD antes do commit. Separar CI e manual.
- [ ] Após autorização, commit `fix: permite acessar ultima pagina` e publicar
  branch fix/ultima-pagina. Abrir PR apenas após comando explícito; merge manual.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01/02 | Cinco cenários no componente real | Próxima habilitada até penúltima | Cinco cenários passaram |
| AC-03 | Props/HTML e callback Anterior | Limite inicial e decremento | Passou (props, HTML e callbacks) |
| AC-04 | Quatro casos null/0/1 | Retorno null | Quatro casos passaram |
| AC-05 | Manual catálogo/pedidos com dados existentes | Última página e filtros preservados | Não executado |
| AC-06 | Suítes backend/frontend, build e diff | Sucesso | Frontend 46/46; backend 35/35; build 60 módulos; diff passou |

## Migração, recuperação e autorrevisão

Sem migração; dados preservados. Reversão por commit, sem reset de banco.
Plano cobre componente real sem dependência nova nem refatoração. Teste conhece
a estrutura dos dois botões e precisará acompanhar mudança futura de layout;
esta unidade preserva layout. Os testes de callbacks não simulam DOM/browser.
Implementação aprovada e concluída; validação manual/CI e publicação pendentes.

## FIX-004 implementado — 2026-10-11

Usuário aprovou plano versão 1 com “aprovado”, após apresentação nesta sessão.
Branch fix/ultima-pagina. Produção: em Paginacao, comparação passou de
pagina >= totalPaginas - 1 para pagina >= totalPaginas. Nenhuma outra
alteração de produção, contrato, dependência, API, banco ou ERP nesta unidade.
Teste novo frontend/tests/paginacao.test.js carrega o módulo real transformado
pelo Vite existente, confere HTML renderizado e callbacks dos botões.
RED: nove testes, sete passaram e dois falharam (1/2 e 2/3). GREEN focado:
9/9; suíte frontend 46/46; backend 35/35; build passou com 60 módulos;
git diff --check passou. Sem servidor ou pedidos reais nos testes.
AC-01/02/03/04/06 comprovados por verificação isolada/regressões. AC-05 manual
pendente: percorrer catálogo até última página preservando filtros e voltar;
conferir pedidos apenas se histórico existente tiver páginas suficientes.
HTML/callback direto não equivalem a navegação real no navegador.
Estado Implementado. Sem commit, publicação ou PR; aguardar conferência e
comando do usuário. Registros anteriores descrevem etapas passadas.

## Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/ultima-pagina e abertura de PR para main. Checks locais concluídos;
validação manual não foi informada. CI remoto será acompanhado. Merge manual
pelo usuário; os registros anteriores de publicação pendente são históricos.
