# Plano — Coerência da documentação de entrega

**Versão:** 1
**Estado:** Concluído e publicado no PR #18 para main; checks do commit inicial passaram; merge manual pendente.
**Spec:** [spec.md](spec.md).
**Baseline/data:** `76eca4d`; 2026-10-13.
**Autorização:** pedido documental do usuário transcrito na spec. Registro de
escopo, sem atribuir aprovação separada destes documentos ou de aplicação.

## Arquivos e responsabilidades

| Arquivos | Objetivo |
|---|---|
| README.md, docs/ambiente.md | Entrada, execução e configuração reproduzíveis |
| ARQUITETURA.md, docs/ai/arch.md, docs/ai/boundaries.md | Modelo e contratos atuais, invariantes e limites |
| RELATORIO.md | Resultado da entrega, decisões, evidências e limitações |
| fix.md, docs/investigacao.md, docs/sdd/README.md | Inventário, pendências e índice atual |
| docs/sdd/*/spec.md e plan.md | Estados atuais separados dos registros históricos |
| docs/historico/*.md | Preservar registros extensos substituídos pela consolidação |

## Execução

- [x] Conferir Git, baseline e alterações locais; guardar cópia dos 36
  documentos locais em ZIP temporário antes de editar.
- [x] Criar branch documental baseada na main, preservando alterações locais.
- [x] Reconciliar relatório, arquitetura, ambiente, inventários e índice.
- [x] Atualizar metadados SDD e referências à evolução dos contratos.
- [x] Conferir links, blocos, tabelas, estados contraditórios e diff.
- [x] Registrar resultados e pendências; entregar arquivos revisáveis.

## Matriz de validação

| Aceite | Prova | Resultado |
|---|---|---|
| AC-01 | Comparação com schema, rotas, serviços, frontend e scripts | Conferido: seis tabelas, contrato com ID, seleção por aba, bloqueios e execução |
| AC-02 | Leitura cruzada e busca de estados desatualizados | Conferido: feature integrada, 123/94/67, limites e INV abertos coerentes |
| AC-03 | Script documental, git diff --check e diff de arquivos não Markdown | Passou: 54 Markdown, 206 links, seis âncoras, 87 tabelas; somente Markdown e AGENTS intacto |

## Entrega

Sem migração, reset, alteração de código, nova validação funcional ou deploy.
Commit, push e PR para main autorizados em 2026-10-13 pelo pedido abaixo. A recuperação das
edições anteriores usa o histórico preservado e o backup temporário.

## Evidências e limitações

Conferência executada por Python transitório fora do repositório, com relatório
JSON temporário. Links locais, âncoras, colunas e fechamento de blocos passaram.
Busca editorial não encontrou feature futura, ausência de testes ou merge
pendente nos documentos de leitura atual. Relatos anteriores permanecem
explicitamente históricos. Aprovações e checkboxes de variantes manuais sem
prova individual foram preservados. Não houve nova consulta remota de links
GitHub/CI, teste funcional, build, escrita ERP/banco ou publicação.

## Autorização de publicação — 2026-10-13

Usuário: “quero essas correções na main, pode abrir o PR”. Autoriza commit,
push da branch docs/coerencia-da-documentacao ao repositório
eduardofrois/kaizen-test e abertura de PR para main. Merge permanece manual
pelo usuário; não há autorização para integração direta ou deploy.

## Publicação — 2026-10-13

Commit documental b7f7d16 publicado em docs/coerencia-da-documentacao.
[PR #18](https://github.com/eduardofrois/kaizen-test/pull/18) aberto para main, sem conflitos na consulta.
Checks testes-backend e build-frontend passaram no
[run 38404473049](https://github.com/eduardofrois/kaizen-test/actions/runs/38404473049), referente a b7f7d16.
Este registro complementar gera novo commit e nova CI, separados dessa prova.
Merge permanece manual; não houve integração direta na main ou deploy.
