# Spec — Pipeline de validação

**Versão:** 1
**Estado:** Implementado e integrado à main; CI em PR registrada. Evidência específica do evento push/main permanece pendente no plano; não é falha confirmada do workflow.
**Baseline/data:** origin/main a70f55f; 2026-10-11
**Origem:** CI-001 — validação automática antes do merge manual
**Pasta:** pipeline-de-validacao
**Branch:** ci/pipeline-de-validacao
**Aprovação para implementar:** versão 1 aprovada pelo usuário em
2026-10-11, resposta “aprovo” à apresentação de spec.md e plan.md.

> Leitura atualizada em 2026-10-13, referência main 76eca4d. O problema e
> os exemplos de execução abaixo descrevem a baseline e o escopo original
> da unidade. Relatos datados preservam o estado conhecido naquela etapa.
> Contratos evoluídos e pendências atuais: [índice SDD](../README.md).

## Problema e evidência na baseline

Não existe .github/workflows na baseline. O backend tem seis testes de
configuração em backend/tests/config.test.js, executados diretamente por
node --test; não existe script npm test. O frontend tem script build com Vite,
mas nenhuma suíte de testes de interface. Ambos possuem package-lock.json.
As validações locais não são executadas automaticamente em cada PR.

O usuário escolheu branches por tipo e merges manuais no GitHub. Uma CI
com checks estáveis permitirá configurar proteção de main com evidência real.
Esta unidade não altera configurações de proteção do repositório.

## Objetivo

Executar automaticamente os testes existentes do backend e a compilação do
frontend para cada PR destinado à main e para cada push na main. Exibir duas
verificações independentes, úteis para revisão, sem ambiente real da loja.

## Escopo

Incluído: um workflow GitHub Actions, script npm test no backend, instruções
locais/remotas e atualização do relatório/estado SDD.
Fora: novos testes de negócio, suíte frontend/E2E, lint, cobertura mínima,
automação de Conventional Commits, deploy, Docker, mudança de dependências,
correção de bugs, proteção de branch via API e permissões administrativas.

## Requisitos e invariantes

- REQ-01: workflow .github/workflows/validacao.yml com pull_request para main
  (opened, synchronize, reopened) e push para main. Sem filtros de caminhos
  que deixem checks obrigatórios pendentes em PRs apenas documentais.
- REQ-02: jobs independentes chamados testes-backend e build-frontend,
  com os mesmos IDs, sem matrix ou nomes dinâmicos.
- REQ-03: ambos usam ubuntu-24.04 e Node 24.14.1, alinhado à versão local
  já utilizada, com timeout de 10 minutos por job.
- REQ-04: instalar com npm ci no diretório de cada projeto; usar cache npm
  separado pelo respectivo package-lock.json. Não versionar node_modules/dist.
