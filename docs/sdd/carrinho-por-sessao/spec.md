# Spec — Carrinho por sessão

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Baseline/data:** 1d30bcc; 2026-10-11
**Origem:** FIX-005 — Estado do carrinho desconectado da autenticação
**Branch:** fix/carrinho-por-sessao
**Aprovação do desenho:** 2026-10-11; mensagem do usuário: “aprovado”, após apresentação da spec.
**Aprovação para implementar:** spec/plano versão 1 aprovados em 2026-10-11; usuário: “aprovado”, após apresentação do plan.md.


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

ProvedorCarrinho está dentro de ProvedorAuth, mas não consome useAuth.
Seu efeito chama recarregar apenas ao montar. Login, cadastro e logout mudam
usuario no AuthContext sem limpar/recarregar o carrinho. Todas as operações
assíncronas escrevem setCarrinho sem verificar a sessão que originou a chamada.
Uma leitura ou mutação antiga pode terminar após troca de conta.

Usuário já confirmou X→logout→Y exibindo carrinho X até F5. Não há prova de
vazamento pela API; backend filtra usuario_id. Risco de resposta tardia foi
identificado por inspeção e precisa de teste controlado. main.jsx documenta
que visitante não consulta carrinho, mas isso ainda não acontece na baseline.
Pull realizado; PR #7 integrado em main pelo merge 1d30bcc.

## Objetivo e comportamento esperado

Ao autenticar, carregar o carrinho da conta sem F5. Ao sair/trocar conta,
esconder imediatamente os dados anteriores e invalidar trabalho assíncrono
da sessão antiga. Enquanto carrega a conta atual, mostrar estado de carga,
sem expor conteúdo anterior nem habilitar checkout com dados antigos.

## Escopo

Incluído: dependência da autenticação, isolamento do estado e respostas de
leitura/adição/alteração/remoção/limpeza; erros da leitura e validação controlada.
Fora: sincronização de logout entre abas, concorrência de alterações dentro
da mesma sessão, reformulação de autenticação/cookies, cancelar operações já
recebidas no servidor, múltiplos carrinhos e persistência local de catálogo.

## Requisitos e invariantes

- REQ-01: aguardar AuthContext terminar carregamento. Visitante não dispara
  leitura privada nem mutação de carrinho; não criar carrinho em localStorage.
- REQ-02: associar estado à identidade autenticada. Ao renderizar outra
  identidade, nunca expor snapshot da anterior, mesmo antes do efeito de carga.
- REQ-03: login e cadastro carregam carrinho atual; logout limpa conteúdo,
  contador, total, erro e estado de carga da sessão encerrada.
- REQ-04: invalidar ciclo de sessão em X→Y e X→visitante→X. ID sozinho não
  basta para aceitar resposta iniciada num ciclo anterior da mesma conta.
- REQ-05: resposta antiga, sucesso/erro/finally, de qualquer operação não pode
  alterar conteúdo, erro ou carregando da sessão atual. Não repetir mutação
  antiga automaticamente com cookie da nova conta.
- REQ-06: callbacks antigos invocados após troca não iniciam nova mutação.
  Operações já enviadas podem concluir no servidor; ignorar resultado local
  não desfaz escrita nem constitui garantia de cancelamento do backend.
- REQ-07: 401 atual limpa representação privada. Falha de rede/5xx da leitura
  atual aparece como erro e bloqueia checkout, sem ser apresentada como prova
  de carrinho vazio. Preservar ErroApi; não mudar AuthContext silenciosamente.
- REQ-08: preservar API dos consumidores (recarregar/adicionar/alterar/remover/
  limpar), regras do total/contador, URL/filtros e identidade visual. Setter
  exposto, hoje sem consumidores externos, deve ter semântica vinculada à sessão.
- REQ-09: sem mudanças de backend, schema, dependências ou dados reais. Testes
  com promessas controladas/API simulada; nenhuma requisição ao SIAC real.

## Desenho proposto

ProvedorCarrinho observa usuario.id e carregando de useAuth. Estado publicado
carrega identidade/ciclo e nunca é retornado quando diverge da autenticação
atual. Novo ciclo começa vazio, inicia leitura somente se autenticado e impede
aceitar resultados do ciclo anterior, inclusive ao voltar à mesma conta.

Centralizar controle de ciclo e publicação assíncrona em unidade pequena,
utilizada pelo provider, com testes node:test de promessas resolvidas fora de
ordem. O provider continua responsável por integrar ciclo de vida React;
componentes não recebem regras de identidade duplicadas.

Contexto passa a expor erro de leitura. Carrinho e Checkout apresentam esse
erro antes de vazio/resumo, com tentativa de recarga; checkout fica bloqueado
sem carga válida. Erros de mutação atuais continuam chegando aos chamadores.
Resultado antigo é descartado; o plano deve definir retorno de operação
invalidada sem produzir mensagens de sucesso na sessão seguinte.

Não remontar a árvore App nem forçar F5: isso descartaria formulários e outros
estados desnecessariamente. URL e navegação existentes permanecem.

