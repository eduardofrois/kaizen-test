# Plano de implementação — Precisão monetária

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** d040365; 2026-10-11
**Objetivo:** eliminar perda de centavos em conversão, carrinho e vínculo local.
**Arquitetura:** corrigir conversão compartilhada; consumidores preservados.
**Stack:** JavaScript ESM, node:test, SQLite em memória e fetch fake existentes.
**Aprovação do desenho:** usuário “aprovado”, em 2026-10-11.
**Aprovação para implementar este plano:** usuário “aprovado”, em 2026-10-11, após apresentação deste plano versão 1.
**Execução:** sequencial nesta sessão, sem delegação automática.


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

REQ-01 a REQ-06. Domínio: valores finitos não negativos com até duas casas,
representáveis com somas/produtos em inteiros seguros. Sem precisão arbitrária,
EPSILON genérico, validação nova de entradas, histórico reparado, schema, env,
dependências, frontend ou SIAC alterados. Não criar pedidos reais.

## Mapa de arquivos

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Alterar | backend/src/lib/dinheiro.js | round em vez de floor |
| Criar | backend/tests/dinheiro.test.js | Conversão e ida/volta |
| Alterar | backend/tests/carrinho-total.test.js | Decimal no serviço real isolado |
| Criar | backend/tests/pedido-dinheiro.test.js | Gravação real SQLite com ERP fake |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Evidências e limites |
| Atualizar | docs/sdd/precisao-monetaria/spec.md e plan.md | Aprovação, aceite e resultados |

## Tarefa 1 — Regressões de conversão e carrinho

**Cobertura:** AC-01 a AC-03; REQ-01 a REQ-04.
**Consome:** paraCentavos(reais), paraReais(centavos), consultar(cenario) e
item(codigo, opcoes) do harness existente. Sem contrato novo.

- [x] Registrar aprovação explícita da versão 1 de spec/plano e conferir Git.
- [x] Criar backend/tests/dinheiro.test.js:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { paraCentavos, paraReais } from '../src/lib/dinheiro.js';

for (const [entrada, esperado] of [
  [0, 0], [1, 100], [0.29, 29], [1.15, 115], [4.10, 410],
  [19.99, 1999], [156.8, 15680], ['1.15', 115], ['19.99', 1999],
]) {
  test('converte ' + JSON.stringify(entrada) + ' sem perder centavos', () => {
    assert.equal(paraCentavos(entrada), esperado);
    assert.ok(Number.isSafeInteger(paraCentavos(entrada)));
  });
}

