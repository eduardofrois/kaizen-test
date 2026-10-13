# Plano de implementação — Contador do carrinho

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** b8f6abf; 2026-10-11
**Objetivo:** contar unidades mantendo produtos distintos e regras do total.
**Arquitetura:** agregação central em lerCarrinho; consumidores React existentes.
**Stack:** JavaScript ESM, node:test, SQLite better-sqlite3, React/Vite existentes.
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11; mensagem do usuário: “aprovado os documentos”.
**Execução:** nesta sessão após aprovação, sem delegação automática.


**Validação manual atual — 2026-10-12:** concluída pelo usuário. Referência:
“Agora eu preciso que voce revise os arquivos e mude aonde fala que eu nao fiz
a validação manual, pois eu fiz.” A confirmação complementa as evidências
anteriores; não acrescenta execução pela IA, capturas por variante, exploração
de segurança ou pedido real no SIAC. Requisitos e aprovações de implementação
permanecem os já registrados. Esta revisão documental não autoriza publicação.

> Leitura atualizada em 2026-10-13, referência main 76eca4d. O problema e
> os exemplos de execução abaixo descrevem a baseline e o escopo original
> da unidade. Relatos datados preservam o estado conhecido naquela etapa.
> Contratos evoluídos e pendências atuais: [índice SDD](../README.md).

## Restrições globais

REQ-01 a REQ-07 da spec. Não alterar frontend, schema, dinheiro.js, contratos,
limites, .env ou dependências. Sem banco/ERP reais nos testes, reset ou merge.
Somar todas as quantidades, inclusive pendências; preservar KZN-312.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | backend/src/services/carrinhoService.js | Cálculo de quantidade_pecas |
| Alterar | backend/tests/carrinho-total.test.js | Reutilizar harness isolado do serviço real |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md | Evidências e pendências |
| Atualizar | docs/sdd/contador-do-carrinho/spec.md e plan.md | Aprovação, aceite e resultados |

Reutilizar consultar(cenario) e item(codigo, opcoes) existentes evita duplicar
schema, subprocesso e mock ERP. O nome do arquivo de teste permanece para
evitar refatoração alheia; ele passa a cobrir também contadores do mesmo resumo.

## Tarefa 1 — Regressão e soma central

**Cobertura:** REQ-01 a REQ-07; AC-01 a AC-04 e parte automatizada de AC-06.
**Consome:** lerCarrinho(1, db), consultar({ itens }), item(codigo, opcoes).
**Produz:** mesmo retorno com quantidade_pecas corrigida; nenhum contrato novo.

- [x] Registrar mensagem/data da aprovação desta versão; conferir Git e marcar Em implementação.
- [x] Acrescentar ao fim de backend/tests/carrinho-total.test.js:

```js
for (const [nome, itens, pecas, distintos] of [
  ['3+4 unidades', [item('A', { quantidade: 3 }), item('B', { quantidade: 4 })], 7, 2],
  ['uma linha', [item('A', { quantidade: 5 })], 5, 1],
  ['vazio', [], 0, 0],
  ['acima de 99', [item('A', { quantidade: 99, estoque: 100 }), item('B', { quantidade: 2 })], 101, 2],
  ['outro usuario', [item('A', { quantidade: 3 }), item('B', { usuario: 2, quantidade: 4 })], 3, 1],
]) {
  test('KZN-318: contador com ' + nome, () => {
    const { carrinho } = consultar({ itens });
    assert.equal(carrinho.quantidade_pecas, pecas);
    assert.equal(carrinho.quantidade_itens, distintos);
  });
}

test('KZN-318: pendencia conta unidades sem entrar no total', () => {
  const { carrinho } = consultar({ itens: [
    item('OK', { quantidade: 3 }),
    item('SEM', { quantidade: 4, estoque: 0 }),
  ] });
  assert.equal(carrinho.quantidade_pecas, 7);
  assert.equal(carrinho.quantidade_itens, 2);
  assert.equal(carrinho.valor_total, 60);
  assert.equal(carrinho.pronto_para_checkout, false);
});
```

O harness já verifica snapshots SQLite iguais antes/depois e zero POST ao ERP.

- [x] Em backend/, executar `node --test tests/carrinho-total.test.js` antes
  da correção. Esperado: casos de múltiplas unidades falham no contador;
  vazio e regressões KZN-312 passam. Registrar contagem RED observada.
- [x] Em lerCarrinho, substituir somente a propriedade por:

```js
quantidade_pecas: itens.reduce((soma, item) => soma + item.quantidade, 0),
```

- [x] Executar `npm test` em backend/; esperado 23 testes passando (17 existentes
  e seis novos). Registrar resultado real, não tratar previsão como evidência.
- [x] Executar `node --check src/services/carrinhoService.js` em backend/.
- [x] Executar `npm run build` em frontend/ e `git diff --check` na raiz.

