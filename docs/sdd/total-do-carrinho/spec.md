# Spec — Total do carrinho com itens indisponíveis

**Versão:** 1
**Estado:** Implementado — testes locais passaram; validação manual e PR pendentes
**Baseline/data:** origin/main 4261129; 2026-10-11
**Origem:** KZN-312; nota de leitura KZN-7F3A
**Pasta/branch:** total-do-carrinho / fix/total-do-carrinho
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11;
usuário: “Consegui recriar, perfeito. Docs aprovados.”

## Problema e evidência

lerCarrinho(), em backend/src/services/carrinhoService.js, soma valor_total
de todas as linhas, inclusive disponivel=false. enriquecerItens já identifica
produto inativo, sem estoque, estoque inferior à quantidade e falha na consulta.
O checkout já é bloqueado quando alguma linha tem pendência, mas a soma inclui
essas linhas. Investigação isolada anterior: R$20 disponíveis + 3×R$228 sem
estoque = R$704; excesso R$684. Teste automatizado de regressão ainda não existe.

FIX-003 (Math.floor na conversão monetária) é outra causa: há perda de centavos
mesmo com todos os itens disponíveis. Não será ocultada como resolvida aqui.

## Objetivo e comportamento esperado

O resumo deve mostrar o valor dos itens disponíveis na quantidade solicitada.
Uma linha indisponível permanece no carrinho, com quantidade, preço de
referência e motivo atuais, mas não contribui para o total do resumo.
Checkout permanece bloqueado até o cliente ajustar/remover todas as pendências.

Exemplo: item disponível de R$20 e radiador sem estoque com subtotal R$684
continuam listados; total do resumo é R$20 e checkout permanece bloqueado.
Linha com quantidade 3 e estoque 2 é excluída inteira do resumo; não reduzir
quantidade nem comprar parcialmente sem ação explícita do cliente.

## Escopo

Incluído: agregação de valor_total em lerCarrinho e regressões do serviço,
com SQLite em memória e ERP simulado; confirmação do bloqueio de checkout.
Fora: FIX-003, contador KZN-318, ajuste de quantidade FIX-006, tratamento novo
de falhas ERP, alterações de frontend, múltiplos carrinhos, schema, migração,
idempotência, reserva de estoque e mudança no payload enviado ao SIAC.
O aviso de pendências já existente na interface será preservado; eventual
melhoria de texto/representação de subtotal exige uma unidade revisada.

## Requisitos e invariantes

- REQ-01: somar somente linhas com disponivel=true; retorno monetário continua
  em reais, com agregação pela conversão em centavos existente.
- REQ-02: linhas indisponíveis permanecem no retorno e no banco, sem alterar
  quantidade, subtotal de referência, motivo ou flags.
- REQ-03: indisponível inclui inativo, zero estoque, estoque abaixo do pedido,
  ausente do catálogo e falha ERP, conforme classificação já existente.
- REQ-04: carrinho vazio tem total zero e pronto_para_checkout=false;
  só indisponíveis tem total zero e checkout bloqueado; todos disponíveis
  preservam soma e pronto_para_checkout=true.
- REQ-05: preservar a validação de finalizarPedido: pendência gera
  CARRINHO_COM_PENDENCIAS antes de qualquer POST/criação no ERP.
- REQ-06: preservar isolamento por usuario_id, shape HTTP, quantidade_itens,
  quantidade_pecas (bug separado), ordenação e consulta atualizada de preços/estoque.
- REQ-07: testes nunca leem .env/banco real nem usam rede ERP. Usar subprocesso
  com cwd temporário/env sintética, SQLite :memory: com schema real e fetch
  completamente substituído. Sem dependência nova ou refatoração para injeção.
- REQ-08: não modificar paraCentavos; provas do KZN-312 usam valores que não
  ativam FIX-003. Registrar explicitamente a limitação monetária restante.
- REQ-09: não alterar frontend, regras de adição/quantidade, endereços, pedidos
  ou limpeza do carrinho. Preservar nota KZN-7F3A no código e relatório.

## Contratos, dados e interface

Mantém campos e tipos de GET /api/carrinho e das operações que retornam
lerCarrinho. Apenas semântica de valor_total do resumo muda para filtrar
indisponíveis. item.valor_total continua subtotal de referência, inclusive
para linhas com pendência cujo preço é conhecido. Item sem catálogo continua
com valores zero, conforme implementação atual. Sem preço copiado para banco.
Sem migração, exclusão de dados, chamada de criação de pedido ou ajuste automático.