## Alternativas

1. Proposta recomendada: estado associado à sessão e controle de respostas.
   Resolve troca normal e requisições tardias; exige testes do ciclo.
2. Remontar toda árvore abaixo do provider por key de usuário: isola state,
   mas descarta telas/formulários e não elimina callbacks antigos já capturados.
3. Forçar reload no login/logout: mascara ausência de vínculo e prejudica SPA;
   não selecionado.

## Contratos e dados

Sem alteração HTTP/cookies/schema. API externa continua definindo posse.
Contrato interno acrescenta erro de leitura. Operações invalidadas retornam
false; operações atuais concluídas retornam true. Mutação atual com erro lança
ErroApi; erro de leitura atual fica no contexto. Chamadores verificam false
antes de avisos/navegação. Estratégia detalhada no plan.md.

## Critérios de aceite

A validação manual da correção foi confirmada. Checkboxes ainda abertos
indicam ausência de detalhamento específico de todas as variantes do critério,
sem significar ausência de validação manual geral. Não foram inventadas provas
para interceptação, dados suficientes em pedidos ou falhas induzidas.

- [x] AC-01: boot sem sessão e enquanto auth carrega não consulta carrinho.
- [x] AC-02: login/cadastro carrega conta atual sem F5; logout oculta estado X.
- [ ] AC-03: X→Y não exibe snapshot X enquanto Y carrega nem após sua resposta.
- [x] AC-04: sucesso/erro/finally tardios de leitura e das quatro mutações não
  alteram sessão atual; cobrir X→visitante→X e callback antigo invocado depois.
- [ ] AC-05: 401 limpa representação; rede/5xx aparecem como erro com recarga
  e checkout bloqueado; resposta antiga não limpa erro/carga atual.
- [x] AC-06: manter carrinho por usuário no servidor, URL/filtros e regras de
  total/contador; suítes existentes/build e testes novos passam.
- [x] AC-07: validação manual de troca sem F5; testes de concorrência usam
  simulação determinística, diferenciados da integração com React/navegador.

## Riscos e estratégia de validação

Distinguir ordem de resposta entre sessões de ordem entre operações da mesma
sessão, fora desta unidade. StrictMode monta/limpa efeitos em desenvolvimento;
invalidar operações no cleanup sem quebrar a montagem seguinte. Testes do
controlador devem usar implementação real, não cópia de algoritmo.
Teste manual pode alternar contas existentes, sem publicar dados pessoais.
Não criar pedidos nem alterar estoque. Não declarar React/E2E com base em teste puro.

## Entrega e revisão

Desenho versão 1 aprovado pelo usuário em 2026-10-11. Plan.md preparado para
revisão, incluindo erros de leitura e chamadores. Implementação realizada após aprovação do plano; evidências abaixo.
Aprovação do desenho não foi registrada como aprovação de plano ainda inexistente.

## Histórico — Implementação de carrinho-por-sessao — 2026-10-11

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

## Histórico — Confirmação manual de troca de conta — 2026-10-11

Usuário informou “conferido” após o roteiro X→logout→Y→logout→X sem F5,
conferindo itens, contador e total. Validação manual normal de troca de conta
confirmada pelo usuário, não executada pela IA. Não extrapolar para inspeção
Network do boot, testes visuais de falha/401 ou resposta atrasada no navegador.
Esses cenários têm testes determinísticos no controlador, mas integração visual
específica ainda não confirmada. Suítes locais e build já passaram.
PR ainda não autorizado; merge permanece manual pelo usuário.

## Histórico — Autorização de publicação do FIX-005 — 2026-10-11

Usuário solicitou “otimo, crie o PR”, autorizando commit, publicação da branch
e abertura do PR. Troca X/Y/X sem F5 confirmada pelo usuário; testes locais
frontend 37/backend 23 e build concluídos. Checks remotos ainda pendentes
nesta etapa. Merge permanece manual; cenários visuais complementares não
foram promovidos a validação concluída.

## Histórico — Publicação e CI do FIX-005 — 2026-10-11

PR #8: https://github.com/eduardofrois/kaizen-test/pull/8
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38186410197
Checks testes-backend e build-frontend passaram no commit 6ffa315. Branch
fix/carrinho-por-sessao publicada. Troca X/Y/X sem F5 já confirmada pelo usuário;
regressões controladas locais e CI concluídas. Integração visual específica
de boot/StrictMode, falhas e resposta atrasada segue pendente; estado geral
Implementado até completar os critérios restantes. Merge manual pelo usuário.
Registros anteriores de autorização/abertura/CI pendentes são históricos.

## Consolidação documental — 2026-10-12

Validação manual da correção concluída pelo usuário, conforme confirmação
registrada no início. Evidências automatizadas e CI anteriores preservadas.
Pendências manuais nos relatos históricos descrevem a informação disponível
à época. Cenários sem detalhamento individual continuam identificados como
limite de evidência, não como ausência de validação manual da correção.
Nenhum código, teste, contrato, dependência, banco ou ERP alterado nesta revisão.
