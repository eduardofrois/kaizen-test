# Spec — Coerência da documentação de entrega

**Versão:** 2
**Estado:** Revisão v2 concluída; atualização do PR #18 autorizada, com merge manual pendente.
**Baseline/data:** main integrada; 2026-10-13, America/Sao_Paulo.
**Origem:** DOC-001 — pedido de alinhar a documentação ao projeto existente.
**Branch:** `docs/coerencia-da-documentacao`.
**Autorização:** pedido do usuário nesta conversa, em 2026-10-13: “vamos trabalhar na melhoria da documentacao então, deixe tudo coezo com o que existe de fato no projeto. arrume”. Autoriza edição documental. Não constitui aprovação de mudanças de aplicação, testes, dependências, schema ou contratos.

## Problema e evidência

A main contém quatro chamados corrigidos, dez correções adicionais e múltiplos
carrinhos v2. Parte dos documentos ainda descreve a baseline ou uma etapa
intermediária. A revisão documental local anterior não entrou no PR da feature.
Relatório, arquitetura, índices e estados de publicação precisam concordar.

## Objetivo e escopo

Consolidar a documentação atual aproveitando as edições locais. Atualizar
README, relatório, arquitetura, ambiente, inventário, índices e metadados SDD.
Preservar decisões, aprovações e evidências históricas, distinguindo-as do
estado atual. O enunciado permanece reconhecível e a expressão “colocar no ar”
não será transformada em requisito explícito de hospedagem pública.

## Requisitos e invariantes

- REQ-01: descrever entidades, endpoints, seleção por aba, bloqueios e limites
  conforme o código da baseline revisada.
- REQ-02: registrar testes 123/123 backend, 94/94 frontend e build de 67 módulos
  como execução de 2026-10-13 já observada nesta conversa, sem inventar nova CI,
  validação humana da v2 ou homologação SIAC.
- REQ-03: registrar integração do PR #17 na main, conferida no Git;
  publicação documental autorizada separadamente em 2026-10-13, com PR para main.
- REQ-04: manter INV-003/004/005 abertos e descrever INV-001/002 como mitigados
  pela feature, com recuperação externa ainda limitada.
- REQ-05: preservar autoria, prazo e ressalvas das estimativas existentes;
  arquivar históricos extensos com links locais válidos.
- REQ-06: alterar somente Markdown; preservar AGENTS.md, fontes e gerados.

## Contratos, dados e interface

Sem alteração técnica. A documentação reflete os contratos já implementados.

## Critérios de aceite

- [x] AC-01: documentos de leitura atual não apresentam a feature como futura
  nem listam o contrato legado como API funcional.
- [x] AC-02: relatório, índices e SDD concordam sobre implementação, merge,
  validação, limitações e próxima ação.
- [x] AC-03: links locais, âncoras, tabelas, blocos e diff são conferidos;
  arquivos fora do escopo permanecem iguais à baseline.

## Validação e riscos

Comparar documentação com fontes, scripts, schema e workflow. Conferir links
e formatação por script transitório e revisar o diff. Preservar históricos
sem tratá-los como instruções atuais; não marcar variantes manuais pendentes
como executadas por uma confirmação geral. Não requer nova suíte funcional,
pois esta unidade não altera comportamento.

## Resultado — 2026-10-13

Relatório, arquitetura, execução, inventários e metadados reconciliados com
a main. Registros anteriores preservados em docs/historico.
Script transitório conferiu 54 Markdown, 206 links locais, seis âncoras,
87 tabelas e fechamento de blocos, sem erros. git diff --check passou;
comparação com main confirmou que arquivos não Markdown e AGENTS.md
não foram alterados. Resultados funcionais citados são os da reavaliação
anterior de 13/10, sem nova suíte, CI, validação humana ou deploy nesta edição.

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
