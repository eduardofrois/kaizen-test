# Situação da investigação

Atualização: 2026-10-11. Baseline original: `81897d5`.

## Retomada em outra sessão

1. Leia AGENTS.md e as fronteiras em docs/ai/.
2. Leia o inventário detalhado em [fix.md](../fix.md).
3. Confira Git, aprovação do usuário e a spec/plan da unidade selecionada.
4. Reconfira referências de código se a baseline tiver mudado.
5. Atualize os registros conforme a evidência evoluir.

## Inventário

| IDs | Estado | Próxima ação |
|---|---|---|
| KZN-312 | Validado: 17 testes, manual pelo usuário e checks do PR #3 | Merge manual pendente |
| KZN-318 | Validado e integrado na main pelo PR #5 | Concluído; merge 27217ff confirmado após pull |
| KZN-325 | Implementado: frontend 10 testes, backend 23 e build passaram | PR #6 com CI passando; validação manual pendente |
| KZN-331 | Implementado: envio usa enderecoId; regressões/build passaram | PR #7 com CI passando; cenários manuais restantes pendentes |
| FIX-001 | Validado por SDD aprovado; seis testes e roteiro manual local | Publicação remota pendente; unidade concluída |
| FIX-002 | Evidência estática | Especificar origens e validar ambiente |
| FIX-003, 004, 007, 008 | Verificação isolada realizada | Spec/plan e regressões focadas |
| FIX-005 | Implementado: 27 testes novos; frontend 37/backend 23/build passaram | Troca X/Y/X confirmada; falhas visuais e CI pendentes; PR aguarda comando |
| FIX-006 | Evidência estática | Reprodução integrada e spec/plan |
| FIX-009 | Restrições CSS localizadas | Reprodução visual desktop/celular |
| INV-001 a INV-005 | Pontos adicionais | Ver classificações e passos de confirmação em fix.md |
| MULTI-001 | Requisito obrigatório | Definir produto, modelagem, contrato e migração por SDD |

## Evidência já obtida

- Leitura de README, ARQUITETURA, RELATORIO, 25 arquivos backend/src e 20
  arquivos frontend/src, manifests, lockfiles, script de banco e build existente.
- Busca de notas em arquivos textuais do checkout: três identificadores.
- Consulta SQLite somente leitura/imutável: integrity check ok; tabelas vazias.
- Scripts transitórios em memória executaram funções originais, com stubs de
  banco/ERP e extração de funções frontend. Nenhum pedido real foi criado.
- npm ci do backend concluído. Criado backend/.env local com campos obrigatórios
  vazios; testes de config: RED cinco falhas/um sucesso; GREEN seis sucessos.
  Sintaxe passou. Posteriormente, usuário confirmou servidores locais, catálogo, login,
  refresh, logout e fail-fast manual. Sem build novo, checkout real ou deploy.

## Relatório

O preenchimento inicial foi aprovado em 2026-10-11 pela mensagem: "aprovo o
preenchumento inicial, vai fazendo as alteracoes enquanto eu avalio sobre a
config do ambiente". `RELATORIO.md` agora registra causas/evidências dos
quatro chamados, os nove achados, cinco pontos adicionais, limites da
validação e as três notas. FIX-001 implementado; demais correções, deploy e feature seguem pendentes.
Nome, data de entrega e horas permanecem sem valores inventados. A aprovação
documental não aprova outras correções. Configuração foi aprovada explicitamente
em mensagem posterior e seu resultado está no relatório.

## Repositório de entrega

Destino autorizado: https://github.com/eduardofrois/kaizen-test.
Em 2026-10-11, foi consultado como público e sem refs remotas. O primeiro
envio contém documentação e arquivos seguros, no commit `0b75868` da main;
o Git original foi preservado em backup local e a main própria foi enviada
com upstream configurado. A publicação da aplicação
teve as credenciais literais removidas por SDD aprovado; novo push pendente. Não enviar o histórico da
empresa, que também contém a configuração original. O usuário solicitou
nomes SDD descritivos; essa solicitação não aprovou a implementação.

## Retorno manual do usuário — 2026-10-11

