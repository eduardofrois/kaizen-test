# Spec — Ajuste de quantidade com estoque reduzido

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Baseline/data:** 0845692; 2026-10-11
**Origem:** FIX-006
**Branch:** fix/ajuste-de-quantidade-com-estoque-reduzido
**Aprovação do desenho:** 2026-10-11; usuário “aprovado”, após apresentação da spec versão 1.
**Aprovação para implementar:** 2026-10-11; usuário “aprovao”, após apresentação do plano versão 1.


**Validação manual atual — 2026-10-12:** concluída pelo usuário. Referência:
“Agora eu preciso que voce revise os arquivos e mude aonde fala que eu nao fiz
a validação manual, pois eu fiz.” A confirmação complementa as evidências
anteriores; não acrescenta execução pela IA, capturas por variante, exploração
de segurança ou pedido real no SIAC. Requisitos e aprovações de implementação
permanecem os já registrados. Esta revisão documental não autoriza publicação.

> Leitura atualizada em 2026-10-13, referência main 76eca4d. O problema e
> os exemplos de execução abaixo descrevem a baseline e o escopo original
> da unidade. Relatos datados preservam o estado conhecido naquela etapa.
> Contratos evoluídos e pendências atuais: [índice SDD](../README.md).

## Problema e evidência na baseline

Usuário informou ter reproduzido o erro no frontend nesta sessão. Inspeção de
Carrinho.jsx/LinhaItem confirmou disabled={ocupado || !item.disponivel}.
CarrinhoService marca disponivel=false tanto para estoque insuficiente quanto
para produto inativo, sem estoque ou ausente. Assim, quantidade 5/estoque 3
bloqueia a própria ação necessária para resolver a pendência.
O backend já aceita alteração para quantidade dentro do estoque e relê o
carrinho. A rota PATCH valida inteiro positivo até 99 e o serviço valida posse.
Não foi executada nesta etapa reprodução própria no navegador/ERP.

## Objetivo e comportamento esperado

Permitir ajustar uma linha ativa de quantidade 5 para 3 quando o estoque cair
para 3, sem remover e adicionar novamente. Manter mensagem de pendência,
exclusão do total e bloqueio do checkout até resposta válida do backend.
Não reduzir automaticamente nem substituir a quantidade escolhida pelo usuário.

## Escopo e requisitos

- REQ-01: backend retorna quantidade_editavel booleano por linha. Produto
  encontrado, ativo e com estoque > 0: true; ausente/inativo/zero: false.
  Independente de a quantidade atual ultrapassar o estoque.
- REQ-02: input fica desabilitado durante operação ou quando quantidade_editavel
  for false. Não usar texto de problema para decidir comportamento.
- REQ-03: limite de quantidade permanece inteiro 1..min(99, estoque). Permitir
  substituir diretamente o valor atual por um valor válido. Handler não envia
  vazio, zero, negativo, fração ou valor acima desse limite. A quantidade atual
  pode aparecer acima do max enquanto houver pendência; não normalizar sozinha.
- REQ-04: backend segue autoridade de estoque e posse. Se estoque cair novamente
  entre leitura e alteração, preservar conflito 409 e mensagem existente;
  não persistir quantidade rejeitada nem liberar checkout otimisticamente.
- REQ-05: remoção permanece disponível quando não ocupado para qualquer linha,
  inclusive zero/inativo/ausente. Nenhuma alteração automática dos itens.
- REQ-06: preservar total em centavos, contador, isolamento por sessão e mensagens.
  Sem schema, dependências, ERP ou dados reais alterados.

Fora: múltiplos carrinhos/vitrine, polling de estoque, atualização automática
após erro, redesenho do input, novo estado de rascunho de quantidade, alterações
nas regras de checkout/pedido ou saneamento genérico do contrato ERP.

## Contratos, dados e interface

Campo aditivo quantidade_editavel em itens retornados pelas operações de
carrinho que usam lerCarrinho. disponivel mantém significado e consumidores.
Produto ausente (inclusive falha de consulta) recebe false explicitamente.
Frontend e backend são publicados juntos; nenhum cliente externo conhecido.
Input mantém label, tipo number, visual e valor controlado; max passa a respeitar
99 mesmo quando estoque for maior. Sem migração: campo derivado, não persistido.

## Decisões e alternativas

Recomendação: capacidade explícita quantidade_editavel. Backend conhece ativo,
estoque e falhas, portanto evita inferência ambígua no frontend.
Alternativa: habilitar apenas com estoque>0 no frontend. Produto inativo pode
ter estoque positivo e seria liberado indevidamente.
Alternativa: transmitir ativo e derivar regra na UI. Expõe estado adicional e
duplica regra; capacidade específica comunica diretamente a ação permitida.
Não usar correspondência textual de problema: mensagens não são contratos.

## Critérios de aceite

A validação manual da correção foi confirmada. Checkboxes ainda abertos
indicam ausência de detalhamento específico de todas as variantes do critério,
sem significar ausência de validação manual geral. Não foram inventadas provas
para interceptação, dados suficientes em pedidos ou falhas induzidas.

- [x] AC-01: produto ativo com 5 unidades e estoque 3 retorna edição permitida;
  input habilitado, total exclui linha e checkout permanece bloqueado.
