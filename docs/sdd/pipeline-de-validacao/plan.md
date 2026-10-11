# Plano de implementação — Pipeline de validação

**Versão:** 1
**Estado:** Implementado — validação local e PR inicial concluídos; synchronize e push/main pendentes
**Spec:** [spec.md](spec.md), versão 1
**Baseline:** a70f55f; 2026-10-11
**Objetivo:** automatizar testes de configuração e build em PRs/main.
**Arquitetura:** um workflow com dois jobs independentes e lockfiles existentes.
**Stack:** GitHub Actions, Node 24.14.1, npm, node:test e Vite.
**Aprovação para implementar:** versão 1 aprovada pelo usuário em
2026-10-11, resposta “aprovo” à apresentação de spec.md e plan.md.
**Execução:** nesta sessão, após aprovação, sem delegação automática.

## Restrições globais

REQ-01 a REQ-11 da spec se aplicam a todos os passos. Não criar workflow nem
alterar package.json antes de aprovação. Sem novas dependências, secrets,
ERP, banco real ou deploy. Manter merge manual do usuário pelo GitHub.
Não executar npm ci enquanto servidores locais estiverem usando dependências:
parar os servidores antes ou usar checkout isolado, preservando .env e banco.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Criar | .github/workflows/validacao.yml | Eventos, permissões e dois checks |
| Alterar | backend/package.json | Script test sem dependência nova |
| Atualizar | README.md, docs/ambiente.md | Comandos e limites da CI |
| Atualizar | RELATORIO.md, docs/investigacao.md, docs/decisoes.md | Evidências e decisão CI-001 |
| Atualizar | docs/sdd/pipeline-de-validacao/spec.md e plan.md | Estado e resultados reais |

## Tarefa 1 — Workflow e comandos reproduzíveis

**Consome:** lockfiles, backend/tests/*.test.js e script build existente.
**Produz:** npm test e dois status checks estáveis. Sem contratos HTTP novos.
**Cobertura:** REQ-01 a REQ-11; AC-03 a AC-08 e configuração de AC-01/02.

- [x] Registrar aprovação da versão 1 em spec/plan e mudar estado para Em implementação.
- [x] Conferir branch, alterações locais e main remota; preservar frontend/.vite
      não rastreado, .env e banco. Não adicionar arquivos gerados ao commit.
- [x] Registrar baseline: ausência de .github/workflows/validacao.yml e de
      script test no package.json; testes existentes já possuem evidência.
      Não introduzir teste que apenas espelha YAML.
- [x] Acrescentar a scripts de backend/package.json, preservando os demais:

```json
"test": "node --test tests/*.test.js"
```

- [x] Criar .github/workflows/validacao.yml com este conteúdo:

```yaml
name: Validacao

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.event_name }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  testes-backend:
    name: testes-backend
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    defaults:
      run:
        working-directory: backend
    steps:
      - name: Checkout
        uses: actions/checkout@v6.0.2
        with:
          persist-credentials: false
      - name: Node e cache npm
        uses: actions/setup-node@v6.3.0
        with:
          node-version: '24.14.1'
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - name: Instalar dependencias
        run: npm ci
      - name: Testar backend
        run: npm test

  build-frontend:
    name: build-frontend
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    defaults:
      run:
        working-directory: frontend
    steps:
      - name: Checkout
        uses: actions/checkout@v6.0.2
        with:
          persist-credentials: false
      - name: Node e cache npm
        uses: actions/setup-node@v6.3.0
        with:
          node-version: '24.14.1'
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - name: Instalar dependencias
        run: npm ci
      - name: Compilar frontend
        run: npm run build
```

- [x] Executar npm ci e npm test em backend/ e npm ci e npm run build em
      frontend/, com servidores parados ou checkout isolado. Esperado:
      seis testes passam e dist/index.html é gerado. Registrar saída real.
- [x] Conferir git diff --check; revisar YAML contra REQ-01 a REQ-11,
      nomes dos checks, paths de cache (raiz do repo) e working-directory
      (apenas passos run). Conferir package-lock.json sem alteração.
- [x] Atualizar README/ambiente com comandos locais e limites do check build;
      explicar seleção de testes-backend e build-frontend em proteção de main
      somente após observá-los com sucesso no GitHub. Não alterar proteção.
- [x] Atualizar relatório e investigação com resultado local; status Implementado
      se workflow pronto e validação remota ainda não disponível.
- [x] Commit em ci/pipeline-de-validacao:
      ci: executa testes do backend e build do frontend em PRs.
      Staging explícito dos arquivos revisados; nunca .env/dist/.vite/node_modules.

## Tarefa 2 — Verificação no GitHub e entrega para merge manual

**Consome:** commit aprovado da tarefa 1.
**Produz:** evidência de execução real e checks selecionáveis na proteção.
**Cobertura:** AC-01, AC-02, AC-05 a AC-08.

- [x] Publicar branch de trabalho no origin do candidato. PR com base main
      deve ser aberto para disparar pull_request; preparar título/descrição
      com escopo, comandos e limitações. A abertura de PR será feita mediante
      autorização do candidato ou diretamente por ele. Não fazer merge.
- [x] Observar execução real do PR e registrar link/SHA/resultados dos dois jobs;
      nenhuma falha pode ser ignorada com continue-on-error. Se houver falha
      em instalação/build, investigar a causa e corrigir apenas neste escopo.
      Mudança de produto/dependência exige revisão SDD.
- [ ] Conferir que um novo commit documental na branch dispara novamente
      pull_request synchronize; registrar execução mais recente bem-sucedida.
- [ ] Após o candidato fazer merge, observar execução push na main e registrar
      resultado. Enquanto não houver merge, manter AC-02 pendente; não declarar
      validação completa nem realizar merge para completar checklist.
- [ ] Atualizar ACs e matriz abaixo por evidência, então estado Validado somente
      após critérios remotos cumpridos. Publicar os registros documentais na
      branch e deixar eventual PR complementar para merge manual do candidato.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Execuções pull_request opened/synchronize | Dois checks por execução | Não executado |
| AC-02 | Execução push/main após merge manual | Dois jobs passam | Não executado |
| AC-03 | npm test em backend/ e job remoto | Seis testes passam sem .env real | Seis testes passaram localmente e no run 38172181159 |
| AC-04 | npm run build em frontend/ e job remoto | dist/index.html gerado | Build passou localmente e no run 38172181159 |
| AC-05 | Revisão YAML e logs Actions | Runner/Node/locks/cache/diretórios corretos | YAML e logs reais confirmados no run 38172181159 |
| AC-06 | Revisão de permissões e comandos; resultados dos processos | Sem secrets/ERP/DB; erro não ocultado | Revisão concluída; comandos locais exit 0; sem continue-on-error |
| AC-07 | Checks reais e guia | Nomes estáveis e selecionáveis | Ambos os checks reais passaram no PR #2; guia disponível |
| AC-08 | Diff documental e histórico PR | Estado fiel e merge manual | Implementado; aprovação e validação local registradas |

## Migração e recuperação

Sem migração de banco/API. Se CI impedir merge, corrigir falha ou reverter
workflow/script via PR autorizado; não contornar proteção nem adicionar
credenciais reais. Não remover .env ou dados locais para simular runner limpo.

## Autorrevisão

Requisitos cobertos por configuração explícita e provas locais/remotas.
Sem placeholders de implementação; observações Não executado são estados
reais da proposta. A validação da infraestrutura depende do GitHub;
comandos locais não validam runner Linux, eventos ou proteção da main.

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
após merge manual do candidato. Proteção da main não foi alterada.