Projeto iniciado localmente; login e catálogo confirmados pelo usuário com
captura da vitrine. Refresh de sessão, logout e fail-fast manual também confirmados
pelo usuário em seguida. FIX-010 adicionado em fix.md: limites ausentes nos inputs de
cadastro, rejeição pela API confirmada nas capturas; perfil tem padrão
semelhante por inspeção. Correção pendente de SDD/aprovação.

## Integração e publicação — 2026-10-11

Por autorização do usuário, branch configuracao-por-ambiente integrada na
main pelo merge f913cda, sem conflitos. Push para eduardofrois/kaizen-test
concluído: remoto confirmou main de 6307deb para f913cda. Branch local
codex/configuracao-por-ambiente preservada. Os registros anteriores de push
pendente descrevem a etapa anterior e estão superados por esta atualização.
.env e arquivos gerados não foram enviados. Publicação do código no GitHub
não representa deploy da aplicação.

## CI-001 — Pipeline de validação em preparação

SDD versão 1 proposto em docs/sdd/pipeline-de-validacao/; branch
ci/pipeline-de-validacao baseada em origin/main a70f55f, após merge manual
do PR #1 pelo usuário. Dois checks propostos: testes-backend e
build-frontend. Workflow, script npm test e execuções ainda não implementados
nesta unidade; aprovação explícita pendente.

## CI-001 — Implementação aprovada e validação local

Versão 1 aprovada em 2026-10-11 (“aprovo”). Workflow e npm test implementados.
Cópia temporária sem .env/banco: npm ci em ambos, seis testes passaram e
build frontend passou (58 módulos). Lockfiles preservados. YAML e diff
conferidos. Usuário autorizou PR (“Pode abrir o PR”); remoto/merge main ainda
pendentes neste registro. Nenhuma dependência, regra de negócio ou proteção
alterada. O registro anterior de proposta foi superado por esta execução.

## Primeira execução remota — PR #2

PR: https://github.com/eduardofrois/kaizen-test/pull/2
Execução pull_request/opened concluída com success:
https://github.com/eduardofrois/kaizen-test/actions/runs/38172181159
SHA: 820bc9593a34a31ce49d1a63fcc2b457bd9728dc.
Jobs testes-backend e build-frontend passaram em Ubuntu 24.04/Node 24.14.1.
Logs confirmam npm ci em ambos, seis testes sem falhas e build de 58 módulos.
Frontend instalou 85 pacotes no Linux (82 na validação local macOS), sem
alteração de lockfile. Não houve credenciais reais, servidor ou ERP na CI.
Ainda falta confirmar synchronize após novo push documental e push/main
após merge manual do usuário. Proteção da main não foi alterada.

## Validação do PR concluída — aguardando merge manual

Novo push documental (10420ad) disparou pull_request/synchronize e ambos os
jobs passaram novamente: run 38172264955, SHA
10420adcd74f5b5c8eecf71274b7c6e636de38b1.
Evidência: https://github.com/eduardofrois/kaizen-test/actions/runs/38172264955
AC-01 confirmado por opened e synchronize; checks testes-backend e
build-frontend reais e bem-sucedidos, disponíveis para proteção da main.
Pendente apenas AC-02 e a etapa correspondente do plano: executar e observar
push/main após merge manual do usuário no PR #2. Não declarar estado
Validado global até obter essa evidência. Registro atual supera as pendências
remotas descritas nas etapas anteriores; merge/deploy/proteção não realizados.

## Unidade em preparação — total-do-carrinho

Em 2026-10-11, usuário confirmou a CI antes e depois do merge e pediu
trabalhar no total. Criada branch fix/total-do-carrinho a partir de origin/main
4261129. Spec/plan versão 1 em proposta para KZN-312: somar só linhas
com disponivel=true, mantendo linhas/quantidades/subtotais e bloqueio checkout.
FIX-003 é causa distinta e permanece pendente de SDD próprio. Nenhuma
alteração no serviço ou testes nesta preparação. Plano prevê onze regressões
novas com schema SQLite em memória e ERP simulado em subprocessos isolados.
Pipeline já comprovada em push/main no run 38172472231; registros de pendência
anteriores à confirmação são históricos. Unidade total ainda sem aprovação.

