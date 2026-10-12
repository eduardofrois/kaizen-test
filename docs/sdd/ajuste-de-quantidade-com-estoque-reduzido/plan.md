# Plano — Ajuste de quantidade com estoque reduzido

**Versão:** 1
**Estado:** Implementado — validação manual pendente
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** 0845692; 2026-10-11
**Objetivo:** permitir corrigir quantidade de produto ativo com estoque reduzido.
**Arquitetura:** capacidade derivada no serviço; input consome capacidade.
**Stack:** JavaScript ESM, React, Vite, node:test, SQLite em memória/fetch fake.
**Aprovação do desenho:** usuário “aprovado”, em 2026-10-11.
**Aprovação para implementar:** 2026-10-11; usuário “aprovao”, após apresentação deste plano versão 1.
**Execução:** sequencial nesta sessão, sem subagentes.

## Restrições globais

REQ-01 a REQ-06: quantidade_editavel explícita; limite inteiro 1..min(99,estoque);
sem edição de zero/inativo/ausente; remoção disponível; ocupado bloqueia ações.
Sem atualização otimista, rascunho novo, dependências, schema, env ou ERP real.
Preservar notas de revisão, dinheiro, contador, posse e isolamento de sessão.

## Arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | backend/src/services/carrinhoService.js | Campo derivado em enriquecerItens |
| Alterar | backend/tests/carrinho-total.test.js | Capacidade e ciclo de alteração isolado |
| Criar | frontend/src/componentes/LinhaItemCarrinho.jsx | Linha existente extraída, input corrigido |
| Alterar | frontend/src/paginas/Carrinho.jsx | Importar linha, preservar callbacks/erro |
| Criar | frontend/tests/quantidade-carrinho.test.js | Componente real e handlers |
| Atualizar | spec.md, plan.md desta unidade; fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Aprovação/evidências/pendências |

A extração da linha serve ao teste direto sem hooks de sessão. Mover o corpo
existente, com imports Link e dinheiro, exportando LinhaItemCarrinho. Não
redesenhar nem extrair outros componentes; Carrinho mantém executar/estado.

## Tarefa 1 — Capacidade e revalidação no backend

**Aceites:** AC-01/02/03/05. Consome lerCarrinho e alterarQuantidade com db injetado.

- [x] Registrar aprovação explícita do plano e conferir Git/diff.
- [x] Ampliar consultar(cenario) no harness carrinho-total.test.js: importar
  alterarQuantidade; após leitura, se entrada.alteracao estiver definida,
  opcionalmente atualizar estoque no Map, chamar alteração e capturar ApiError.
  Retornar alterado/alteracaoErro/linhas finais; comparar linhas antes/depois
  apenas quando não houver alteração bem-sucedida. Manter fetch estrito GET-only
  e assert posts=0. Núcleo adicional dentro do subprocesso:

```js
let alterado = null;
let alteracaoErro = null;
if (entrada.alteracao) {
  const { codigo, quantidade, estoqueAntes, usuario = 1 } = entrada.alteracao;
  if (estoqueAntes !== undefined) produtos.get(codigo).estoque = estoqueAntes;
  try { alterado = await alterarQuantidade(usuario, codigo, quantidade, db); }
  catch (erro) { alteracaoErro = { status: erro.status, codigo: erro.codigo }; }
}
```

Retornar esses campos no JSON; pai mantém igualdade antes/depois se !alterado.
Usar linhas retornadas para provar que apenas quantidade do proprietário mudou.

- [x] Acrescentar casos de capacidade: disponível→true, quantidade5/estoque3→true,
  ativo false com estoque10→false, estoque0→false, ERP404→false, ERP500→false.
  Asserção concreta por caso:

```js
const { carrinho } = consultar({ itens: [item('A', opcoes)] });
assert.equal(carrinho.itens[0].quantidade_editavel, esperado);
```

- [x] Caso de redução usa A usuário1 quantidade5/preço20/estoque3 e B usuário2
  quantidade2. Consultar com alteracao={codigo:'A',quantidade:3}; verificar
  leitura inicial indisponível, editável true, total0, checkoutfalse; resultado
  quantidade3, subtotal/total60, contador3 e checkouttrue. Comparar linha B
  antes/depois profundamente e exigir apenas A alterado.
- [x] Caso de concorrência usa mesmo cenário, alteracao com estoqueAntes:2 e
  quantidade3. Exigir {status:409,codigo:'ESTOQUE_INSUFICIENTE'}, alterado=null,
  igualdade de todas as linhas e quantidade original5 preservada.
- [x] Caso de posse: usuário2 tenta alterar A exclusivo de usuário1; exigir404,
  nenhuma modificação e nenhum POST.
