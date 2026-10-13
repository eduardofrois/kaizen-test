# Spec Driven Development

Atualizado em 2026-10-13, referência main.
Este índice mostra o estado atual. Aprovações, RED/GREEN, publicações e
pendências por cenário ficam na spec e no plano de cada unidade.

## Unidades

| Unidade | Referência | Estado e evidência |
|---|---|---|
| [Configuração por ambiente](configuracao-por-ambiente/spec.md) | FIX-001 | Integrada; testes isolados e manual confirmados |
| [Pipeline de validação](pipeline-de-validacao/spec.md) | CI-001 | Integrada; testes/build em PR registrados; comprovação específica do evento push/main permanece pendente no plano |
| [Total do carrinho](total-do-carrinho/spec.md) | KZN-312 | Integrado; regressões de serviço e manual |
| [Contador do carrinho](contador-do-carrinho/spec.md) | KZN-318 | Integrado; soma de unidades, regressões e manual |
| [Busca e paginação](busca-e-paginacao/spec.md) | KZN-325 | Integrada; helper de URL testado e manual |
| [Endereço selecionado](endereco-selecionado-no-checkout/spec.md) | KZN-331 | Integrado; payload manual e HTTP fake da feature; sem prova de pedido SIAC real |
| [Carrinho por sessão](carrinho-por-sessao/spec.md) | FIX-005 | Integrado; controlador e troca manual; contrato evoluído na feature |
| [Precisão monetária](precisao-monetaria/spec.md) | FIX-003 | Integrada; dinheiro/carrinho/pedido fake e manual |
| [Última página](ultima-pagina/spec.md) | FIX-004 | Integrada; componente isolado e confirmação manual |
| [Ajuste de quantidade](ajuste-de-quantidade-com-estoque-reduzido/spec.md) | FIX-006 | Integrado; serviços/handlers, estoque e manual |
| [Remoção de telefone](remocao-de-telefone-do-perfil/spec.md) | FIX-007 | Integrada; serviço/HTTP, posse e manual |
| [Espaços na senha](espacos-na-autenticacao-de-senha/spec.md) | FIX-008 | Integrados; HTTP/scrypt e manual |
| [Layout responsivo](layout-responsivo-do-catalogo/spec.md) | FIX-009 | Integrado; medidas e manual; painel tem evidência própria |
| [Documento e telefone](limites-de-documento-e-telefone/spec.md) | FIX-010 | Integrados; funções de máscara e manual; variantes de IME/autofill não comprovadas integralmente |
| [Múltiplos carrinhos](multiplos-carrinhos/spec.md) | MULTI-001 | V2 integrada no PR #17; TDD e navegador simulado; manual da v1 confirmado |
| [Coerência da documentação](coerencia-da-documentacao/spec.md) | DOC-001 | Publicada no [PR #18](https://github.com/eduardofrois/kaizen-test/pull/18); checks iniciais passaram; merge manual |

As 14 correções têm confirmação manual consolidada do usuário em 12/10/2026.
Isso complementa os registros; checkboxes de variantes sem prova individual
não foram marcados automaticamente. V1 de múltiplos carrinhos teve confirmação
humana em 13/10/2026; v2 tem testes/ensaio simulado, sem nova confirmação humana
específica. INV-003/004/005 seguem abertos no [inventário](../../fix.md).

## Validação e publicação atuais

Na reavaliação de 13/10/2026 desta conversa, Node 24.14.1:
**123/123 backend, 94/94 frontend e build de 67 módulos passaram**.
ERP simulado e SQLite isolado; build não é navegação integrada.
Nenhuma escrita no SIAC real foi feita. A conferência editorial precedeu a
publicação; o PR documental agora tem CI própria registrada abaixo.

PR #17 integrado, conferido pelo Git. A implementação teve checks
aprovados no [run 38360777053](https://github.com/eduardofrois/kaizen-test/actions/runs/38360777053).
Não se presume resultado de uma execução remota posterior. Publicação no
GitHub, execução local e deploy são estados distintos; deploy público não
registrado. [PR #18](https://github.com/eduardofrois/kaizen-test/pull/18) aberto para a revisão documental,
com checks iniciais aprovados no [run 38404473049](https://github.com/eduardofrois/kaizen-test/actions/runs/38404473049).
Registro complementar gera nova execução; merge permanece manual.

## Fluxo acordado

1. Investigar e reunir evidência, distinguindo leitura, simulação e integração.
2. Preparar docs/sdd/<nome-descritivo>/spec.md com comportamento e aceites.
3. Preparar plan.md com arquivos, passos e provas ligados à spec.
4. Obter aprovação explícita antes de alterar aplicação, testes, dependências,
   contratos ou schema; documentação não concede essa autorização.
5. Implementar o escopo aprovado em branch <tipo>/<assunto>.
6. Validar critérios e regressões pertinentes.
7. Atualizar estado, evidências, limites, inventário e relatório autorizado.
8. Commit/push/PR dependem do escopo autorizado na sessão; merge é manual.

[Modelos](./_templates/spec.md) são propostas genéricas, não decisões aprovadas.
Mudança material de comportamento/risco exige revisão; ajuste editorial
coerente com a implementação aprovada não altera essa aprovação.
O pedido de DOC-001 autoriza somente a reconciliação documental.

## Leitura dos documentos de unidade

Cabeçalho informa estado atual; baseline e seção de problema descrevem a
origem da unidade. Planos registram a sequência aprovada e seus desvios.
Aprovações e resultados datados são históricos; “pendente” em relato passado
não reabre por si só uma etapa concluída depois. Matriz e evidências deixam
explícitas variantes ainda sem validação.

Contratos antigos de carrinho presentes nos exemplos de unidades anteriores
são históricos. Implementação atual usa IDs explícitos; veja
[múltiplos carrinhos](multiplos-carrinhos/spec.md) e
[ARQUITETURA.md](../../ARQUITETURA.md#endpoints).

## Responsabilidade de cada documento

| Documento | Papel |
|---|---|
| README | Enunciado e execução |
| ARQUITETURA / docs/ai/arch | Contratos, regras e mapa do código atual |
| RELATORIO | Resultado apresentado ao avaliador |
| fix / docs/investigacao | Causas, grau de evidência, pendências e próxima ação |
| Spec / plan | Escopo, decisões, autorização, execução e validação da unidade |
| docs/historico | Registro de etapas passadas, sem caráter de estado atual |
| AGENTS | Instruções duradouras; não recebe status de tarefas |