## Execução de total-do-carrinho — 2026-10-11

Versão 1 aprovada pelo usuário após reprodução manual. Redutor corrigido;
onze testes novos (RED seis falhas/cinco sucessos) e GREEN 17 sucessos na
suíte completa. Sintaxe/diff passaram. Sem env/banco/rede ERP reais nos testes.
Aguardar validação manual pós-correção e comando do usuário para abrir PR.
FIX-005 confirmado manualmente: estado de X permanece após login em Y até F5;
sem correção nesta unidade. FIX-003/KZN-318 também seguem separados.

## Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “funcionando, pode abrir o PR”. Validação manual
pós-correção confirmada pelo usuário; autorização anterior para aguardar
foi revogada por esta mensagem. Abrir PR para main e acompanhar os checks,
sem realizar merge. Testes locais já passaram; evidência remota ainda pendente.

## Validação remota concluída — PR #3

PR: https://github.com/eduardofrois/kaizen-test/pull/3
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38175551404
Checks testes-backend e build-frontend passaram no commit ac2231f.
Com reprodução prévia, aprovação SDD, RED/GREEN, confirmação manual do
usuário e checks do PR concluídos, KZN-312 está Validado. Todos os critérios
da versão 1 cumpridos; merge continua pendente de ação manual do usuário.
Nenhum merge/deploy realizado pela IA. As pendências de validação e instruções
de aguardar abertura descritas anteriormente são registros históricos superados.
FIX-003, FIX-005 e KZN-318 permanecem fora desta correção.

## Preparação de contador-do-carrinho — 2026-10-11

KZN-318 reproduzido manualmente pelo usuário, conforme informou nesta sessão.
Inspeção confirmou quantidade_pecas = itens.length em lerCarrinho; cabeçalho e
resumo já consomem esse campo. Spec e plano versão 1 preparados em
`docs/sdd/contador-do-carrinho/`, estado Proposta. Regra proposta: somar unidades
incluindo linhas com pendências, mantendo quantidade_itens como produtos distintos
e preservando o total filtrado do KZN-312. Implementação e testes aguardam aprovação;
nenhum código, teste, dependência ou banco alterado nesta preparação.

## Implementação de contador-do-carrinho — 2026-10-11

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

## Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “validado, pode subir o pr” após o roteiro de validação
local. Validação manual pós-correção confirmada pelo usuário; não executada
pela IA. Publicação da branch e abertura de PR autorizadas nesta mensagem.
Testes locais: 23 passaram; build passou. Checks remotos ainda pendentes.
Merge permanece manual pelo usuário. Pendências manuais descritas anteriormente
são registros históricos superados por esta confirmação.

## Validação remota de KZN-318 — 2026-10-11

PR #5: https://github.com/eduardofrois/kaizen-test/pull/5
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38177680580
Checks testes-backend e build-frontend passaram no commit ea3bc6a.
Estado Validado: critérios da versão 1 concluídos com regressões isoladas,
build local, confirmação manual do usuário e CI do PR. Merge manual pendente.
Registros anteriores de espera por validação/abertura/CI são históricos.
FIX-003 e FIX-005 continuam fora do escopo; nenhum merge ou deploy realizado.

## Preparação de busca-e-paginacao — 2026-10-11

KZN-325 reproduzido pelo usuário (“Erro encontrado”). Pull realizado antes do
trabalho; nova branch fix/busca-e-paginacao baseada na main 27217ff, com PR #5
integrado. Spec/plano versão 1 em docs/sdd/busca-e-paginacao/, estado Proposta.
Proposta: remover pagina ao pesquisar, limpar termo ou alterar categoria/estoque;
preservar paginação explícita e demais filtros. Prevê função compartilhada,
dez testes nativos sem dependências novas e npm test no job frontend da CI.
FIX-004 e INV-005 ficam separados. Nenhum código, teste, workflow ou dependência
alterado; implementação aguarda aprovação explícita.

## Implementação de busca-e-paginacao — 2026-10-11