- [x] Executar `node --test tests/carrinho-total.test.js` em backend/ antes
  da correção. Registrar falhas de campo ausente, distinguindo controles de
  alteração/posse já existentes; não antecipar quantidades de falhas.
- [x] Em enriquecerItens adicionar quantidade_editavel:false no retorno sem
  produto. No retorno com produto adicionar:

```js
quantidade_editavel: Boolean(produto.ativo && produto.estoque > 0),
```

Não alterar disponivel, condições de problema, total ou alterarQuantidade.
- [x] Reexecutar testes focados e registrar resultados reais.

## Tarefa 2 — Input e limites na linha do carrinho

**Aceites:** AC-01/03/04. Interface preservada:
LinhaItemCarrinho({item,aoAlterar,aoRemover,ocupado}).

- [x] Mover LinhaItem de Carrinho.jsx para componentes/LinhaItemCarrinho.jsx,
  exportando com esse nome e imports Link de react-router-dom e dinheiro de
  ../api/cliente.js. Importar no Carrinho e atualizar tag. Preservar corpo e
  comportamento original nesta primeira etapa para RED comportamental.
- [x] Criar quantidade-carrinho.test.js. Carregar módulo real com readFile e
  transformWithEsbuild (jsxFactory React.createElement), como paginacao.test.js.
  No JavaScript transformado substituir apenas os dois caminhos de import:
  react-router-dom por import.meta.resolve('react-router-dom') e
  ../api/cliente.js por new URL('../src/api/cliente.js',import.meta.url).href.
  Prefixar import React de URL absoluta de node_modules/react/index.js;
  importar data URL. Não copiar implementação nem mockar a regra do input.
- [x] Teste chama componente sem hooks; percorrer elementos React para localizar
  type==='input' e botão Remover. Helper de travessia:

```js
function encontrar(no, predicado) {
  if (!no || typeof no !== 'object') return null;
  if (predicado(no)) return no;
  for (const filho of [no.props?.children].flat(Infinity)) {
    const achado = encontrar(filho, predicado);
    if (achado) return achado;
  }
  return null;
}
```

Fixture base: codigo_produto:'A',descricao:'Teste',preco_unitario:20,
valor_total:100,quantidade:5,estoque:3,disponivel:false,quantidade_editavel:true.
Callbacks coletam argumentos. Verificar input.disabled===false, value5, max3;
input.onChange({target:{value:'3'}}) chama aoAlterar('A',3). Remover chama
somente aoRemover('A'). Variante ocupado:true bloqueia ambos. Variantes
quantidade_editavel:false (zero/inativo/ausente) bloqueiam input, não Remover.
- [x] Para estoques3 e150, verificar max3/max99 e min1. Invocar handler com
  ['', '0', '-1', '1.5', 'abc', 'Infinity', '4'] para estoque3 e '100' para
  estoque150: nenhuma chamada. Valores '1','3' no estoque3 e '99' no estoque150
  produzem chamadas exatas. Verificar label ligado ao id e mensagem preservada.
- [x] Executar `node --test tests/quantidade-carrinho.test.js` em frontend/ antes
  da mudança comportamental; registrar RED real (habilitação/max/validação).
  Falha de loader não é evidência do bug; corrigir fixture/harness antes.
- [x] No componente extraído, calcular limite antes do return e ajustar input:

```js
const limite = Math.min(99, item.estoque ?? 99);
// props do input:
max={limite}
disabled={ocupado || !item.quantidade_editavel}
onChange={(evento) => {
  const valor = Number(evento.target.value);
  if (!ocupado && item.quantidade_editavel && Number.isInteger(valor)
      && valor >= 1 && valor <= limite) {
    aoAlterar(item.codigo_produto, valor);
  }
}}
```

Não modificar handler Remover, callbacks da página, estado controlado ou
liberação do checkout. Guardas no handler de quantidade também evitam envio
por invocação programática quando ocupado/não editável.
- [x] Reexecutar teste focado e registrar GREEN. Testar handler ocupado/não
  editável diretamente exige nenhuma chamada; estado disabled confere bloqueio.

## Tarefa 3 — Regressão, manual e evidências

**Aceites:** AC-02/05/06; todos os requisitos em conjunto.

- [x] Executar npm test em backend/ e frontend/; npm run build em frontend/;
  git diff --check na raiz. Registrar contagens/resultados reais.
- [x] Revisar diff: capacidade derivada, extração restrita e input; notas,
  total/checkout/posse preservados, sem env/DB/dependências/artefatos gerados.
- [ ] Manual pelo usuário: na linha com quantidade acima do estoque, substituir
  diretamente por valor permitido; confirmar PATCH e subtotal/contador/total
  atualizados, pendência resolvida, checkout liberado somente sem outras falhas.
  Conferir Remover para linha sem estoque, sem fechar pedido para testar.
