# Spec — Contador do carrinho

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Baseline/data:** b8f6abf; 2026-10-11
**Origem:** KZN-318 — Número no ícone do carrinho está errado
**Branch:** fix/contador-do-carrinho
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11; mensagem do usuário: “aprovado os documentos”.


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

Em backend/src/services/carrinhoService.js, lerCarrinho preenche tanto
quantidade_itens quanto quantidade_pecas com itens.length. Duas linhas com
quantidades 3 e 4 retornam contador 2, embora representem 7 peças.
Cabecalho.jsx e paginas/Carrinho.jsx já exibem quantidade_pecas; CarrinhoContext
utiliza a resposta do servidor após leitura, adição, alteração e remoção.

Inspeção estática confirmou a causa e os consumidores. O usuário informou
em 2026-10-11: “ja recriei o erro aqui”. Reprodução manual informada pelo
usuário; não houve nova execução automatizada nesta preparação.

## Objetivo e comportamento esperado

quantidade_pecas representa a soma de todas as quantidades mantidas no
carrinho do usuário. quantidade_itens continua representando produtos distintos.
Exemplo: A × 3 + B × 4 → quantidade_itens=2 e quantidade_pecas=7.
Carrinho vazio retorna ambos zero. Uma linha com 5 unidades retorna 1 e 5.

## Escopo

Incluído: corrigir a agregação em lerCarrinho, regressões do serviço real,
validação manual dos consumidores existentes e atualização documental.
Fora: FIX-003 (dinheiro), FIX-005 (troca de conta), KZN-325, KZN-331,
múltiplos carrinhos, redesign e novas dependências.

## Requisitos e invariantes

- REQ-01: somar item.quantidade com acumulador iniciado em zero.
- REQ-02: quantidade_itens permanece itens.length; manter nomes e tipos numéricos.
- REQ-03: incluir linhas indisponíveis, pois permanecem no carrinho com suas
  quantidades; não confundir contagem física solicitada com elegibilidade de compra.
- REQ-04: preservar total filtrado do KZN-312, subtotais, disponibilidade e
  bloqueio de checkout. Não alterar quantidades persistidas na leitura.
- REQ-05: contagem considera apenas o usuário consultado. Preservar posse,
  limites de 50 produtos/99 por linha, erros, rotas e nota KZN-7F3A.
- REQ-06: manter apresentação existente: cabeçalho mostra 99+ acima de 99,
  aria-label e resumo preservam a contagem exata; vazio oculta o badge.
- REQ-07: testes com schema SQLite real em memória, ERP simulado e ambiente
  sintético isolado; sem leitura de .env, banco local ou escrita no SIAC.

## Contratos, dados e interface

Mesmo objeto de lerCarrinho(usuarioId, db): itens, quantidade_itens,
quantidade_pecas, valor_total e pronto_para_checkout. Mudança semântica corrige
quantidade_pecas; não adiciona campo nem rota. Operações que retornam lerCarrinho
herdam o cálculo. Sem schema/migração e sem alteração prevista no frontend.

## Decisões e alternativas

Escolha aprovada: centralizar a soma no serviço, fonte comum para leitura e mutações.
Somar no cabeçalho e no resumo duplicaria regra e deixaria a API incorreta.
Contar só disponíveis faria peças ainda presentes desaparecerem do contador;
a proposta mantém a distinção entre conteúdo e total elegível para compra.
Escolhas aprovadas com a versão 1 em 2026-10-11.

## Critérios de aceite

- [x] AC-01: linhas 3+4 retornam 7 peças e 2 itens; uma linha ×5 retorna 5 e 1.
- [x] AC-02: vazio retorna 0/0; soma acima de 99 continua exata na API.
- [x] AC-03: linha indisponível entra no contador, mas não no total; checkout bloqueado.
- [x] AC-04: dados de outro usuário não entram na contagem; leitura não muda persistência.
- [x] AC-05: cabeçalho e resumo acompanham adição, alteração, remoção e F5;
  cabeçalho mantém 99+ e aria-label exato quando aplicável.
- [x] AC-06: suíte backend e build passam; registrar resultados reais e manter
  FIX-003/FIX-005 pendentes. Checks remotos somente após PR autorizado.

## Riscos e estratégia de validação

Frontend continua sujeito ao FIX-005: validar em uma mesma sessão, sem atribuir
à contagem a correção da troca de conta. Caso acima de 99 será provado com
dados sintéticos; não é necessário montar grande carrinho no ERP real.
Regressões verificam serviço real, isolamento e invariantes do KZN-312.
Validação manual não cria pedido: manipular carrinho, observar badge/resumo,
recarregar e conferir persistência. Não alterar estoque para criar pendências.

## Entrega e histórico

Atualizar fix.md, RELATORIO.md, docs/investigacao.md e estes documentos conforme
resultados. Versão 1 preparada por solicitação “pode criar os documentos”.
Aprovação, testes locais, confirmação manual e CI da implementação registrados.

## Histórico — Execução aprovada — 2026-10-11

Versão 1 aprovada pela mensagem “aprovado os documentos”. Implementação
limitada à soma de item.quantidade em quantidade_pecas. quantidade_itens,
total filtrado do KZN-312, nota KZN-7F3A e checkout preservados.
Seis regressões acrescentadas ao harness isolado existente, sem dependências.

RED: node --test tests/carrinho-total.test.js antes da correção — 17 testes,
12 passaram e cinco falharam no contador; exemplo 3+4 retornou 2 em vez de 7.
GREEN: npm test após a correção — 23 testes passaram (17 de carrinho e seis
configuração). SQLite em memória, fetch simulado e subprocesso com ambiente
sintético; sem .env, banco local ou ERP real. Snapshots preservados e zero POST.
node --check backend/src/services/carrinhoService.js e build frontend passaram;
build transformou 58 módulos. Inspeção confirmou badge 99+, aria-label exato
e resumo consumindo quantidade_pecas. Isso não substitui validação visual.

Estado Implementado: validação automatizada local concluída; roteiro manual
7→5→3→0 e persistência após F5 aguardam confirmação do usuário.
PR não aberto; checks remotos não executados. FIX-003/FIX-005 não corrigidos.
Também atendida a solicitação de usar “usuário” nas referências documentais.

## Histórico — Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “validado, pode subir o pr” após o roteiro de validação
local. Validação manual pós-correção confirmada pelo usuário; não executada
pela IA. Publicação da branch e abertura de PR autorizadas nesta mensagem.
Testes locais: 23 passaram; build passou. Checks remotos ainda pendentes.
Merge permanece manual pelo usuário. Pendências manuais descritas anteriormente
são registros históricos superados por esta confirmação.

## Histórico — Validação remota de KZN-318 — 2026-10-11

PR #5: https://github.com/eduardofrois/kaizen-test/pull/5
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38177680580
Checks testes-backend e build-frontend passaram no commit ea3bc6a.
Estado Validado: critérios da versão 1 concluídos com regressões isoladas,
build local, confirmação manual do usuário e CI do PR. Merge manual pendente.
Registros anteriores de espera por validação/abertura/CI são históricos.
FIX-003 e FIX-005 continuam fora do escopo; nenhum merge ou deploy realizado.
