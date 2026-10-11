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
- RELATORIO: primeira edição ainda aguarda confirmação do conteúdo proposto.

## DEC-003 — Repositório do candidato

- Estado: destino/inicialização/envio inicial autorizados em 2026-10-11.
- Destino: eduardofrois/kaizen-test, consultado como público e vazio.
- Procedimento: preservar README e histórico original em backup local;
  iniciar histórico próprio; publicar documentação primeiro.
- Motivo da publicação em etapas: config original contém segredos literais e
  sua alteração depende de aprovação SDD. Não publicar esses valores/histórico.
- Acesso/push só são considerados concluídos após confirmação remota.

## Propostas para MULTI-001 — ainda não aprovadas

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

## Como adicionar decisões

Registrar ID, estado, data, problema, alternativas, escolha, motivo e
consequências. Vincular à spec correspondente. Distinguir proposta, aprovação
e implementação. Não promover uma sugestão da IA a decisão do candidato.