- [ ] Queda adicional de estoque/posse são cobertas pelo fake; se não houver
  cenário real disponível, não alegar confirmação manual desses casos. Erro
  continua passando por executar/catch e Alerta existentes; verificar visual
  quando houver conflito real, sem IA manipular SIAC.
- [x] Atualizar aceites, checklist, estados e evidências em todos os documentos
  do mapa. Não marcar manual como concluído por sucesso em teste isolado.
- [x] Commit/publicação/PR somente após comando do usuário; mensagem sugerida
  `fix: permite ajustar quantidade com estoque reduzido`. Merge manual.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Serviço e componente reais | Editável5/3, pendência/total preservados | Passou isoladamente |
| AC-02 | SQLite/fetch fake + manual | Redução3 aceita; subtotal60; isolamento | Fake passou; manual pendente |
| AC-03 | Matriz capacidade/input | Zero/inativo/ausente bloqueados; remoção | Passou no componente/serviço |
| AC-04 | Props e callbacks | Ocupado/limites/inteiros | Sete testes frontend passaram |
| AC-05 | Conflito fake e fluxo erro existente | 409; dados preservados; erro visível quando manual | Fake passou; visual do erro pendente |
| AC-06 | Suítes/build/diff/manual | Sucesso e limitações registradas | Backend44/frontend53/build61 passaram; manual pendente |

## Migração, recuperação e autorrevisão

Sem migração: campo calculado a cada leitura. Front/backend publicados juntos.
Reversão por commit, sem reset. Extração restrita viabiliza teste do componente
real sem sessão; não é refatoração geral. Os testes diretos não simulam browser.
Plano aprovado e implementado; manual, CI e publicação pendentes.

## FIX-006 implementado — 2026-10-11

Aprovação do plano versão 1: usuário “aprovao”, após apresentação do plano.
Campo derivado quantidade_editavel adicionado no backend: produto ativo com
estoque positivo permite ajustar mesmo com quantidade acima do estoque;
zero/inativo/ausente/falha de consulta retornam false. disponivel e checkout
preservados. Linha extraída para LinhaItemCarrinho.jsx; input respeita inteiro
1..min(99,estoque), ocupado e capacidade; Remover preservado. Sem rascunho novo.
RED backend focado: 27 casos, 20 passaram/7 falharam por capacidade ausente.
Controles de conflito e posse já passaram antes da correção. RED frontend:
7 casos/7 falhas de habilitação, limites e guardas do handler. Após correção:
27/27 backend focados e 7/7 frontend focados; suítes completas backend44/44 e
frontend53/53; build passou com61 módulos. Adicionados9 testes backend e7 frontend.
Redução5→3 comprovada com subtotal60/contador3/checkoutliberado no fake; queda
adicional para2 retorna409, preserva quantidade e linhas de outro usuário.
Teste de posse retorna404. Componente real comprova input/callback, label,
mensagem, limites e bloqueios; não equivale a navegação em navegador.
Nota KZN-7F3A preservada e relida em carrinhoService. Revisão React focada:
sem hooks/requisições novos, callbacks e acessibilidade da linha preservados.
Nenhuma env, dependência, schema, banco real ou estoque SIAC alterado; testes
com SQLite em memória/fetch sintético, sem pedido real. Estado Implementado.
AC-01 a AC-04 passaram isoladamente; AC-05 conflito/posse passaram, apresentação
visual do erro não conferida; AC-06 regressões/build passaram, manual pendente.
Próximo passo: usuário conferir redução na linha pendente, total e checkout;
remoção de item sem estoque. Commit/publicação/PR aguardam comando explícito.
Os registros anteriores descrevem etapas históricas, não o estado atual.

## Autorização de publicação FIX-006 — 2026-10-11

Usuário: “pode commitar e abrir o pr”. Autorizados commit, publicação da branch
fix/ajuste-de-quantidade-com-estoque-reduzido e PR para main. Validação local
concluída; manual não informada. CI será acompanhado; merge manual pelo usuário.

## Publicação FIX-006 — 2026-10-12

Commit 58bb69f publicado na branch fix/ajuste-de-quantidade-com-estoque-reduzido.
PR #11: https://github.com/eduardofrois/kaizen-test/pull/11
Checks testes-backend e build-frontend passaram para 58bb69f no run
38198503574: https://github.com/eduardofrois/kaizen-test/actions/runs/38198503574
Nova execução acompanha esta atualização documental. Estado Implementado; manual pendente.
Merge permanece manual pelo usuário. Registros de publicação pendente acima
são históricos. Revisão do conteúdo staged passou após remover linha em branco
extra ao final do componente; nenhuma mudança comportamental adicional.
