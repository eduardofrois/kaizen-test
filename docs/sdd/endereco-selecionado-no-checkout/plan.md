# Plano de implementação — Endereço selecionado no checkout

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** 6fab792; 2026-10-11
**Objetivo:** enviar o endereço efetivamente selecionado.
**Arquitetura:** estado React existente como fonte do ID; backend preservado.
**Stack:** React/JavaScript ESM, fetch e testes existentes.
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11; mensagem do usuário: “aprovado”.
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

REQ-01 a REQ-06. Sem alteração de backend, schema, dependências, env ou dados.
Sem pedidos reais como efeito de validação; interceptar POST no navegador.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | frontend/src/paginas/Checkout.jsx | Usar enderecoId no envio |
| Atualizar | docs/sdd/endereco-selecionado-no-checkout/spec.md e plan.md | Aprovação/aceite/evidências |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Situação real da unidade |

## Tarefa 1 — Evidência do payload e correção mínima

**Cobertura:** AC-01 a AC-04; REQ-01 a REQ-06.
**Consome:** enderecoId, observacao, api.pedidos.criar(payload).
**Produz:** contrato existente com ID da seleção real.

- [x] Registrar aprovação explícita, conferir Git e marcar Em implementação.
- [ ] Abrir checkout com itens disponíveis e dois endereços já existentes;
  instalar no console do navegador antes de clicar em Confirmar:

```js
window.__kaizenFetchOriginal = window.fetch;
window.__kaizenPedidosCapturados = [];
window.fetch = async (entrada, opcoes = {}) => {
  const url = new URL(entrada instanceof Request ? entrada.url : entrada, location.href);
  const metodo = (opcoes.method ?? (entrada instanceof Request ? entrada.method : 'GET')).toUpperCase();
  if (url.origin === location.origin && url.pathname === '/api/pedidos' && metodo === 'POST') {
    window.__kaizenPedidosCapturados.push(JSON.parse(opcoes.body));
    return new Response(JSON.stringify({ erro: {
      codigo: 'TESTE_INTERCEPTADO', mensagem: 'Pedido bloqueado para validar endereco.'
    } }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }
  return window.__kaizenFetchOriginal(entrada, opcoes);
};
```

Não executar o snippet duas vezes sem restaurar o fetch. Se não houver acesso
ao navegador de teste, fornecer roteiro ao usuário e registrar a fonte da confirmação.
A confirmação geral foi recebida em 2026-10-12; não atribuir interceptação à IA.
Não imprimir endereço, documento ou observação pessoal em logs compartilhados.

- [ ] Escolher B diferente do principal A e clicar Confirmar. Inspecionar apenas
  endereco_id do corpo capturado e comparar com radio selecionado. RED esperado:
  envia A. Conferir erro sintético; não houve POST real de pedido.
- [x] Em finalizar(), remover comentário e variável entrega; substituir por:

```js
const resposta = await api.pedidos.criar({ endereco_id: enderecoId, observacao });
```

Preservar try/catch/finally, recarregar e navegar.

- [ ] Recarregar página, reinstalar interceptação e repetir B: esperado ID B.
- [ ] Testar seleção inicial sem mudar radio: esperado ID inicialmente marcado.
- [ ] Endereço novo: usar somente ambiente de teste e autorização para cadastro
  local; salvar sem torná-lo principal, selecionar e conferir ID no payload.
  Se não autorizado/disponível, registrar o limite de evidência da variante, sem criar dados.
- [ ] Preservação da observação: usar texto sintético “Teste de entrega”; conferir
  corpo capturado. Sem carrinho apto/seleção, verificar bloqueio do botão.
- [ ] Restaurar fetch ao terminar:

```js
window.fetch = window.__kaizenFetchOriginal;
delete window.__kaizenFetchOriginal;
delete window.__kaizenPedidosCapturados;
```

Uma recarga também remove a interceptação. Não confirmar novamente sem bloqueio.

## Tarefa 2 — Regressões e entrega

**Cobertura:** AC-05 e revisão de invariantes.

- [x] Executar `npm test` em frontend/ e backend/. Esperado: dez testes frontend
  e 23 backend passam. São regressões existentes; não provam o payload do checkout.
- [x] Executar `npm run build` em frontend/ e `git diff --check` na raiz.
- [x] Inspecionar diff: alteração de aplicação somente no envio; radios,
  seleção inicial, enderecoSalvo e disabled permanecem. Conferir backend
  buscarEndereco(usuario.id, enderecoId) e snapshot sem alterá-los.
- [x] Atualizar documentos com causa, provas realmente executadas e pendências.
  Não declarar teste integrado do ERP nem criação de pedido sem evidência.