Versão 1 aprovada pelo usuário: “entao aprovo os docs”. Função compartilhada
atualizarParametroCatalogo integrada em pesquisar e trocarParametro. Busca,
categoria e estoque removem pagina; paginação explícita preserva filtros.
Consulta continua no backend/ERP com tamanho 24; nenhum filtro local de lista.
Nota KZN-5D1E preservada. FIX-004 e INV-005 não corrigidos nesta unidade.

RED: node --test tests/parametros-catalogo.test.js no comportamento original
extraído para o módulo — oito falhas nos resets e dois controles passaram.
GREEN: npm test em frontend — dez testes passaram. npm test em backend —
23 testes passaram. Build frontend passou com 59 módulos; git diff --check
passou. Testes frontend importam função real, sem rede, env ou banco; suíte
backend mantém SQLite isolado e ERP simulado. Não houve validação React/E2E.

Script test frontend criado sem dependências. Workflow atualizado para executar
npm test no job build-frontend antes do build, preservando nomes dos checks.
Execução remota ainda pendente; mudança de workflow não equivale a CI validada.
Estado Implementado: roteiro manual pós-correção, confirmação do usuário e
checks remotos pendentes. Nenhum PR, merge ou deploy realizado nesta unidade.

## Autorização do PR — 2026-10-11

Usuário autorizou “pode abrir o pr”. Publicação da branch e abertura do PR
autorizadas; merge permanece manual. Validação automatizada local concluída
(10 testes frontend, 23 backend e build). Validação manual pós-correção não
confirmada; não atribuir essa confirmação à autorização de abertura do PR.
Checks remotos pendentes nesta etapa.

## CI e publicação de KZN-325 — 2026-10-11

PR #6: https://github.com/eduardofrois/kaizen-test/pull/6
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38179901454
Checks testes-backend e build-frontend passaram no commit c51b6ba. Workflow
do PR inclui npm test frontend antes do build. Branch publicada em origin.
Estado Implementado: validação automatizada local/remota concluída; falta
confirmação manual pós-correção (AC-04 e parte integrada de AC-01/AC-02).
Não marcar a unidade como Validada apenas pela CI. Merge manual pelo usuário.
Pendências remotas descritas antes desta execução são históricas.

## Preparação de endereco-selecionado-no-checkout — 2026-10-11

Pull confirmado; main 6fab792 inclui merge do PR #6. KZN-331: inspeção do
Checkout.jsx confirma finalizar() buscando principal e ignorando enderecoId.
Backend já verifica posse e utiliza o ID recebido para observação/snapshot.
Spec/plano versão 1 em docs/sdd/endereco-selecionado-no-checkout/, Proposta.
Correção proposta só no payload frontend; validação por POST interceptado sem
criar pedido real. Mensagem “pronto” não detalha reprodução, então não foi
registrada confirmação manual específica. Implementação aguarda aprovação.

## Implementação de KZN-331 — 2026-10-11

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

## Validação do payload pelo usuário — 2026-10-11

Usuário confirmou “validado” e apresentou o payload
`{ "endereco_id": 2, "observacao": "" }`. Evidência informada pelo usuário
confirma envio do ID selecionado 2 e observação vazia. Não comprova por si
só criação de pedido, integração ERP, uso de endereço recém-cadastrado ou
observação preenchida. Esses cenários não foram declarados executados.
AC-01 confirmado; AC-02, AC-03 e verificação manual de AC-04 permanecem
sem evidência específica. Regressões locais/build já passaram. PR ainda
não autorizado; merge manual pelo usuário.

## Autorização de publicação — 2026-10-11

Usuário solicitou “faca o pr”, autorizando commit, publicação da branch e
abertura do PR desta unidade. Merge permanece manual. Payload endereco_id=2
confirmado pelo usuário; demais cenários manuais seguem registrados como
pendentes. Checks remotos ainda não executados nesta etapa.

## Publicação e CI do KZN-331 — 2026-10-11

PR #7: https://github.com/eduardofrois/kaizen-test/pull/7
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38181718715
Checks testes-backend e build-frontend passaram no commit 37ed34b. Branch
publicada; merge manual pelo usuário. CI comprova regressões existentes/build,
sem substituir os cenários específicos de checkout ainda não confirmados.
Estado Implementado: AC-01 confirmado por payload informado; AC-05 concluído;
AC-02/AC-03 e validação manual de AC-04 pendentes. Sem pedido real pela IA.
Pendências de autorização/abertura/CI anteriores são registros históricos.

