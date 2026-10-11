# Spec Driven Development

## Fluxo acordado

1. Investigar o comportamento e reunir evidência.
2. Escrever `docs/sdd/<nome-descritivo>/spec.md`; revisar requisitos e decisões com o usuário.
3. Escrever `docs/sdd/<nome-descritivo>/plan.md` cobrindo a spec.
4. Obter aprovação explícita para implementar os documentos revisados.
5. Implementar apenas o escopo aprovado, em branch `<tipo>/<assunto>` (ex.: `fix/total-do-carrinho`).
6. Executar validações previstas e regressões pertinentes.
7. Atualizar fix.md, spec/plano e, quando autorizado, RELATORIO.md.

Documentos podem ser preparados como propostas em paralelo à investigação.
Nunca executar um plano em proposta. Aprovação da organização documental,
pedido para investigar ou comando genérico para continuar não substitui a
aprovação de uma implementação claramente identificada.

## Organização

```text
docs/sdd/
  README.md
  _templates/
    spec.md
    plan.md
  total-do-carrinho/
    spec.md
    plan.md
  configuracao-por-ambiente/
    spec.md
    plan.md
  multiplos-carrinhos/
    spec.md
    plan.md
```

Pastas de exemplos só são criadas quando houver unidade em preparação.
Configuração por ambiente está validada. Pipeline de validação está Validada, com execução push/main confirmada
no run 38172472231; demais correções/features ainda não têm aprovação.
Total do carrinho (KZN-312) versão 1 Validado: 17 testes, confirmação manual
e checks do PR #3 concluídos. Merge manual pelo usuário pendente.
Preferir uma unidade por causa/regra; justificar agrupamento de mudanças
interdependentes sem esconder vários problemas num único commit.

## Conteúdo e rastreabilidade

- Nomear pasta e branch pelo objetivo concreto, em minúsculas com hífens.
  Não usar apenas IDs como fix-001 para identificar o trabalho.
- Manter ID oficial KZN, quando existir, nos metadados; FIX/INV são IDs
  internos do inventário e servem para rastrear a origem.
- Spec define comportamento e aceite; plan define arquivos, passos e provas.
- Registrar versão, estado, baseline e referência da aprovação nos dois.
- Registrar aprovação como mensagem do usuário + data e escopo; usar ID da
  mensagem se a ferramenta disponibilizar. Não inventar IDs ou datas.
- Mudança material exige nova revisão e invalida a aprovação da parte afetada.
- Marcar cada critério da spec no plano, incluindo isolamento e migração.
- Registrar resultado observado, não apenas resultado esperado.

## Estados

| Estado | Significado |
|---|---|
| Proposta | Documento em revisão; implementação não autorizada |
| Aprovado | Usuário aprovou explicitamente a versão e o escopo |
| Em implementação | Alterações autorizadas em andamento |
| Implementado | Código pronto; validação ainda pode estar pendente |
| Validado | Critérios executados e resultados registrados |
| Adiado/descartado | Motivo documentado, com evidência quando aplicável |

## Validação

Usar testes focados no risco: dinheiro, autenticação, posse, migração e checkout
merecem provas de regressão; texto documental pode ser conferido por diff e
links. Não impor cobertura completa ao teste técnico. Nunca usar o ERP real
para escritas automáticas. Testes com fake não provam o contrato real do SIAC.

## Retomada

Antes de continuar uma spec aprovada, conferir se código/contratos e documentos
permanecem compatíveis. Consultar aprovação registrada e não reinferi-la de
uma checklist preenchida pela IA. Se faltar informação, avançar na investigação
independente e explicitar a decisão necessária.

Contador do carrinho (KZN-318) versão 1 Validado: 23 testes, build, confirmação
manual e checks do PR #5 concluídos. Merge manual pendente.