## Tarefa 2 — Consumidores e entrega

**Cobertura:** AC-05 e AC-06. Sem mudança de componente prevista.

- [x] Na mesma conta, usar duas peças disponíveis com estoque suficiente:
  ajustar quantidades para 3 e 4; conferir badge 7 e resumo 7.
- [x] Alterar 4 para 2: conferir 5; remover a linha ×2: conferir 3.
- [x] Dar F5: conferir 3; remover a última linha: resumo zero e badge oculto.
  Não fazer checkout. Registrar se executado pela IA ou confirmado pelo usuário.
- [x] Inspecionar Cabecalho.jsx: expressão >99 continua mostrando 99+ e
  aria-label usa quantidade_pecas exata; Carrinho.jsx mostra o número exato.
  Caso 101 provado automaticamente; não alegar teste visual sem executá-lo.
- [x] Atualizar documentos com causa, RED/GREEN, resultados, limitações e aceite.
  Manter FIX-003/FIX-005 fora do escopo e não adicionar histórico ao AGENTS.
- [x] Revisar diff e arquivos gerados; quando autorizado, commit sugerido
  `fix: soma unidades no contador do carrinho`, publicando somente esta branch.
- [x] Aguardar comando explícito para abrir PR; acompanhar testes-backend e
  build-frontend quando autorizado. Merge manual pelo usuário.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | 3+4 e uma linha | 7/2 e 5/1 | Passou |
| AC-02 | vazio e 101 | 0/0 e 101/2 | Passou |
| AC-03 | pendência + regressões KZN-312 | 7 peças, total 60, bloqueado | Passou |
| AC-04 | dois usuários + snapshot do harness | 3/1; banco intacto | Passou |
| AC-05 | roteiro manual + inspeção dos consumidores | 7→5→3→0; 99+ preservado | Confirmado pelo usuário; inspeção de 99+/aria-label preservados |
| AC-06 | npm test, build, diff e CI autorizada | Sucesso sem dependências novas | 23 testes/build locais e ambos os checks do PR #5 passaram |

## Migração e recuperação

Sem schema ou migração. Recuperação por reversão do commit via fluxo Git,
sem reset de banco ou alteração no ERP.

## Autorrevisão e histórico

Todos os requisitos cobertos pelas duas tarefas; testes usam serviço real e
infraestrutura isolada já existente. Execução realizada após aprovação explícita
da versão 1; roteiro manual confirmado e publicação registrada no histórico.

## Histórico — Execução aprovada — 2026-10-11

Versão 1 aprovada pela mensagem “aprovado os documentos”. Implementação
limitada à soma de item.quantidade em quantidade_pecas. quantidade_itens,
total filtrado do KZN-312, nota KZN-7F3A e checkout preservados.
Seis regressões acrescentadas ao harness isolado existente, sem dependências.

RED: node --test tests/carrinho-total.test.js antes da correção — 17 testes,
12 passaram e cinco falharam no contador; exemplo 3+4 retornou 2 em vez de 7.
GREEN: npm test após a correção — 23 testes passaram (17 de carrinho e seis
configuração). SQLite em memória, fetch simulado e subprocesso com ambiente
sintético; sem .env, banco local ou ERP real. Snapshots preservados e zero POST.
node --check backend/src/services/carrinhoService.js e build frontend passaram;
build transformou 58 módulos. Inspeção confirmou badge 99+, aria-label exato
e resumo consumindo quantidade_pecas. Isso não substitui validação visual.

Estado Implementado: validação automatizada local concluída; roteiro manual
7→5→3→0 e persistência após F5 aguardam confirmação do usuário.
PR não aberto; checks remotos não executados. FIX-003/FIX-005 não corrigidos.
Também atendida a solicitação de usar “usuário” nas referências documentais.

## Histórico — Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “validado, pode subir o pr” após o roteiro de validação
local. Validação manual pós-correção confirmada pelo usuário; não executada
pela IA. Publicação da branch e abertura de PR autorizadas nesta mensagem.
Testes locais: 23 passaram; build passou. Checks remotos ainda pendentes.
Merge permanece manual pelo usuário. Pendências manuais descritas anteriormente
são registros históricos superados por esta confirmação.

## Histórico — Validação remota de KZN-318 — 2026-10-11

PR #5: https://github.com/eduardofrois/kaizen-test/pull/5
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38177680580
Checks testes-backend e build-frontend passaram no commit ea3bc6a.
Estado Validado: critérios da versão 1 concluídos com regressões isoladas,
build local, confirmação manual do usuário e CI do PR. Merge manual pendente.
Registros anteriores de espera por validação/abertura/CI são históricos.
FIX-003 e FIX-005 continuam fora do escopo; nenhum merge ou deploy realizado.
