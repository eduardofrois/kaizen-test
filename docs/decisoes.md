# Decisões e propostas

## DEC-001 — SDD com aprovação humana

- Estado: aprovado pelo usuário em 2026-10-11.
- Regra: correções/features têm spec.md e plan.md e só são implementadas após
  aprovação explícita. A aprovação documental não equivale à de implementação.
- Motivo: permitir revisão das causas, critérios e impacto antes de mudar código.

## DEC-002 — Organização documental

- Estado: estrutura aprovada pelo usuário em 2026-10-11.
- Arquivos: AGENTS, arch, boundaries, investigação, decisões, ambiente,
  fluxo/modelos SDD e fix.md detalhado.
- Motivo: contexto recuperável entre sessões, sem misturar instruções da IA,
  análise interna e relato de entrega.
- RELATORIO: preenchimento inicial aprovado em 2026-10-11, com evidências e
  pendências explícitas; não autoriza implementar correções.

## DEC-003 — Repositório do candidato

- Estado: destino/inicialização/envio inicial autorizados em 2026-10-11.
- Destino: eduardofrois/kaizen-test, consultado como público e vazio.
- Procedimento executado: README preservado, Git original em backup local,
  histórico próprio iniciado na main e primeiro envio documental realizado
  no commit `0b75868`, com upstream configurado.
- Motivo da publicação em etapas: config original contém segredos literais e
  sua alteração depende de aprovação SDD. Não publicar esses valores/histórico.
- Acesso/push só são considerados concluídos após confirmação remota.

## DEC-004 — Nomes descritivos para trabalho SDD

- Estado: solicitado pelo usuário em 2026-10-11.
- Usar objetivo concreto para pasta/branch/título, como
  `configuracao-por-ambiente`, `total-do-carrinho` e `multiplos-carrinhos`.
- IDs FIX/KZN/INV permanecem nos metadados e no inventário para rastreabilidade.
- Motivo: facilitar entender o que será feito ao retomar em outra sessão.
- Renomear documentos não aprova sua implementação.

## Propostas para MULTI-001 — ainda não aprovadas

As escolhas desta seção seguem em proposta. O preenchimento aprovado do
relatório mantém essas decisões de produto como pendentes.

| Pergunta | Proposta inicial | Justificativa a revisar |
|---|---|---|
| Limite | 10 carrinhos por usuário | Limite previsível; valor é escolha de produto |
| Excluir ativo | Selecionar outro; último excluído gera padrão vazio | Evitar estado sem destino para adicionar peças |
| Vitrine desktop | Painel lateral | Editar carrinho sem abandonar resultado da busca |
| Celular | Painel recolhível | Preservar espaço para catálogo e acesso às ações |
| Entrada na loja | Último carrinho ativo persistido | Retomar orçamento de onde parou |
| Após checkout | Manter carrinho e nome; retirar conteúdo comprado | Reutilizar organização e preservar demais carrinhos |

Direção técnica proposta: entidade carrinhos; itens por carrinho; seleção
persistida no servidor; IDs explícitos nas operações; posse verificada em
todas as rotas; migração preservando itens existentes. Regras para alterações
concorrentes, duplicidade e múltiplas abas precisam entrar na spec.

## DEC-005 — Preenchimento inicial do relatório

- Estado: aprovado pelo usuário em 2026-10-11.
- Referência: "aprovo o preenchumento inicial, vai fazendo as alteracoes
  enquanto eu avalio sobre a config do ambiente".
- Conteúdo: oito seções originais, com causas e verificações já realizadas,
  descobertas, preparação documental/Git, notas e pendências de execução.
- Limites: não inventar identificação, prazo, horas, testes ou correções.
  Configuração foi aprovada separadamente depois; outras correções seguem sem aprovação.
- Motivo: manter a comunicação de entrega atualizada desde a investigação.

## Como adicionar decisões

Registrar ID, estado, data, problema, alternativas, escolha, motivo e
consequências. Vincular à spec correspondente. Distinguir proposta, aprovação
e implementação. Não promover uma sugestão da IA a decisão do candidato.

## DEC-006 — Configuração explícita e ambiente local

- Estado: aprovado e implementado em 2026-10-11.
- Referência: usuário aprovou "fix configuracao por ambiente" e solicitou
  criação de .env com variáveis a preencher e atualização do relatório.
- Escolha: exigir JWT_SEGREDO, ERP_URL e ERP_TOKEN; rejeitar placeholders,
  segredo curto e URL inválida sem revelar valores. Manter defaults operacionais.
- Motivo: impedir sessões/integração com credenciais implícitas e publicação
  de literais. A alternativa de gerar segredo no boot invalidaria sessões.
- Complemento autorizado: backend/.env local, ignorado, permissão 0600,
  campos obrigatórios vazios. Não copiar valores expostos da baseline.
- Evidência: seis testes e sintaxe passaram; candidato confirmou preenchimento
  local, catálogo, login, refresh, logout e rejeição de JWT_SEGREDO vazio.
  Checkout não validado. Não houve revogação do token no SIAC nem novo push.

## DEC-007 — Branches por tipo e merge manual no GitHub

- Estado: solicitado pelo candidato em 2026-10-11.
- Convenção: <tipo>/<assunto>, usando tipos de Conventional Commits,
  sem prefixo codex. Commits mantêm tipo: descrição.
- Branch de configuração renomeada para fix/configuracao-por-ambiente.
  Referências ao nome antigo nos registros anteriores são históricas.
- Publicar branches de trabalho no repositório próprio; merges serão feitos
  manualmente pelo candidato no GitHub. Não realizar novos merges locais
  sem instrução explícita. O merge anterior já realizado permanece no histórico.

## DEC-008 — Pipeline inicial enxuta

- Estado: versão 1 aprovada em 2026-10-11 (“aprovo”); implementada e
  validada localmente. PR #2 passou em opened e synchronize; push/main após merge manual pendente.
- Direção: GitHub Actions com testes-backend e build-frontend independentes,
  Node 24.14.1 e ubuntu-24.04; PRs para main e pushes na main.
- Motivo: automatizar verificações existentes sem credenciais ERP. Build
  não substitui testes de interface; suíte de negócio/E2E fica fora.
- CI não altera regras de proteção nem faz merge/deploy. Selecionar checks
  obrigatórios só após sucesso remoto. Spec/plan: pipeline-de-validacao.