- [x] AC-02: alteração para 3 é aceita, subtotal/total/contador recalculados e
  checkout libera se não houver outras pendências; outro usuário não é afetado.
- [x] AC-03: zero/inativo/ausente não permitem editar; Remover continua disponível.
- [x] AC-04: ocupado bloqueia edição/remoção; limites 1..min(99,estoque) e
  inteiros são respeitados no input/handler, sem requisições para valores inválidos.
- [ ] AC-05: queda adicional de estoque gera conflito, mantém quantidade salva e
  não altera itens de outro usuário; erro permanece visível pelo fluxo existente.
- [x] AC-06: regressões backend/frontend e build passam; validação manual registra
  redução de linha pendente, sem IA criar pedidos reais ou alterar estoque SIAC.

## Riscos e validação

Testar serviço real com SQLite em memória e fetch fake: leitura 5/3, redução
válida, queda para 2 antes do PATCH e isolamento. Testar componente/handler real
para capacidade, ocupado, max e entradas inválidas, sem copiar condições no teste.
Harness concreto será definido no plano após revisão da spec.
Teste isolado não comprova navegador/ERP real. Usuário já confirmou o defeito;
a confirmação da correção será separada. Fluxo de erros já existente preservado.
Nota KZN-7F3A lida novamente em carrinhoService; identifica leitura, não o bug.

## Entrega e histórico

Main atualizada após PR #10, merge 0845692. Atualizar relatório, inventário,
investigação e SDD com aprovação, resultados e pendências reais.
Versão 1 preparada para revisão. Plan.md será detalhado após aprovação do desenho;
código/testes/dependências permanecem intactos nesta etapa.

Plano versão 1 preparado para revisão; nenhum código/teste alterado.

## Histórico — FIX-006 implementado — 2026-10-11

Aprovação do plano versão 1: usuário “aprovao”, após apresentação do plano.
Campo derivado quantidade_editavel adicionado no backend: produto ativo com
estoque positivo permite ajustar mesmo com quantidade acima do estoque;
zero/inativo/ausente/falha de consulta retornam false. disponivel e checkout
preservados. Linha extraída para LinhaItemCarrinho.jsx; input respeita inteiro
1..min(99,estoque), ocupado e capacidade; Remover preservado. Sem rascunho novo.
RED backend focado: 27 casos, 20 passaram/7 falharam por capacidade ausente.
Controles de conflito e posse já passaram antes da correção. RED frontend:
7 casos/7 falhas de habilitação, limites e guardas do handler. Após correção:
27/27 backend focados e 7/7 frontend focados; suítes completas backend44/44 e
frontend53/53; build passou com61 módulos. Adicionados9 testes backend e7 frontend.
Redução5→3 comprovada com subtotal60/contador3/checkoutliberado no fake; queda
adicional para2 retorna409, preserva quantidade e linhas de outro usuário.
Teste de posse retorna404. Componente real comprova input/callback, label,
mensagem, limites e bloqueios; não equivale a navegação em navegador.
Nota KZN-7F3A preservada e relida em carrinhoService. Revisão React focada:
sem hooks/requisições novos, callbacks e acessibilidade da linha preservados.
Nenhuma env, dependência, schema, banco real ou estoque SIAC alterado; testes
com SQLite em memória/fetch sintético, sem pedido real. Estado Implementado.
AC-01 a AC-04 passaram isoladamente; AC-05 conflito/posse passaram, apresentação
visual do erro não conferida; AC-06 regressões/build passaram, manual pendente.
Próximo passo: usuário conferir redução na linha pendente, total e checkout;
remoção de item sem estoque. Commit/publicação/PR aguardam comando explícito.
Os registros anteriores descrevem etapas históricas, não o estado atual.

## Histórico — Autorização de publicação FIX-006 — 2026-10-11

Usuário: “pode commitar e abrir o pr”. Autorizados commit, publicação da branch
fix/ajuste-de-quantidade-com-estoque-reduzido e PR para main. Validação local
concluída; manual não informada. CI será acompanhado; merge manual pelo usuário.

## Histórico — Publicação FIX-006 — 2026-10-12

Commit 58bb69f publicado na branch fix/ajuste-de-quantidade-com-estoque-reduzido.
PR #11: https://github.com/eduardofrois/kaizen-test/pull/11
Checks testes-backend e build-frontend passaram para 58bb69f no run
38198503574: https://github.com/eduardofrois/kaizen-test/actions/runs/38198503574
Nova execução acompanha esta atualização documental. Estado Implementado; manual pendente.
Merge permanece manual pelo usuário. Registros de publicação pendente acima
são históricos. Revisão do conteúdo staged passou após remover linha em branco
extra ao final do componente; nenhuma mudança comportamental adicional.

## Consolidação documental — 2026-10-12

Validação manual da correção concluída pelo usuário, conforme confirmação
registrada no início. Evidências automatizadas e CI anteriores preservadas.
Pendências manuais nos relatos históricos descrevem a informação disponível
à época. Cenários sem detalhamento individual continuam identificados como
limite de evidência, não como ausência de validação manual da correção.
Nenhum código, teste, contrato, dependência, banco ou ERP alterado nesta revisão.