## Investigação de carrinho-por-sessao — 2026-10-11

Pull confirmado; main 1d30bcc inclui PR #7. Branch fix/carrinho-por-sessao.
FIX-005: provider não observa autenticação; respostas de todas as operações
podem publicar estado após mudança de conta. Reprodução normal X→Y já foi
confirmada pelo usuário; concorrência ainda depende de teste controlado.
Desenho versão 1 em docs/sdd/carrinho-por-sessao/spec.md, Proposta para revisão.
Inclui identidade/ciclo da sessão, descarte de respostas antigas e erro de
leitura visível com checkout bloqueado. Plano será detalhado após revisão do
desenho. Nenhum código/teste/dependência alterado; implementação não aprovada.

## Desenho aprovado e plano do FIX-005 — 2026-10-11

Usuário aprovou o desenho versão 1 com “aprovado”. Plan.md de carrinho-por-sessao
preparado para revisão: controlador por ciclo, snapshot próprio, descarte de
respostas e callbacks antigos, retorno false para operação invalidada e guardas
nos chamadores. Erros de leitura expostos em Carrinho/Checkout com recarga.
Testes determinísticos do módulo real e integração manual separados. Nenhum
código/teste alterado. Implementação do plano ainda aguarda aprovação.

## Implementação de carrinho-por-sessao — 2026-10-11

Spec/plano versão 1 aprovados: usuário “aprovado” após apresentação do plano.
Controlador por instância/ciclo integrado ao AuthContext via provider; novo
render de identidade usa snapshot novo, vazio, e invalida resultados anteriores.
Visitante não chama API de carrinho. Geração invalida promises de cleanup/setup.
Leitura com falha expõe erro em Carrinho/Checkout antes de vazio/resumo, com
recarga. Sucesso tardio de adição não mostra recado; operações antigas retornam
false, e Checkout interrompe continuação de recarga invalidada.

Validação local: 27 testes novos do controlador real passaram; npm test frontend
totalizou 37 sucessos; npm test backend totalizou 23 sucessos. Build passou com
60 módulos, git diff --check passou. Sem rede, env ou banco real nos testes.
A execução inicial falhou por módulo ausente: isso é RED estrutural, não prova
comportamental do defeito na baseline. Não houve alegação de RED comportamental.
Testes controlados cobrem dez respostas tardias de leitura/mutação, callbacks
antigos, carga/assinatura, cleanup/setup, X→visitante→X, 401/0/500, retry,
argumentos, erros de mutação e setter. Não são testes React/hooks/E2E.

Estado Implementado: testes locais e revisão estática concluídos; integração
manual X/Y sem F5, boot/StrictMode no navegador e simulação visual de rede ainda
pendentes. Sem novo pedido, cadastro, alteração de estoque ou dependências.
PR não aberto; aguardará comando do usuário. Concorrência dentro da mesma
sessão e checkout já enviado ao servidor continuam fora desta correção.

## Confirmação manual de troca de conta — 2026-10-11

Usuário informou “conferido” após o roteiro X→logout→Y→logout→X sem F5,
conferindo itens, contador e total. Validação manual normal de troca de conta
confirmada pelo usuário, não executada pela IA. Não extrapolar para inspeção
Network do boot, testes visuais de falha/401 ou resposta atrasada no navegador.
Esses cenários têm testes determinísticos no controlador, mas integração visual
específica ainda não confirmada. Suítes locais e build já passaram.
PR ainda não autorizado; merge permanece manual pelo usuário.

## Autorização de publicação do FIX-005 — 2026-10-11

Usuário solicitou “otimo, crie o PR”, autorizando commit, publicação da branch
e abertura do PR. Troca X/Y/X sem F5 confirmada pelo usuário; testes locais
frontend 37/backend 23 e build concluídos. Checks remotos ainda pendentes
nesta etapa. Merge permanece manual; cenários visuais complementares não
foram promovidos a validação concluída.