- REQ-05: backend executa npm test, definido como node --test tests/*.test.js.
  Descoberta inclui novos arquivos .test.js diretamente em backend/tests.
  Testes em subpastas exigirão ajuste explícito do comando em outra revisão.
- REQ-06: frontend executa npm run build. Esse check comprova compilação,
  não comportamento da interface, acessibilidade ou integração com API.
- REQ-07: sem .env, secrets, token ERP ou inicialização de servidor/banco.
  Testes atuais criam subprocessos com env sintética e cwd temporário.
  Instalação/cache/checkout acessam rede; a execução dos testes não acessa ERP.
- REQ-08: permissões contents: read, checkout sem persistir credenciais,
  sem pull_request_target e sem continue-on-error. Exit code não zero falha o job.
- REQ-09: cancelar execuções antigas da mesma referência/PR com concurrency;
  distinguir os grupos de push e pull_request. Não cancelar PRs diferentes.
- REQ-10: só recomendar checks obrigatórios após execução real bem-sucedida
  no GitHub; merge manual do usuário. Não afirmar CI validada só por teste local.
- REQ-11: actions oficiais em versões explícitas verificadas:
  actions/checkout@v6.0.2 e actions/setup-node@v6.3.0. Sem actions de terceiros.
  Tags de versão não são imutáveis; fixação por SHA é evolução fora desta unidade.

## Contratos e dados

Novo comando público de desenvolvimento: npm test em backend/.
Checks previstos: testes-backend e build-frontend no workflow Validacao.
APIs, schema, dados da loja, sessões e regras de carrinho não mudam.
Nenhum artefato de build ou credencial é publicado pela pipeline.

## Alternativas

1. **Dois jobs, testes existentes + build (recomendado):** escopo pequeno,
   falhas distinguíveis e execução paralela; utiliza o que já existe.
2. Um job sequencial: menos configuração, mas falha do backend impede conhecer
   o resultado do build e expõe apenas um check para a proteção.
3. Incluir E2E/checkout e matriz de Node: maior cobertura potencial, porém
   exige dados isolados, mocks e decisões adicionais; adiar por SDD separado.

## Critérios de aceite

- [x] AC-01: PR para main dispara os dois checks; novo push no PR executa novamente.
- [ ] AC-02: push na main após merge dispara os dois jobs.
- [x] AC-03: npm test executa os seis testes atuais e todos passam, sem .env real.
- [x] AC-04: npm run build gera frontend/dist/index.html sem precisar de backend/ERP.
- [x] AC-05: workflow usa Node/runner, lockfiles, cache e diretórios especificados.
- [x] AC-06: falhas não são ocultadas; sem permissões de escrita, secrets,
  comandos de banco/servidor ou dependência de credencial externa.
- [x] AC-07: nomes dos checks são estáveis e docs explicam como selecioná-los
  na proteção de main após o primeiro sucesso real.
- [x] AC-08: spec/plan, investigação e relatório distinguem proposta,
  implementação, validação local e execução remota; merge não feito pela IA.

## Riscos e casos de borda

better-sqlite3 pode exigir instalação nativa no Linux: npm ci no runner é prova
necessária; sucesso no macOS não garante o mesmo resultado. Falhas de registry
ou download de Node são falhas de infraestrutura, não prova de bug da aplicação.
Um PR pode exigir autorização de execução de Actions pela política do GitHub.
Sem workflow na main, push na branch sem PR não dispara este desenho.
Node exato precisa de atualização deliberada no futuro. CI verde não afirma
que os quatro chamados ou múltiplos carrinhos foram resolvidos.

## Validação e entrega

Local: npm test em backend/ e npm run build em frontend/, após aprovação.
Remota: registrar URL da execução, SHA, jobs e resultados observados no PR;
após merge feito pelo usuário, confirmar também execução na main.
Antes do merge, AC-02 fica pendente com status explícito. Se não houver
acesso à execução remota, registrar limitação sem marcar Validado.

Fontes consultadas em 2026-10-11:
- [Sintaxe GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Cache por lockfile](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md)
- [checkout v6.0.2](https://github.com/actions/checkout/releases/tag/v6.0.2)
- [setup-node v6.3.0](https://github.com/actions/setup-node/releases/tag/v6.3.0)

## Revisão e histórico

Versão 1 preparada para aprovação. Escopo e requisitos cobertos pelo plano;
nenhum workflow/script de aplicação foi criado ou modificado nesta preparação.

## Execução aprovada — 2026-10-11

Versão 1 aprovada pelo usuário com “aprovo”. Workflow implementado conforme
plano; backend ganhou npm test, sem nova dependência ou alteração de lockfile.
Validação em cópia temporária de arquivos versionados, sem .env/banco/deps
locais: Node v24.14.1; npm ci instalou 120 pacotes no backend e 82 no frontend,
ambas as auditorias informaram zero vulnerabilidades nessa execução.
npm test: seis testes passaram. npm run build: 58 módulos transformados,
dist/index.html gerado, build concluído. Lockfiles comparados e preservados.
YAML analisado com PyYAML; eventos, jobs e permissões conferidos; diff sem
problemas de whitespace. Servidores locais não foram interrompidos.

Usuário autorizou abertura de PR com “Pode abrir o PR”. Execução remota,
checks em synchronize e push após merge manual ainda pendentes nesta etapa.
Nenhum merge/deploy ou alteração de proteção realizado pela IA.

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