- [x] Quando autorizado, commit `fix: usa endereco selecionado no checkout`;
  publicar branch, aguardar comando para PR e acompanhar checks autorizados.
  Merge manual pelo usuário.

## Matriz de validação

A confirmação manual consolidada é do usuário. Passos instrumentados que
continuam sem marcação não têm execução específica registrada; são o roteiro
original, sem atribuir à IA interceptações ou medições que não realizou.

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Payload informado pelo usuário após validação | ID selecionado | Usuário confirmou endereco_id=2; criação de pedido não informada |
| AC-02 | Request interceptado com seleção inicial | ID marcado | manual confirmado pelo usuário em 2026-10-12; sem detalhamento por variante |
| AC-03 | Novo endereço/observação sintética | ID novo e texto preservado | manual confirmado pelo usuário em 2026-10-12; sem detalhamento por variante |
| AC-04 | Botão e erro sintético | Guarda/erro preservados | manual confirmado pelo usuário em 2026-10-12; sem detalhamento por variante |
| AC-05 | Suítes/build/diff | Sucesso; evidências diferenciadas | Frontend 10 e backend 23 passaram; build/diff passaram |

## Migração e recuperação

Sem schema ou migração. Reversão pelo fluxo Git, sem reset de banco/ERP.
Interceptação é temporária e deve ser removida no navegador após teste.

## Autorrevisão e histórico

Mudança mínima cobre o desvio identificado sem novas abstrações. Prova principal
é o request do componente real. Testes existentes não são apresentados como
regressão específica do KZN-331. Implementação concluída; payload selecionado e validação manual confirmados pelo usuário.

## Histórico — Implementação de KZN-331 — 2026-10-11

Versão 1 aprovada pelo usuário: “aprovado”. Checkout.jsx/finalizar passou a
enviar { endereco_id: enderecoId, observacao }, removendo a busca pelo principal
no envio. Seleção inicial, radios, enderecoSalvo, guarda do botão e fluxo de
erro/navegação preservados. Backend, contrato, schema e dependências intactos.

Validação local: npm test frontend — dez testes passaram; npm test backend —
23 passaram; build frontend — passou com 59 módulos; git diff --check passou.
Essas suítes são regressões existentes, não teste específico do payload KZN-331.
Inspeção do diff confirma uso do estado selecionado e preservação do restante.
Inventário da automação não apresentou aba local conectada para executar o
roteiro de interceptação. Validação do payload no navegador permanece pendente;
nenhum pedido real criado e nenhum cadastro/endereço/banco local alterado.
Estado Implementado, não Validado. PR e checks remotos aguardam autorização.

## Histórico — Validação do payload pelo usuário — 2026-10-11

Usuário confirmou “validado” e apresentou o payload
`{ "endereco_id": 2, "observacao": "" }`. Evidência informada pelo usuário
confirma envio do ID selecionado 2 e observação vazia. Não comprova por si
só criação de pedido, integração ERP, uso de endereço recém-cadastrado ou
observação preenchida. Esses cenários não foram declarados executados.
AC-01 confirmado; AC-02, AC-03 e verificação manual de AC-04 permanecem
sem evidência específica. Regressões locais/build já passaram. PR ainda
não autorizado; merge manual pelo usuário.

## Histórico — Autorização de publicação — 2026-10-11

Usuário solicitou “faca o pr”, autorizando commit, publicação da branch e
abertura do PR desta unidade. Merge permanece manual. Payload endereco_id=2
confirmado pelo usuário; demais cenários manuais seguem registrados como
pendentes. Checks remotos ainda não executados nesta etapa.

## Histórico — Publicação e CI do KZN-331 — 2026-10-11

PR #7: https://github.com/eduardofrois/kaizen-test/pull/7
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38181718715
Checks testes-backend e build-frontend passaram no commit 37ed34b. Branch
publicada; merge manual pelo usuário. CI comprova regressões existentes/build,
sem substituir os cenários específicos de checkout ainda não confirmados.
Estado Implementado: AC-01 confirmado por payload informado; AC-05 concluído;
AC-02/AC-03 e validação manual de AC-04 pendentes. Sem pedido real pela IA.
Pendências de autorização/abertura/CI anteriores são registros históricos.

## Consolidação documental — 2026-10-12

Validação manual da correção concluída pelo usuário, conforme confirmação
registrada no início. Evidências automatizadas e CI anteriores preservadas.
Pendências manuais nos relatos históricos descrevem a informação disponível
à época. Cenários sem detalhamento individual continuam identificados como
limite de evidência, não como ausência de validação manual da correção.
Nenhum código, teste, contrato, dependência, banco ou ERP alterado nesta revisão.
