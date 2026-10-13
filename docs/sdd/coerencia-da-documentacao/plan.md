# Plano — Coerência da documentação de entrega

**Versão:** 2
**Estado:** Revisão v2 concluída; atualização do PR #18 autorizada, com merge manual pendente.
**Spec:** [spec.md](spec.md).
**Baseline/data:** 2026-10-13.
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
| Specs e planos das unidades | Manter decisões, aprovações e evidências sem arquivos históricos paralelos |

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

Commit documental publicado em docs/coerencia-da-documentacao.
[PR #18](https://github.com/eduardofrois/kaizen-test/pull/18) aberto para main, sem conflitos na consulta.
Checks testes-backend e build-frontend passaram no
[run 38404473049](https://github.com/eduardofrois/kaizen-test/actions/runs/38404473049), referente à publicação.
A revisão v2 abaixo tem envio autorizado no registro mais recente; resultados de CI anteriores não validam automaticamente esta atualização.
Merge permanece manual; não houve integração direta na main ou deploy.

## Revisão v2 — referências e conclusões da entrega

**Autorização — 2026-10-13:** pedido direto do usuário nesta conversa para remover referências a commits, informar as branches preservadas no README e avaliar a entrega conforme o README original e o e-mail recebido. Restrição expressa: somente código e documentação neste momento. Esta execução altera apenas Markdown e não publica alterações.

- [x] Remover identificadores de commits dos documentos atuais e históricos, preservando aprovações, datas e evidências de execução.
- [x] Atualizar o modelo SDD para usar estado ou branch de referência.
- [x] Informar no README as branches publicadas preservadas para avaliação.
- [x] Registrar a comparação com o enunciado e o e-mail em [relatório de entrega](../../../RELATORIO.md), distinguindo execução, validação e publicação.
- [x] Conferir links, formatação, ausência de identificadores e escopo final do diff.

Validação v2: 55 arquivos Markdown, 213 links locais, seis âncoras e 89 tabelas conferidos, sem erros; blocos fechados e git diff --check aprovado. Somente Markdown alterado; AGENTS.md e aplicação preservados. Nenhuma nova suíte funcional ou publicação nesta revisão.

## Ajuste editorial — 13/10/2026

Pedido do usuário nesta conversa: “então faça essa alteração”, em resposta à
proposta de remover o documento separado de avaliação e consolidar somente as
conclusões úteis no RELATORIO.md. Ajuste dentro do escopo documental da v2.

- [x] Remover o arquivo separado de avaliação.
- [x] Consolidar resultados e limitações no relatório existente.
- [x] Atualizar README e referências nos registros da unidade e da investigação.
- [x] Conferir links locais e diff; manter alterações apenas locais.

Validação do ajuste: 54 arquivos Markdown, 211 links locais, seis âncoras e
87 tabelas conferidos sem erros; git diff --check passou. Nenhuma referência
ao arquivo removido permanece. Aplicação e testes não foram alterados.

## Autorização de atualização do PR — 13/10/2026

Usuário: “pode commitar para eu avaliar no PR 18”. Autoriza commit das alterações
documentais revisadas e push da branch docs/coerencia-da-documentacao para
atualizar o PR #18 em eduardofrois/kaizen-test. Não autoriza merge ou deploy.
Escopo: remoção de referências a commits, aviso das branches no README e
conclusões consolidadas no RELATORIO.md, sem arquivo separado de avaliação.
Validação documental registrada acima; nova CI será conferida após o envio.

## Simplificação dos registros — 13/10/2026

Pedido do usuário: “não vejo necessidade de um arquivo de histórico tb”.
Escopo documental: remover os cinco arquivos redundantes da pasta de históricos,
ajustar referências e manter resultados no relatório, situação na investigação
e decisões, aprovações e provas nas unidades SDD existentes. Não altera código.

- [x] Remover os arquivos históricos separados.
- [x] Apontar referências para os documentos atuais e unidades SDD.
- [x] Validar links, formatação e diff.

Verificação: 49 arquivos Markdown, 144 links locais, cinco âncoras e 78 tabelas
conferidos sem erros. Blocos fechados; git diff --check passou. Nenhum link
para os arquivos removidos permanece. Aplicação e testes preservados.

Publicação autorizada em 13/10/2026 pelo usuário: “commita”, após a revisão
da remoção dos históricos. Autoriza commit e atualização da branch do PR #18
em eduardofrois/kaizen-test; merge permanece manual e deploy fora do escopo.

## Prioridades futuras da entrega — 13/10/2026

Pedido do usuário nesta conversa: avaliar a prontidão e conferir suas propostas
de refatoração, componentes/interface e Docker/proxy/CI/CD para a seção de
melhorias futuras. Escopo: redação da seção 7 do RELATORIO.md com base no código
existente, sem implementar essas propostas ou publicar esta edição.

- [x] Conferir carrinhoService, componentes e páginas, workflow e ausência de Docker/proxy.
- [x] Distinguir refinamento de componentes existentes e CD futuro da CI já implementada.
- [x] Preservar riscos e pendências já documentados.

Consulta ao GitHub confirmou PR #18 integrado em 13/10/2026 e ambos os checks
aprovados na execução 38409343064. Esta edição documental é posterior ao merge
e permanece local. Não houve nova execução funcional ou avaliação visual no navegador.

Complemento solicitado pelo usuário em 13/10/2026: incluir testes ponta a ponta
(E2E) e outros tipos de testes nas prioridades futuras. Seção 7 atualizada com
E2E, interação, acessibilidade, contrato, carga/desempenho, segurança e
concorrência; distingue ampliação dos testes existentes e preserva ERP simulado
e banco isolado. Ajuste apenas documental, sem implementação ou publicação.

## Publicação das prioridades futuras — 13/10/2026

Autorização do usuário nesta conversa: “vamos subir isso no git e depois enviar
para o email dos avaliadores”, com revisão obrigatória do e-mail antes do envio.
Escopo Git: commit e push desta revisão documental em docs/prioridades-futuras
e PR para main, pois o PR #18 já foi integrado. Merge permanece manual.
Escopo do e-mail nesta etapa: preparar e apresentar texto; envio somente após
aprovação explícita. Documentação validada; sem alteração de aplicação.