test('ida e volta conserva faixa representativa de centavos', () => {
  for (let centavos = 0; centavos <= 100000; centavos++) {
    assert.equal(paraCentavos(paraReais(centavos)), centavos, 'centavos=' + centavos);
  }
});
```

- [x] Acrescentar a backend/tests/carrinho-total.test.js, reutilizando harness:

```js
test('FIX-003: subtotais e total decimal preservam centavos', () => {
  const { carrinho } = consultar({ itens: [
    item('A', { preco: 1.15, quantidade: 3 }),
    item('B', { preco: 4.10, quantidade: 2 }),
    item('SEM', { preco: 19.99, estoque: 0 }),
  ] });
  assert.deepEqual(carrinho.itens.map(i => i.valor_total), [3.45, 8.20, 19.99]);
  assert.equal(carrinho.valor_total, 11.65);
  assert.equal(carrinho.quantidade_pecas, 6);
  assert.equal(carrinho.quantidade_itens, 3);
  assert.equal(carrinho.pronto_para_checkout, false);
});
```

- [x] Executar `node --test tests/dinheiro.test.js tests/carrinho-total.test.js`
  em backend/ antes da mudança. Registrar RED real; controles devem passar,
  casos decimais falhar. Não inventar quantidade de falhas.

## Tarefa 2 — Prova de gravação do total ERP

**Cobertura:** AC-04; REQ-05/06.
**Consome:** finalizarPedido(usuario, enderecoId, observacao, db), schema real.
**Produz:** teste de integração local do serviço com SQLite/ERP simulados;
sem alterar pedidoService ou reaproveitar modo GET-only do harness do carrinho.

- [x] Criar backend/tests/pedido-dinheiro.test.js com node:test/assert,
  spawnSync e cwd temporário, seguindo isolamento do carrinho-total.test.js.
  Subprocesso recebe somente PATH e env sintética: NODE_ENV=test,
  JWT_SEGREDO exclusivo de teste, ERP_URL=https://erp.invalid, ERP_TOKEN fake,
  DB_PATH apontando arquivo que não deve ser aberto. Importar serviço só após
  ambiente definido; injetar Database(':memory:') com schema real.
- [x] Inserir usuários sintéticos 1 e 2, endereço 1 pertencente a 1 e endereço
  2 pertencente a 2, itens A×1 de cada usuário. Usar SQL parametrizado com
  campos obrigatórios do schema; não copiar .env ou dados pessoais.
- [x] Substituir globalThis.fetch por implementação estrita: origem deve ser
  https://erp.invalid; GET /produtos/A responde produto ativo, estoque 10,
  preco_unitario=19.99; POST /pedidos captura JSON e responde número sintético,
  valor_total=19.99. Outros caminhos/métodos lançam erro; nunca chamar fetch real.
  Núcleo da resposta fake:

```js
if (url.pathname === '/produtos/A' && opcoes.method === 'GET') {
  return Response.json({ dados: { codigo: 'A', descricao: 'Teste',
    preco_unitario: 19.99, ativo: true, estoque: 10 } });
}
if (url.pathname === '/pedidos' && opcoes.method === 'POST') {
  posts.push(JSON.parse(opcoes.body));
  return Response.json({ dados: { numero: 'PED-SINTETICO-001', valor_total: 19.99 } });
}
throw new Error('requisicao fora do cenario');
```

- [x] Antes do caso feliz, chamar finalizarPedido com usuário 1/endereço 2;
  exigir rejeição 422 e posts.length=0. Caso feliz usa usuário 1/endereço 1.
- [x] Verificar gravação usando estas asserções no subprocesso:

```js
const pedido = await finalizarPedido({ id: 1, nome: 'Teste', documento: '00000000000' }, 1, '', db);
const vinculo = db.prepare('SELECT * FROM pedidos_usuario WHERE usuario_id = ?').get(1);
assert.equal(vinculo.valor_total_centavos, 1999);
assert.equal(pedido.valor_total, 19.99);
assert.equal(JSON.parse(vinculo.endereco_entrega).id, 1);
assert.equal(posts.length, 1);
assert.deepEqual(posts[0].itens, [{ codigo_produto: 'A', quantidade: 1 }]);
assert.equal(db.prepare('SELECT COUNT(*) AS total FROM carrinho_itens WHERE usuario_id = ?').get(1).total, 0);
assert.equal(db.prepare('SELECT COUNT(*) AS total FROM carrinho_itens WHERE usuario_id = ?').get(2).total, 1);
```

Verificar também numero_erp sintético, ausência de vínculo para usuário 2 e
observação contendo endereço sintético correto. O ERP fake é o único local
onde nasce pedido de teste; nenhuma escrita fora do banco em memória.
- [x] Fechar db em finally e remover cwd temporário depois do spawn. Processo
  pai exige status=0, timeout 10s e retorna somente evidência sintética.
- [x] Executar `node --test tests/pedido-dinheiro.test.js` em backend/ antes
  da correção; esperado falhar em centavos (1998 em vez de 1999), não em setup.
  Corrigir eventual fixture antes de aceitar RED como evidência do bug.

## Tarefa 3 — Correção compartilhada e entrega

**Cobertura:** todos os requisitos e AC-05.

- [x] Alterar somente paraCentavos em backend/src/lib/dinheiro.js:

```js
export function paraCentavos(reais) {
  return Math.round(Number(reais) * 100);
}
```

- [x] Executar `npm test` em backend/; esperado todos os casos novos/existentes
  passam, incluindo faixa de ida/volta, soma do carrinho e gravação 1999.
- [x] Executar `npm test` em frontend/, `npm run build` em frontend/,
  `node --check backend/src/lib/dinheiro.js` e `git diff --check` na raiz.
  Registrar quantidades/resultados reais sem antecipá-los.
- [x] Revisar diff: produção alterada apenas no helper. Serviços preservam
  cálculos em centavos, total filtrado e isolamento; sem migração de pedidos.
- [ ] Roteiro manual opcional: comparar preço×quantidade e soma no carrinho
  usando peças existentes; não criar pedido. Se preços disponíveis não
  reproduzem aproximação, usar provas isoladas e registrar essa limitação.
- [x] Atualizar SDD, inventário e relatório com RED/GREEN, domínio de duas
  casas, ausência de reparo histórico e distinção de ERP fake versus real.
- [x] Quando autorizado, commit `fix: preserva centavos na conversao monetaria`
  e publicar branch. PR somente com comando do usuário; merge manual.

## Matriz de validação

A confirmação manual consolidada é do usuário. Passos instrumentados que
continuam sem marcação não têm execução específica registrada; são o roteiro
original, sem atribuir à IA interceptações ou medições que não realizou.

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Nove conversões tabeladas | Centavos exatos | Nove casos passaram |
| AC-02 | Strings + 0..100000 centavos | Ida/volta estável na faixa | 100001 valores passaram |
| AC-03 | Serviço real/schema em memória | 3.45+8.20=11.65; pendência excluída | Passou |
| AC-04 | Pedido com ERP fake/SQLite | 1999 persistido, posse/limpeza preservadas | Passou com SQLite/ERP fake |
| AC-05 | Suítes/build/diff | Sucesso | 35 backend + 37 frontend; build 60 módulos; sintaxe/diff passaram |

## Migração, recuperação e autorrevisão

Sem migração nem correção retroativa. Reversão por commit, sem reset de banco.
Faixa testada não prova todo intervalo Number nem valores de precisão extra.
Plano cobre desenho aprovado com produção mínima e testes dos consumidores
reais. Implementação aprovada e validada localmente; publicação aguarda comando do usuário.

## Histórico — Resultado da execução — 2026-10-11

RED conjunto dos três arquivos: 29 testes, 20 passaram e 9 falharam. Falhas
monetárias reais: subtotais [3.42,8.18,19.98], conversões truncadas, ida/volta
em 29 e gravação SQLite 1998 em vez de 1999. Setup do pedido funcionou.
Após troca para round: npm test backend 35/35; frontend 37/37; build passou
com 60 módulos. Sintaxe e diff passaram. Os 12 testes novos incluem nove
entradas, ida/volta, carrinho e pedido; preservados os 23 testes backend prévios.
Somente helper alterado em produção. Manual opcional e CI não executados;
nenhum pedido real, mudança de env/schema ou reparo histórico. Sem commit/PR.

## Histórico — Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/precisao-monetaria e abertura do PR para main. Validação local concluída;
CI remoto será acompanhado. Validação manual não foi informada. Merge manual
pelo usuário; nenhuma autorização para integrar diretamente na main.

## Histórico — Publicação da correção — 2026-10-11

Commit de implementação: 3f584ce. Branch fix/precisao-monetaria publicada.
PR #9: https://github.com/eduardofrois/kaizen-test/pull/9
Checks testes-backend e build-frontend passaram no run 38187488965,
commit 3f584ce: https://github.com/eduardofrois/kaizen-test/actions/runs/38187488965
Esta atualização documental gera nova execução de CI a acompanhar.
Merge permanece manual e pendente.
Validação manual não informada; ERP real não utilizado nos testes.
Os registros anteriores de publicação pendente descrevem etapas passadas.

## Consolidação documental — 2026-10-12

Validação manual da correção concluída pelo usuário, conforme confirmação
registrada no início. Evidências automatizadas e CI anteriores preservadas.
Pendências manuais nos relatos históricos descrevem a informação disponível
à época. Cenários sem detalhamento individual continuam identificados como
limite de evidência, não como ausência de validação manual da correção.
Nenhum código, teste, contrato, dependência, banco ou ERP alterado nesta revisão.
