# Inventário de correções e investigação — Kaizen

Atualizado em **2026-10-13**, referência main **76eca4d**.
Quatro chamados, dez correções adicionais e múltiplos carrinhos v2 estão
implementados e integrados. Este inventário descreve o estado atual.
Reproduções cronológicas, aprovações e publicações anteriores foram preservadas
no [histórico](docs/historico/fix.md); decisões e provas por unidade ficam no
[SDD](docs/sdd/README.md). A baseline investigada era o commit original 81897d5.

## Evidência e validação

- **Estática:** leitura do código; não implica reprodução de navegador.
- **Isolada:** funções, serviços ou API real com ERP fake e SQLite descartável.
- **Navegador simulado:** React/Express reais com dados sintéticos; não é SIAC real.
- **Manual do usuário:** correções confirmadas em 12/10/2026; v1 de múltiplos
  carrinhos confirmada em 13/10/2026. Sem confirmação humana específica da v2.
- **Risco/decisão:** hipótese ou regra ambígua, sem alegação de correção.

Na reavaliação de **13/10/2026** desta conversa, backend **123/123**, frontend
**94/94** e build **67 módulos** passaram, com Node 24.14.1.
São resultados já executados antes desta edição documental. As suítes não
criam pedidos no SIAC real. Não há nova CI, deploy, backup/migração real ou
auditoria exaustiva de segurança/contraste nesta revisão.

## Chamados corrigidos

| ID | Causa original e reprodução | Correção e prova |
|---|---|---|
| KZN-312 | Total somava linhas indisponíveis; R$20 disponíveis + 3×R$228 sem estoque geravam R$704 | Agregação inclui só linhas disponíveis, sem ocultar pendências; regressões de carrinho e manual confirmados |
| KZN-318 | Contador usava itens.length; duas linhas 3+4 mostravam 2 | Soma de unidades, inclusive pendentes; quantidade_itens mantém produtos distintos; regressões/manual |
| KZN-325 | Busca/filtros preservavam pagina antiga; pesquisa a partir da página 2 podia consultar página inexistente | Helper de URL remove pagina ao mudar filtros; testes reais do helper e manual |
| KZN-331 | Checkout ignorava enderecoId e enviava principal/primeiro | Payload usa endereço selecionado; backend verifica posse e snapshot; payload manual e checkout HTTP fake com endereço alternativo |

As provas originais e os limites da validação estão nas unidades
[total](docs/sdd/total-do-carrinho/spec.md),
[contador](docs/sdd/contador-do-carrinho/spec.md),
[busca](docs/sdd/busca-e-paginacao/spec.md) e
[endereço](docs/sdd/endereco-selecionado-no-checkout/spec.md).

## Correções adicionais implementadas

| ID e unidade | Causa e impacto originais | Resultado e evidência |
|---|---|---|
| [FIX-001 — Configuração](docs/sdd/configuracao-por-ambiente/spec.md) | Fallbacks literais de JWT/ERP contornavam fail-fast e expunham credenciais | Env obrigatória, validação sem valores nos erros, histórico de entrega separado; testes/processos isolados e manual. Revogação externa não executada |
| [FIX-002 — CORS](docs/sdd/restricao-de-origem-cors/spec.md) | Reflexão de qualquer origem ignorava CORS_ORIGEM | Comparação exata, origem canônica, produção sem permissão cruzada por padrão; testes HTTP/config e manual. Não substitui CSRF/posse |
| [FIX-003 — Dinheiro](docs/sdd/precisao-monetaria/spec.md) | floor truncava 1,15→114 centavos | round no domínio de até duas casas, cálculos inteiros; helper, carrinho e pedido fake testados. Históricos não reescritos |
| [FIX-004 — Última página](docs/sdd/ultima-pagina/spec.md) | Próxima bloqueava em pagina >= total-1 | Limite corrigido no componente compartilhado; testes de HTML/handlers e confirmação manual |
| [FIX-005 — Sessão](docs/sdd/carrinho-por-sessao/spec.md) | Provider não acompanhava login/logout, mantendo conteúdo residual até F5 | Ciclo autenticado e descarte de respostas antigas; controlador real testado e troca manual X/Y/X |
| [FIX-006 — Quantidade](docs/sdd/ajuste-de-quantidade-com-estoque-reduzido/spec.md) | disponivel=false bloqueava redução de 5→3 com estoque 3 | Capacidade quantidade_editavel separada da compra; limite e revalidação backend; serviços/handlers testados e manual |
| [FIX-007 — Telefone](docs/sdd/remocao-de-telefone-do-perfil/spec.md) | truthiness mantinha contato antigo diante de null | Omissão preserva, limpeza explícita remove; serviço/HTTP, posse e F5 manual |
| [FIX-008 — Senha](docs/sdd/espacos-na-autenticacao-de-senha/spec.md) | Login/senha atual aplicavam trim, diferente de cadastro/nova senha | Validador preserva entrada; scrypt/NFKC mantidos; fluxo HTTP real com SQLite temporário e manual |
| [FIX-009 — Responsividade](docs/sdd/layout-responsivo-do-catalogo/spec.md) | Busca mínima 380px e quatro colunas comprimiam celular | Cabeçalho/grade responsivos; medidas de visitante e manual. Matriz posterior do painel registrada na feature |
| [FIX-010 — Máscaras](docs/sdd/limites-de-documento-e-telefone/spec.md) | Documento/telefone só avisavam excesso após envio | Funções e componente compartilhados, colagem/cursor/limites; testes e manual. Sem dígitos verificadores ou matriz integral de IME/autofill |

Confirmação manual geral não transforma cada variante pendente das matrizes
SDD em ensaio individual executado. As contagens por etapa nos planos são
históricas; a suíte atual é a descrita no início deste inventário.

