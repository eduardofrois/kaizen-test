# Spec — Coerência da documentação de entrega

**Versão:** 1
**Estado:** Concluído e validado documentalmente; publicação autorizada, PR em preparação.
**Baseline/data:** `76eca4d`, main integrada; 2026-10-13, America/Sao_Paulo.
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
- REQ-03: registrar integração do PR #17 na main em `76eca4d`, conferida no Git;
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
a main 76eca4d. Registros anteriores preservados em docs/historico.
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
