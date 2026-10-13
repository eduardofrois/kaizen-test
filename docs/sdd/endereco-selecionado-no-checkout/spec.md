# Spec — Endereço selecionado no checkout

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Baseline/data:** 6fab792; 2026-10-11
**Origem:** KZN-331 — Pedido saiu com o endereço errado
**Branch:** fix/endereco-selecionado-no-checkout
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11; mensagem do usuário: “aprovado”.


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

## Problema e evidência na baseline

Checkout.jsx mantém enderecoId na seleção dos radios e ao salvar endereço,
mas finalizar() ignora esse estado: procura enderecos.find(item.principal)
ou enderecos[0] e envia entrega.id. Selecionar oficina pode enviar casa.
Inspeção confirmou a causa. A investigação anterior verificou isoladamente
seleção 2 gerando payload endereco_id=1. Nesta etapa o usuário disse “pronto”;
a mensagem não detalha reprodução, payload ou pedido criado. Não registrar
confirmação manual específica com base apenas nessa resposta.

Backend routes/pedidos.js valida endereco_id e chama finalizarPedido.
O serviço consulta buscarEndereco(usuario.id, enderecoId), verifica posse,
serializa endereço na observação ERP e grava snapshot em pedidos_usuario.
Não foi localizada troca pelo principal nesse fluxo do backend.
Pull realizado antes desta preparação; main inclui merge do PR #6 em 6fab792.

## Objetivo e comportamento esperado

Confirmar pedido envia o ID do endereço que aparece selecionado. O principal
continua sendo a seleção inicial, com fallback para o primeiro quando não há
principal. Selecionar outro ou salvar um novo endereço deve definir o destino
usado no payload, sem promover esse endereço a principal automaticamente.

## Escopo

Incluído: envio correto em finalizar(), validação do payload com API bloqueada
ou simulada, regressões existentes e documentação.
Fora: regras de endereço principal, persistência da seleção entre visitas,
idempotência, transação distribuída, truncamento da observação ERP, dinheiro,
múltiplos carrinhos e mudanças de contrato/schema/backend.

## Requisitos e invariantes

- REQ-01: api.pedidos.criar recebe { endereco_id: enderecoId, observacao }.
- REQ-02: não recalcular endereço por principal/ordem no momento do envio.
- REQ-03: preservar seleção inicial, radios, enderecoSalvo e botão bloqueado
  sem enderecoId ou com carrinho impróprio. Preservar loading, erros e navegação.
- REQ-04: backend continua verificando posse; IDs do navegador não autorizam
  acesso a endereço alheio. Não alterar ApiError, validação ou contratos.
- REQ-05: não criar pedidos no ERP real para testes automatizados. Validação
  manual do payload usa interceptação que impede o POST alcançar o servidor.
- REQ-06: preservar dados locais, env, dependências e identidade visual.

## Contratos, dados e interface

POST /api/pedidos mantém corpo { endereco_id, observacao } e resposta existente.
Mudança limitada à fonte do ID no frontend. Sem migração, schema ou alteração
na representação do endereço. Snapshot e observação permanecem no backend.

## Decisões e alternativas

Proposta: enviar diretamente o estado já utilizado pelo radio e pela guarda
do botão. Rebuscar por principal contradiz a escolha explícita. Alterar a
preferência principal para contornar o defeito mudaria cadastro sem necessidade.
Não criar helper que apenas embrulhe o payload para justificar teste unitário;
validar o request do componente real por interceptação no navegador.

## Critérios de aceite

A validação manual da correção foi confirmada. Checkboxes ainda abertos
indicam ausência de detalhamento específico de todas as variantes do critério,
sem significar ausência de validação manual geral. Não foram inventadas provas
para interceptação, dados suficientes em pedidos ou falhas induzidas.

- [x] AC-01: principal A e selecionado B → request endereco_id=B.
- [ ] AC-02: mantendo seleção inicial → request do endereço inicialmente selecionado.
- [ ] AC-03: endereço novo salvo e selecionado → request do novo ID; observação preservada.
- [ ] AC-04: sem seleção ou carrinho impróprio, botão continua bloqueado;
  fluxo de erro e recarregamento permanece; nenhum pedido real criado pela validação.
- [x] AC-05: testes existentes frontend/backend e build passam; documentação
  distingue payload interceptado, inspeção e eventual integração real.

## Riscos e validação

Confirmar sem interceptação cria pedido real e baixa estoque. Instalar bloqueio
antes de clicar e removê-lo depois por recarga. Requisição capturada prova o
ID escolhido no frontend; não prova entrega do ERP. Backend já consome o ID
com posse e snapshot, conforme inspeção; não chamar isso teste integrado.
Endereço removido em outra aba continua sujeito à validação do backend.

## Entrega e histórico

Atualizar spec/plano, fix.md, RELATORIO.md e investigação conforme resultados.
Versão 1 aprovada e implementada. Payload selecionado confirmado pelo usuário
em 2026-10-11; validação manual consolidada em 2026-10-12. Não presumir pedido
real ou capturas específicas das demais variantes.

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