## MULTI-001 — Múltiplos carrinhos v2

Entidade própria, itens por ID, principal persistido e ativo por aba;
dez carrinhos, 50 produtos distintos e 99 unidades por produto.
Gestão/painel na vitrine, escolha opcional do destino, exclusão determinística
e migração transacional estão implementados.

Checkout usa versão e tentativa, bloqueia a origem antes do envio e conserva
a proteção em resultado incerto. Mutações revalidam após awaits; outro carrinho
continua editável. Sucesso limpa só a origem e mantém ID/nome/principal.
Replay concluído retorna vínculo sem segundo POST. Tentativas não expiram.

| Revisão posterior | Falha reproduzida | Resultado da v2 |
|---|---|---|
| REV-01 | Lista antiga apagava seleção nova ou removia carrinho recém-criado da lista local | Seleção/gestão invalidam listagens anteriores; regressões com promises |
| REV-02 | Mutação v2 atrasada substituía leitura v3 | Leitura/escrita validam ID/versão; recarga mais nova preservada |
| REV-03 | Fila global prendia carrinhos diferentes | Filas/ocupação por ID e gestão separada; seletor conferido em navegador fake |
| REV-04 | Resposta parcial com número ERP válido/total inválido perdia a referência | Número transportado internamente e persistido quando possível; bloqueio/itens preservados |

V2 corrigida com 22 regressões TDD. [Spec](docs/sdd/multiplos-carrinhos/spec.md),
[plano](docs/sdd/multiplos-carrinhos/plan.md),
[revisão](docs/sdd/multiplos-carrinhos/revisao.md),
[visual](docs/sdd/multiplos-carrinhos/validacao-visual.md) e
[recuperação](docs/sdd/multiplos-carrinhos/recuperacao.md).

Commit de implementação 2f9ff7a; [PR #17](https://github.com/eduardofrois/kaizen-test/pull/17)
integrado em 76eca4d, conforme Git local atualizado nesta conversa.
Checks da implementação registrados no
[run 38360777053](https://github.com/eduardofrois/kaizen-test/actions/runs/38360777053).
Não foi feita nova consulta remota de CI nesta revisão.

## Investigações e limites atuais

### INV-001 — Concorrência e repetição de checkout

**Estado: mitigado pela feature, com limite remoto conhecido.**
A simulação original gerava dois pedidos do mesmo conteúdo. Hoje bloqueio
persistente exclusivo e identidade de tentativa impedem esse caminho local;
testes cobrem chamadas retidas, conexões distintas, replay e reabertura.
Não há contrato demonstrado de idempotência remota ou atomicidade distribuída.
Após timeout/resposta perdida, manter bloqueio e verificar no SIAC.
Instâncias com SQLite independentes não compartilham a proteção.

### INV-002 — Alteração durante checkout

**Estado: mitigado pela feature.**
A limpeza original por usuário podia apagar alterações que não entraram no
pedido. Hoje o carrinho de origem fica bloqueado, inclusive para mutações que
consultaram o ERP antes do bloqueio. Limpeza é restrita à origem e transacional
com vínculo/versão/conclusão. Interleaving coberto com ERP fake retido.
Recuperação de possível criação remota permanece como limite de INV-001.

### INV-003 — Endereço sem principal

**Estado: regra aberta; não corrigido.**
enderecoService permite desmarcar o principal sem promover outro; checkout
usa o primeiro como fallback. Diferente de carrinhos, endereços não têm a regra
aprovada de exatamente um principal. Decidir a política antes de mudar.
Validar edição com false/omissão, criação/exclusão e snapshots históricos.

### INV-004 — Erro persistente em pedidos

**Estado: evidência estática; reprodução de interface pendente.**
Pedidos.jsx e PedidoDetalhe.jsx não limpam o erro anterior em nova consulta
ou sucesso. Com o componente montado, uma resposta posterior pode ficar
escondida. Reproduzir falha→sucesso no mesmo componente e verificar respostas
tardias antes de preparar correção. Não declarar resolvido por build/testes gerais.

### INV-005 — Texto da busca e histórico

**Estado: evidência estática; reprodução com histórico pendente.**
Cabecalho.jsx inicializa busca pela URL uma vez. Limpar pelo catálogo ou usar
voltar/avançar pode conservar o texto antigo. KZN-325 corrigiu página, não este
rascunho. Definir sincronização sem apagar digitação ainda não confirmada.

## Notas de revisão preservadas

Além dos INV acima, o enriquecimento de item ainda usa a mesma mensagem
de pendência para produto ausente e falha técnica ERP. A linha é preservada
e o checkout bloqueia; esse limite de comunicação está descrito na arquitetura.

| Identificador | Fonte | Relação |
|---|---|---|
| KZN-2B9C | backend/src/config.js | Configuração e segredos |
| KZN-7F3A | backend/src/services/carrinhoService.js | Total, contador e quantidade |
| KZN-5D1E | frontend/src/componentes/Cabecalho.jsx | Busca, contador e layout |

## DOC-001 — Consolidação documental — 2026-10-13

Pedido direto do usuário autoriza alinhar documentos ao código existente.
Trabalho em docs/coerencia-da-documentacao, preservando edições anteriores.
Relatório, arquitetura/API, execução, inventários e estados SDD reconciliados;
históricos extensos preservados em docs/historico. A expressão “colocar no ar”
foi mantida como menção do enunciado, sem inventar requisito de domínio público.

A unidade não modifica código, testes, dependências, schema ou ambiente.
[Spec e plano documentais](docs/sdd/coerencia-da-documentacao/spec.md) registram
as verificações desta edição. Em 13/10/2026, usuário pediu abrir o PR:
commit/push/publicação documental autorizados, com destino main e merge manual.