## Alternativas

1. **Filtrar disponivel na agregação do serviço (recomendado):** usa a regra
   central já existente e corrige todos os consumidores da API com mudança pequena.
2. Zerar os subtotais de linhas indisponíveis: alinha a soma visual, mas perde
   referência e muda outro campo do contrato; não necessário para este chamado.
3. Filtrar só no frontend: duplica regra e deixa API/checkout inconsistentes.
4. Comprar somente a parcela em estoque: exige decisão de produto e alteração
   de quantidade/payload; rejeitado nesta unidade.

## Critérios de aceite

- [x] AC-01: cenário R$20 + R$684 indisponíveis retorna total 20, duas linhas,
  subtotal de referência 684 preservado e checkout bloqueado.
- [x] AC-02: inativo, sem estoque, estoque insuficiente, 404 e 500 não entram
  no total; cada linha permanece com motivo e disponivel=false.
- [x] AC-03: vazio e só indisponíveis retornam zero/bloqueado; todos disponíveis
  mantêm total e habilitação; quantidades persistidas não são alteradas.
- [x] AC-04: itens de outro usuário não aparecem nem contribuem ao total.
- [x] AC-05: checkout com pendências rejeita com CARRINHO_COM_PENDENCIAS e
  nenhum POST ao ERP; alteração de estoque em nova leitura recalcula o resumo.
- [ ] AC-06: npm test passa com os seis testes de configuração e novos testes
  do carrinho, sem .env/rede/banco real; checks de backend/build passam no PR.
- [x] AC-07: docs registram causa, RED/GREEN, escopo e FIX-003 ainda pendente;
  código alterado apenas na agregação, nota preservada e merge manual.

## Riscos e validação

Total parcial não autoriza checkout parcial. Preço em linha indisponível é
referencial e pode divergir da soma do resumo; aviso atual informa pendências.
Falha ERP continua classificada como indisponibilidade: melhorar essa distinção
fica fora. Testes simulados não comprovam estoque real ou concorrência no ERP.

Após aprovação: regressões com schema real em memória e fetch simulado,
RED antes de alterar o serviço e GREEN depois, npm test e checks da pipeline.
Validar manualmente carrinho com pendência se houver cenário local seguro;
não alterar estoque do SIAC nem criar pedido para reproduzir o teste.
Sem necessidade de aguardar estoque real para provar a correção do serviço.

## Entrega e histórico

Atualizar KZN-312 em fix.md, RELATORIO.md, investigação e decisões conforme
resultados reais. FIX-003/KZN-318 continuam pendentes e terão SDD próprio.
Versão 1 aprovada e implementada; resultados registrados abaixo. Pedido do usuário: trabalhar
no total do carrinho após confirmar a pipeline antes e depois do merge.

## Implementação aprovada — 2026-10-11

Usuário confirmou reprodução manual do KZN-312 e aprovou versão 1 com
“Consegui recriar, perfeito. Docs aprovados.” Alteração do serviço limitada
à condição item.disponivel no redutor de valor_total. Linhas, quantidades,
subtotal referencial, contrato, contadores e bloqueio do checkout preservados.
Nota KZN-7F3A mantida. FIX-003 e FIX-005 não foram corrigidos nesta unidade.

RED: node --test tests/carrinho-total.test.js na baseline — onze testes,
seis falhas e cinco sucessos; cenário KZN-312 retornou 704 em vez de 20.
GREEN: npm test após a correção — 17 testes passaram (onze novos e seis
anteriores). Sintaxe de serviço/teste e git diff --check passaram. Harness
usou subprocessos com cwd temporário/env sintética, schema SQLite real em
:memory: e fetch substituído; nenhum .env/banco local/rede ERP utilizado.
Teste de finalizarPedido rejeitou pendências sem POST e preservou os itens.

Estado Implementado: validação automatizada local concluída; validação manual
da correção pelo candidato e checks no PR ainda pendentes. Usuário pediu
explicitamente aguardar seu comando para abrir PR, pois vai validar localmente.
Nenhum PR, merge ou pedido real criado pela IA. Publicação da branch segue
o fluxo autorizado; não equivale à autorização para abrir PR.
