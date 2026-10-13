# Situação atual da investigação

Atualizado em 2026-10-13. Referência de código: main `76eca4d`, incluindo
PR #17. A revisão documental ocorre em docs/coerencia-da-documentacao e
incorpora edições locais anteriores. Não há nova alteração de aplicação.

## Resultado e próxima ação

| Escopo | Situação atual | Próxima ação |
|---|---|---|
| KZN-312/318/325/331 | Corrigidos, integrados e com validação manual confirmada | Preservar regressões |
| FIX-001 a FIX-010 | Implementados; provas e limites nas unidades SDD | Consultar aceites por cenário |
| MULTI-001 v2 | Integrado à main; quatro achados posteriores corrigidos com TDD | Manter regras e registrar eventual nova validação humana separadamente |
| INV-001/002 | Mitigados por bloqueio/tentativa persistente por carrinho | Recuperar resultados incertos com evidência SIAC; não reenviar automaticamente |
| INV-003 | Regra de principal de endereço ainda aberta | Decidir permitir nenhum principal ou exigir um |
| INV-004 | Erro persistente em pedidos identificado por leitura | Reproduzir falha→sucesso no mesmo componente antes de corrigir |
| INV-005 | Texto da busca pode divergir da URL/histórico | Reproduzir e definir sincronização sem apagar rascunho |
| DOC-001 | Consolidação documental concluída; links/estados/diff conferidos | Publicação autorizada; preparar PR para main, com merge manual |
| Execução | Local confirmada; deploy público não registrado | Não apresentar publicação no GitHub como deploy |

## Evidências disponíveis

- Reavaliação de 2026-10-13 nesta conversa: 123/123 testes backend, 94/94
  frontend e build de 67 módulos passaram com Node 24.14.1.
- Testes isolam ERP e SQLite. Suítes de serviço/HTTP, controlador puro e
  componentes isolados não equivalem a uma suíte E2E completa.
- Usuário confirmou validação manual das correções em 2026-10-12 e da v1
  de múltiplos carrinhos em 2026-10-13.
- A revisão v2 tem RED/GREEN e ensaio de navegador em ambiente simulado.
  Não há confirmação humana específica da v2 ou homologação SIAC registrada.
- As medições da feature incluem seis larguras, foco/Escape, duas abas,
  URL/rolagem, compra fake e bloqueio persistente; detalhes no SDD.
- O Git confirmou o merge do PR #17 em `76eca4d`. CI anterior da
  implementação: [run 38360777053](https://github.com/eduardofrois/kaizen-test/actions/runs/38360777053).
  Não foi consultada nova execução remota nesta edição documental.

## Onde retomar

[Relatório](../RELATORIO.md) para a entrega;
[inventário](../fix.md) para causas e pendências;
[índice SDD](sdd/README.md) para decisões, aprovações e provas;
[arquitetura](../ARQUITETURA.md) e [mapa do código](ai/arch.md) para contratos;
[ambiente](ambiente.md) para execução.

A tarefa documental foi autorizada pelo pedido de alinhar tudo ao projeto
existente. Não autoriza mudanças de comportamento, correção dos INV abertos,
integração direta na main ou deploy. Commit/push/PR desta revisão foram
autorizados em 13/10/2026 pelo pedido de abrir o PR. Aprovações antigas
permanecem nas unidades.
Histórico anterior preservado em [docs/historico/investigacao.md](historico/investigacao.md).
