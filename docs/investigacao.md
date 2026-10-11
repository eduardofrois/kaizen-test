# Situação da investigação

Atualização: 2026-10-11. Baseline original: `81897d5`.

## Retomada em outra sessão

1. Leia AGENTS.md e as fronteiras em docs/ai/.
2. Leia o inventário detalhado em [fix.md](../fix.md).
3. Confira Git, aprovação do usuário e a spec/plan da unidade selecionada.
4. Reconfira referências de código se a baseline tiver mudado.
5. Atualize os registros conforme a evidência evoluir.

## Inventário

| IDs | Estado | Próxima ação |
|---|---|---|
| KZN-312, 318, 325, 331 | Causa localizada; verificação isolada realizada | Preparar specs e planos antes de implementar |
| FIX-001 | Evidência estática; documentos SDD em proposta | Revisão e aprovação antes de alterar config/publicar aplicação |
| FIX-002 | Evidência estática | Especificar origens e validar ambiente |
| FIX-003, 004, 007, 008 | Verificação isolada realizada | Spec/plan e regressões focadas |
| FIX-005, 006 | Evidência estática | Reprodução integrada e spec/plan |
| FIX-009 | Restrições CSS localizadas | Reprodução visual desktop/celular |
| INV-001 a INV-005 | Pontos adicionais | Ver classificações e passos de confirmação em fix.md |
| MULTI-001 | Requisito obrigatório | Definir produto, modelagem, contrato e migração por SDD |

## Evidência já obtida

- Leitura de README, ARQUITETURA, RELATORIO, 25 arquivos backend/src e 20
  arquivos frontend/src, manifests, lockfiles, script de banco e build existente.
- Busca de notas em arquivos textuais do checkout: três identificadores.
- Consulta SQLite somente leitura/imutável: integrity check ok; tabelas vazias.
- Scripts transitórios em memória executaram funções originais, com stubs de
  banco/ERP e extração de funções frontend. Nenhum pedido real foi criado.
- Ainda não houve npm ci, build novo, servidor, navegador, deploy nem teste
  integrado com o SIAC. Não existe suíte de testes adicionada nesta etapa.

## Relatório

O usuário aprovou a estrutura documental e pediu esclarecimento sobre o
preenchimento. `RELATORIO.md` permanece no modelo original até confirmação.
Proposta: registrar causas/evidências conhecidas, os nove achados, limitações
da validação e as três notas; marcar implementação/deploy/feature como pendentes.
Não preencher nome, prazo ou horas com suposições.

## Repositório de entrega

Destino autorizado: https://github.com/eduardofrois/kaizen-test.
Em 2026-10-11, foi consultado como público e sem refs remotas. O primeiro
envio deve conter documentação e arquivos seguros; publicação da aplicação
aguarda remoção das credenciais literais por SDD. Não enviar o histórico da
empresa, que também contém a configuração original.
