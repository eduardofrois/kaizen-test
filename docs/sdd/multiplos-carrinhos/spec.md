# Spec — Múltiplos carrinhos e edição na vitrine

**Versão:** 2
**Estado:** Revisão v2 implementada com TDD e validada em testes/navegador simulado; quatro achados corrigidos. Publicada no PR #17, aberto para avaliação e merge manual; validação manual da v1 confirmada pelo usuário.
**Aprovação da revisão v2:** 2026-10-13; usuário “aprovado” em resposta à apresentação dos links da spec/plano v2 e à pergunta “Aprova implementar essa versão?”. Escopo: REV-01 a REV-04 com TDD, regressões e ensaio simulado; sem publicação.
**Autorização de publicação:** 2026-10-13; usuário “agora eu preciso que abra um pr detalhado sobre a nova feature e me mande o link para eu avaliar”. Autoriza commit/push da feature e abertura do PR em eduardofrois/kaizen-test; merge manual pelo usuário. Revisão documental geral anterior permanece fora do envio.
**Baseline/data:** `f95ae66`; 2026-10-13, America/Sao_Paulo. Checkout com alterações documentais locais anteriores, preservadas.
**Origem:** MULTI-001 — requisito obrigatório de múltiplos carrinhos no README; riscos relacionados INV-001/INV-002.
**Nome da pasta/branch de implementação:** `multiplos-carrinhos` / `feat/multiplos-carrinhos`.
**Branch desta preparação:** `docs/revisao-da-documentacao-de-entrega`; nenhuma branch nova criada nesta etapa.
**Aprovação das decisões de produto:** 2026-10-13, respostas Q1–Q8 e mensagem final “confirmado”, nesta conversa, após o resumo das regras, incluindo promoção ao excluir o principal.
**Aprovação histórica da spec v1:** 2026-10-13; usuário “aprovado”, em resposta à apresentação da spec v1 e ao pedido de aprovação para preparar o plano. Inclui os detalhes técnicos da versão 1.
**Aprovação histórica para implementar v1:** 2026-10-13; usuário “aprovado” após apresentação do plano v1 e pergunta explícita sobre implementar nesta sessão. Escopo: spec v1 e plano v1; publicação não incluída. O [plano atual](plan.md) incorpora a revisão v2 aprovada separadamente acima.

## Problema e evidência

Oficinas precisam separar listas de peças de veículos/clientes e consultar o
conteúdo sem abandonar a busca na vitrine. Hoje há um único carrinho por conta.

Inspeção estática nesta etapa:

- `backend/src/db/schema.sql`: `carrinho_itens` vincula itens diretamente ao
  usuário, com unicidade por `(usuario_id, codigo_produto)`; não existe entidade
  de carrinho ou preferência de principal.
- `backend/src/services/carrinhoService.js`: leitura e mutações filtram por
  usuário; `limparCarrinho()` remove todas as linhas dele.
- `backend/src/services/pedidoService.js`: lê o carrinho, aguarda o POST ao
  ERP e depois grava o vínculo e limpa os itens. Não há bloqueio persistente
  ou identidade de tentativa. Duas requisições podem disputar esse intervalo.
- `backend/src/erp/cliente.js`: traduz falhas, mas não demonstra suporte do
  SIAC a idempotência ou consulta por referência da loja. Resposta HTTP de
  sucesso sem JSON utilizável pode retornar `null` para `criarPedido()`.
- `frontend/src/lib/carrinhoPorSessao.js` e `CarrinhoContext.jsx`: isolamento
  por ciclo autenticado já existe; ainda não distingue seleção de carrinho
  nem ordena respostas concorrentes dentro da mesma seleção.
- `Catalogo.jsx`, `Produto.jsx` e `api/cliente.js`: adicionam sem ID de
  carrinho. `Checkout.jsx` envia endereço e observação, sem identificar o
  conteúdo exibido. O catálogo mantém busca/filtros/página na URL.

Essas são evidências de leitura, sem reprodução nova, teste, build ou pedido.
A simulação anterior de duplicidade está em `fix.md`, INV-001; não foi
reexecutada. Nenhum dado local, ambiente ou serviço ERP foi alterado.

## Objetivo e comportamento esperado

Permitir manter até dez carrinhos nomeados por cliente, escolher o destino de
cada adição e editar o ativo na vitrine. A navegação do catálogo permanece no
mesmo ponto. O checkout fecha somente o carrinho apresentado ao confirmar,
sem misturar itens ou apagar alterações de outros carrinhos.

## Escopo

**Incluído:** entidade e migração de carrinhos; criar, listar, renomear,
selecionar, definir principal, excluir e esvaziar; operações explícitas por
ID; painel na vitrine e escolha de destino também no detalhe do produto;
integração com cabeçalho, página de carrinho e checkout; bloqueio persistente
e tratamento de envio incerto necessários às decisões Q8; testes isolados e
validação manual/visual da feature.

**Fora desta unidade:** alterar SIAC, reservar estoque, congelar preços,
pagamento/frete, compartilhar carrinhos entre contas, copiar/mover listas em
lote, exportar orçamento, sincronizar seleção entre abas, corrigir INV-003 a
INV-005, garantir transação distribuída ou criar painel administrativo de
reconciliação. A operação de suporte em casos incertos será documentada.

## Requisitos e invariantes

- **REQ-01 — Posse:** todo carrinho pertence a uma conta autenticada. Leituras,
  itens, principal, exclusão, estado de checkout e tentativas validam posse no
  backend; ID alheio ou inexistente retorna 404. `usuario_id` do navegador não
  determina o proprietário. Visitantes não consultam API privada.
- **REQ-02 — Capacidade:** entre um e dez carrinhos por conta, incluindo vazios.
  Criação concorrente não pode ultrapassar dez. Preservar até 50 produtos
  distintos e 99 unidades por produto em cada carrinho.
- **REQ-03 — Nome:** criar e renomear. Proposta de detalhe: texto obrigatório
  com 1–60 caracteres após trim; nomes iguais permitidos, pois ID identifica
  o carrinho. Nome é exibido como texto, nunca HTML. Novo carrinho nasce vazio
  e torna-se ativo somente na aba que o criou; principal permanece o mesmo.
- **REQ-04 — Principal:** exatamente um por conta, persistido no servidor.
  Primeiro carrinho é “Meu carrinho”, principal. Definir outro principal é
  atômico, sem mudar itens ou seleção corrente de outras abas.
- **REQ-05 — Ativo:** seleção local à aba e ao ciclo autenticado. No início
  de um ciclo/carregamento completo da aplicação, selecionar o principal;
  navegar entre telas mantém o ativo. F5 inicia seleção pelo principal.
  Trocar ativo não muda principal nem busca/filtros/página/rolagem da vitrine.
  Alterar o principal na mesma aba também não troca o ativo automaticamente.
- **REQ-06 — Adição:** ação direta “Adicionar ao [nome do ativo]”, acompanhada
  de escolha de outro destino. Escolher outro o torna ativo antes de adicionar.
  Mostrar nome do destino e sucesso/falha. Se a adição falhar, a seleção feita
  permanece. Cancelar a escolha não adiciona nem troca carrinho.
- **REQ-07 — Isolamento assíncrono:** operações capturam conta, ciclo, ID e
  geração de seleção de origem. Resultado tardio não pode substituir outro
  carrinho, mostrar sucesso no destino errado ou navegar na sessão seguinte.
  A→B→A também invalida respostas do primeiro A. Dentro do mesmo carrinho,
  respostas antigas não podem sobrescrever representação mais recente.
- **REQ-08 — Exclusão:** carrinho com itens exige confirmação; vazio pode ser
  excluído diretamente. Se ativo for excluído, selecionar o restante mais
  antigo por `criado_em`, desempate `id`. Se principal for excluído, promover
  o mais antigo restante. Essas regras são independentes: excluir só o
  principal não muda outro ativo válido. Excluir o último cria atomicamente
  “Meu carrinho” vazio e principal. Cancelar não modifica nada.
- **REQ-09 — Mudanças externas:** ao retomar foco e antes de mutações/checkout,
  revalidar carrinho e metadados. Se outra aba excluiu o ativo, informar e
  selecionar o mais antigo restante. Atualizações externas não mudam um ativo
  válido apenas porque outra aba escolheu outro ou alterou o principal.
- **REQ-10 — Vitrine:** visualizar itens, pendências, quantidades, total,
  selecionar/criar/renomear/excluir/definir principal e alterar/remover itens
  sem navegar para `/carrinho`. O contador representa unidades do ativo,
  incluindo pendentes; o total inclui somente linhas disponíveis.
- **REQ-11 — Acessibilidade e layout:** painel lateral recolhível no desktop;
  no celular, botão fixo com unidades/total abre painel sobre a vitrine.
  Abrir/fechar não adiciona item, não navega nem perde rolagem. Ações têm nome,
  foco visível e acesso por teclado; sobreposição mantém foco dentro, fecha
  por Escape e devolve foco ao acionador. A barra não cobre paginação/ações.
- **REQ-12 — Checkout explícito:** enviar ID e versão do carrinho mostrado,
  endereço selecionado e identidade da tentativa. Backend valida posse,
  versão, endereço, conteúdo, preço/estoque ERP e pendências. Mudança de ativo
  enquanto prepara o formulário atualiza nome/resumo antes de confirmar;
  depois do envio, a tentativa permanece vinculada ao carrinho capturado.
- **REQ-13 — Bloqueio:** antes de qualquer chamada de criação de pedido no
  ERP, registrar tentativa e obter bloqueio persistente exclusivo daquele
  carrinho. Bloquear itens, esvaziamento, renomeação e exclusão enquanto envia
  ou exige verificação. Outras abas/clientes HTTP obedecem ao backend;
  carrinhos diferentes continuam utilizáveis. Mutações iniciadas antes do
  bloqueio devem revalidá-lo na gravação, inclusive após consultas ao ERP.
- **REQ-14 — Repetição:** mesma identidade de tentativa com mesmo conteúdo
  não inicia outro POST ERP, inclusive após reinício da loja. Reutilização
  incompatível é conflito. Tentativa diferente no mesmo carrinho bloqueado
  também é conflito. Botão desabilitado é apenas complemento visual.
- **REQ-15 — Resultado:** sucesso confirmado e vínculo local salvo esvaziam
  apenas o carrinho enviado, mantendo ID, nome e principal. Limpeza, vínculo
  e conclusão da tentativa são atômicos. Falha confirmada antes do envio ou
  recusa conclusiva do ERP preservam itens e liberam edição. Falha de
  transporte/5xx, resposta de sucesso inválida ou falha após possível criação
  preservam conteúdo/bloqueio e mostram “Pedido em verificação”. Sem reenvio
  automático, botão de tentar novamente ou liberação por prazo nesses casos.
- **REQ-16 — Recuperação:** bloqueio sobrevive a F5/reinício. Tentativa
  interrompida sem conclusão é tratada conservadoramente como incerta;
  passagem de tempo não prova ausência de pedido. Só desbloquear após
  evidência de não criação, ou reconciliar o pedido comprovado sem novo POST.
- **REQ-17 — Migração:** preservar contas, endereços, quantidades, códigos,
  datas dos itens e vínculos históricos. Cada conta existente recebe um
  “Meu carrinho” principal com seus itens, inclusive contas sem itens.
  Migração transacional e reexecutável sem duplicação, sem reset.
- **REQ-18 — Fronteiras:** JavaScript ESM, nomes em português, camadas atuais,
  `ApiError`, `ColetorDeErros` e envelope preservados. Dinheiro em centavos;
  somente códigos/quantidades persistidos como conteúdo dos carrinhos.
  Preço/estoque são do ERP, sem reserva. Respeitar `docs/ai/boundaries.md`.

## Contratos, dados e interface

### Dados propostos para revisão

- `carrinhos`: ID, proprietário, nome, principal, versão e datas. Unicidade
  de principal por proprietário e transações garantem substituição/criação;
  a versão aumenta nas alterações relevantes do carrinho.
- `carrinho_itens`: referência ao carrinho substitui propriedade direta por
  usuário; unicidade em `(carrinho_id, codigo_produto)`, preservando código,
  quantidade, ID e data. Posse é obtida pela entidade pai.
- `checkout_tentativas`: metadados mínimos de operação — identidade,
  proprietário, carrinho de origem, versão, resumo verificável da requisição,
  estado, datas e número ERP quando conhecido. Não copiar catálogo, preços,
  estoque ou pedido completo. Preservar deduplicação após excluir um carrinho
  já comprado; uma exclusão não deve permitir reutilizar a tentativa.
- `pedidos_usuario`: preservar todos os vínculos e snapshots existentes;
  eventual referência de origem deve permitir exclusão posterior do carrinho
  sem apagar o histórico. O snapshot de endereço continua imutável.

### API proposta para revisão

Todas as rotas abaixo exigem sessão e posse. Sucesso usa `{ dados: ... }`;
erros mantêm `{ erro: { codigo, mensagem, detalhes? }, request_id }`.

| Método/rota sob `/api` | Entrada | Saída/comportamento |
|---|---|---|
| GET `/carrinhos` | Sem parâmetros obrigatórios | Metadados próprios ordenados por antiguidade, `principal_id`; sem enriquecer todos os itens no ERP |
| POST `/carrinhos` | `nome` | 201, metadados do vazio criado |
| PATCH `/carrinhos/:id` | `nome` | 200, metadados atualizados |
| PUT `/carrinhos/:id/principal` | Sem preço ou proprietário | 200, lista/metadados com principal atualizado |
| DELETE `/carrinhos/:id` | `confirmar_com_itens`, booleano quando necessário | 200, lista atualizada e `substituto_id` quando aplicável |
| GET `/carrinhos/:id` | ID explícito | Carrinho enriquecido, ID, nome, principal, versão e estado de checkout |
| POST `/carrinhos/:id/itens` | `codigo_produto`, `quantidade` | 201, representação atualizada desse carrinho |
| PATCH `/carrinhos/:id/itens/:codigo` | `quantidade` | 200, representação atualizada |
| DELETE `/carrinhos/:id/itens/:codigo` | Código explícito | 200, representação atualizada |
| DELETE `/carrinhos/:id/itens` | Sem identificação implícita | 200, mesmo carrinho vazio |
| GET `/carrinhos/:id/checkout` | ID explícito | Estado da tentativa vigente ou mais recente, número ERP quando conhecido; referência não comprova conclusão; sem dados de outra conta |
| POST `/pedidos` | `carrinho_id`, `versao_carrinho`, `tentativa_id`, `endereco_id`, `observacao` | 201 na criação confirmada; 200 na repetição já concluída; conflitos/estado incerto sem novo envio |

Não existe endpoint para persistir “ativo”: é estado da aba. Nome/IDs são
capturados antes de operações assíncronas. Respostas identificam o carrinho
de origem; detalhes de checkout não tornam uma tentativa uma credencial.

Proposta de erros: 409 `LIMITE_DE_CARRINHOS`, `CARRINHO_EM_CHECKOUT`,
`CARRINHO_ALTERADO`, `CONFIRMACAO_NECESSARIA`, `TENTATIVA_INCOMPATIVEL`;
502 `CHECKOUT_INCERTO` para envio sem conclusão confiável. Estado persistido
fica disponível pela leitura mesmo se a resposta original se perder.
Falhas conclusivas mantêm códigos de negócio/validação já existentes.

Frontend e backend devem atualizar juntos. Rotas antigas de carrinho sem ID
não devem escolher silenciosamente o principal: proposta é responder 409
`CARRINHO_OBRIGATORIO`, orientando recarga, sem mutação ou chamada ERP. POST
de pedido sem os novos campos retorna 422. Testes e consumidores internos
devem migrar; manter telas `/carrinho`, `/checkout` e `/produto/:codigo`.

### Interface proposta para revisão visual

O painel usa os mesmos dados e ações da página de carrinho, evitando cópias
divergentes. Cabeçalho identifica ativo e principal separadamente. Escolha de
destino está disponível no card e no detalhe, sem confundir com “principal”.
O nome longo pode quebrar linha ou truncar visualmente com nome completo
acessível; IDs de campos de quantidade devem ser únicos por instância.

Em larguras a partir de 1024px, propor coluna lateral com aproximadamente
320px e grade que se adapte ao espaço restante; abaixo disso, usar painel
sobreposto com botão fixo. Dimensões, grade e estado inicial recolhido/aberto
serão conferidos em protótipo, antes de consolidar layout. Não reaproveitar
quatro colunas espremidas após reservar espaço lateral.

Estados explícitos: carregando, vazio, erro com recarga, item pendente,
mutação em andamento, limite atingido, envio em andamento e pedido em
verificação. Falha de leitura não é carrinho vazio e não habilita checkout.
Carrinho bloqueado continua consultável e identifica o motivo do bloqueio.

### Recuperação de checkout incerto

Persistir a intenção antes de enviar e o número ERP assim que disponível,
sem transação SQLite aberta durante HTTP. O ponto de falha entre a aceitação
remota e uma gravação local continua possível; a resposta é conservar o
bloqueio e pedir verificação, nunca afirmar atomicidade entre sistemas.

O roteiro operacional deve orientar suporte a conferir evidência no SIAC.
Com número conhecido e pedido confirmado, concluir vínculo/limpeza local de
forma transacional e sem reenviar; se comprovado que não houve pedido,
registrar a decisão e liberar. Sem número e sem consulta confiável por
referência, manter pendência até confirmação do responsável pelo ERP.
Não criar endpoint público de desbloqueio, reset por tempo ou reenvio cego.
Qualquer intervenção em dados reais depende de autorização específica.

## Decisões e alternativas

| Decisão | Escolha confirmada | Motivo |
|---|---|---|
| Quantidade | Até 10, incluindo vazios | Atende orçamentos paralelos e limita lista/custo |
| Exclusão ativa/última | Mais antigo; último gera padrão vazio | Sempre existe destino válido para peças |
| Exclusão do principal | Promove o mais antigo restante | Mantém padrão determinístico para próxima entrada |
| Entrada | Principal, em vez do último ativo global | Padrão explícito sem uma aba mudar a outra |
| Adição | Direta ao ativo, com escolha opcional | Um clique no fluxo comum; escolha por produto continua disponível |
| Escolha alternativa | Torna destino ativo | Nome, resumo, adições e checkout ficam coerentes |
| Desktop/celular | Painel lateral/painel sobreposto | Editar sem abandonar busca, preservando espaço em tela pequena |
| Após compra | Mantém ID/nome, esvazia comprado | Reutiliza organização e preserva demais orçamentos |
| Checkout concorrente | Bloqueio por carrinho e verificação de incerteza | Evita alteração durante envio e duplicidade por repetição cega |

Alternativas técnicas consideradas nesta proposta:

1. **Entidade local, IDs explícitos e bloqueio persistente (recomendado):**
   aproveita SQLite e camadas existentes; precisa migração e estado de
   tentativas, mas permite proteção entre abas e reinícios.
2. **Seleção global no servidor e rotas implícitas:** menos parâmetros, porém
   uma aba poderia mudar o destino de outra. Incompatível com Q6/Q7.
3. **Listas somente no navegador e bloqueio em memória:** implementação menor,
   mas perde persistência entre dispositivos e não protege reinícios ou
   requisições concorrentes. Incompatível com o domínio e Q8.

Os detalhes de nome, F5, contratos, versão e persistência de tentativas foram
apresentados explicitamente na spec v1 e aprovados na revisão escrita. Sua
aprovação não foi inferida das respostas da entrevista.

## Critérios de aceite

- [x] **AC-01 — Migração:** banco legado sintético com duas contas, itens,
  endereço e vínculo de pedido mantém os mesmos dados; cada conta recebe
  principal; segunda aplicação não duplica; falha simulada reverte tudo.
- [x] **AC-02 — Gestão:** criar até dez, renomear, definir principal e listar;
  11º e criação concorrente no limite rejeitados sem perda; nomes inválidos
  retornam erro de campo; visitante 401 e IDs alheios 404.
- [x] **AC-03 — Itens isolados:** mesma peça em A/B admite quantidades
  independentes; alterar/remover/esvaziar A preserva B e outra conta; limites
  50/99 por carrinho, estoque, total e contador permanecem corretos.
- [x] **AC-04 — Exclusão:** confirmação/cancelamento com itens, remoção de
  vazio, ativo, principal, ambos e último obedecem às regras; desempate
  determinístico; exclusões simultâneas preservam principal e carrinho mínimo.
- [x] **AC-05 — Seleção e adição:** entrar/F5 escolhem principal; navegação
  mantém ativo; escolha alternativa altera destino explícito e ativo;
  cancelar não adiciona; duas abas mantêm seleções independentes.
- [x] **AC-06 — Respostas tardias:** A→B→A, troca de conta, erro/sucesso
  tardios e respostas fora de ordem da mesma seleção não substituem estado
  atual nem mostram mensagem/navegação de operação antiga.
- [x] **AC-07 — Vitrine:** editar/trocar no painel preserva URL, parâmetros,
  resultados e posição de rolagem; contador/total correspondem ao ativo;
  falha da API é visível e recarga recupera sem alterar busca.
- [x] **AC-08 — Visual/acessível:** protótipo e navegador em 320, 375, 390,
  768, 1024 e 1280px sem overflow de página; nomes longos e dez carrinhos
  utilizáveis; teclado, Escape, foco devolvido e barra sem cobrir ações.
- [x] **AC-09 — Compra:** pedido simulado envia só itens do ID/versionado
  confirmado e endereço selecionado; sucesso mantém nome/ID e esvazia só
  esse carrinho; pendências/versão desatualizada não criam pedido.
- [x] **AC-10 — Concorrência:** ERP fake retido durante checkout; mutações,
  exclusão e segundo checkout no mesmo carrinho são bloqueados na API;
  gravação de mutação iniciada antes do bloqueio também é recusada; outro
  carrinho continua editável; mesma tentativa não produz segundo POST.
- [x] **AC-11 — Recuperação:** timeout/5xx/sucesso sem número, resposta perdida,
  reinício e falha local após criação conservam bloqueio/itens e impedem
  reenvio. Recusa comprovada libera; replay confirmado retorna vínculo sem
  POST. Roteiro de reconciliação ensaiado apenas com dados sintéticos.
- [x] **AC-12 — Regressões e entrega:** suítes backend/frontend, build e diff
  passam; KZN-312/318/325/331 e FIX-005/006 preservados; documentação registra
  provas observadas e limitações, sem afirmar deploy ou homologação ERP.

## Riscos e casos de borda

Migração exige mecanismo próprio: `CREATE TABLE IF NOT EXISTS` não converte
a tabela legada. Uma transação deve preservar dados e impedir estado parcial;
backup consistente precede migração real. Reversão de código antigo após
gravações no modelo novo pode perder dados se tratada como simples rollback.

O bloqueio deve viver no SQLite compartilhado pelos processos da loja, com
aquisição atômica, sem depender de mutex em memória. Não ampliar esta unidade
para banco distribuído; instâncias com bancos independentes não compartilham
essa garantia. Consultas ERP fora da transação exigem revalidação ao gravar.

Sem contrato demonstrado de idempotência remota, não prometer entrega exatamente
uma vez. Bloqueio conservador pode exigir suporte e deixar um dos dez carrinhos
temporariamente indisponível; os demais permanecem úteis. Leitura perdida no
navegador exige consultar estado, em vez de gerar nova identidade de tentativa.

Consultas ERP por item continuam existindo. Listar metadados de dez carrinhos
não deve disparar enriquecimento de todas as listas. Não introduzir cache
permanente de produtos como solução incidental.

## Estratégia de validação

Usar `node:test`, SQLite isolado e ERP fake. Verificar serviços e rotas reais
com duas contas sintéticas, IDs trocados, transações e promessas controladas.
Migração deve partir do schema legado, não de fixture já migrada. Concorrência
de bloqueio deve incluir conexões independentes ao mesmo arquivo temporário,
além de reinício com tentativa pendente.

Frontend: testes do controlador real para sessão/seleção e ordenação;
navegador para interação React, duas abas, painel, URL, rolagem e foco.
Verificar visualmente protótipo e interface final, registrando larguras,
estado autenticado, nomes longos e capturas sem dados pessoais. Se o protótipo
exigir mudança material de interação, revisar esta spec antes de implementar.

Executar `npm test` em backend e frontend, `npm run build` em frontend e
`git diff --check` após implementação autorizada. Evidência isolada não é
homologação do SIAC. Nenhuma suíte cria pedidos no ERP real.

## Entrega e atualização documental

Preparação: esta spec, índice SDD, `fix.md` e `docs/investigacao.md` registram
decisões e investigação. Plano v1 aprovado e executado nesta sessão. Em execução
autorizada, atualizar spec/plano e evidências; arquitetura/README/RELATORIO
serão alinhados ao comportamento efetivamente entregue, com autorização de
escopo documental. Preservar mudanças locais anteriores e gerados fora do Git.

Implementação em `feat/multiplos-carrinhos` após conferir baseline e aprovação.
Commit/push/PR dependem de comando específico; merge permanece manual pelo
usuário. Não há publicação/deploy nesta preparação.

## Revisão e histórico

- **2026-10-13 — Entrevista:** Q1 “10”; Q2/Q4 “recomendado”; Q3 propôs
  escolher destino e principal; Q5 “esvaziá-lo e manter o nome”.
- **2026-10-13 — Refinamento:** Q6 “sim”; Q7 “segunda opção”; Q8 “sim”.
- **2026-10-13 — Confirmação:** usuário “confirmado” após resumo, incluindo
  promoção do mais antigo ao excluir principal. Aprovação das decisões de
  produto, sem atribuir aprovação a documento que ainda não existia.
- **2026-10-13 — Versão 1:** evidências estáticas, contratos e critérios
  escritos em proposta. Plano, protótipo, implementação e verificações
  funcionais não executados. Revisão da spec escrita é a próxima ação.
- **2026-10-13 — Conferência documental:** 18 requisitos e 12 aceites com
  numeração contínua; links locais dos quatro documentos desta preparação,
  espaços finais e blocos Markdown conferidos por script transitório;
  `git diff --check` passou. Sem teste funcional/build. Autorrevisão separou
  decisões confirmadas das propostas técnicas e da aprovação para implementar.
- **2026-10-13 — Aprovação da spec v1:** usuário “aprovado” após apresentação
  do documento e pergunta “Você aprova a spec v1 para eu preparar o plano?”.
  Escopo: requisitos, contratos e direção técnica da spec v1; preparação do
  plano autorizada. Implementação e publicação não autorizadas nesta mensagem.
- **2026-10-13 — Plano v1 preparado:** seis tarefas e matriz dos 12 aceites
  em plan.md. Plano em revisão; aprovação para implementar pendente. Sem
  alteração de requisitos/contratos da spec v1 ou execução funcional nesta etapa.

## Evidências da implementação — 2026-10-13

Spec/plano v1 implementados em feat/multiplos-carrinhos, sem commit/publicação.
Aprovação: usuário “aprovado” após pergunta explícita sobre implementar o plano
nesta sessão. Alterações documentais locais anteriores preservadas.

- Banco: migração transacional/versionada, principal por conta e preservação
  de itens, endereços e pedidos; teste de falha reverte conversão.
- API: IDs explícitos, posse, limite dez, confirmação de exclusão e contrato
  legado recusado; testes HTTP reais e dois processos disputando criação/exclusão.
- Checkout: intenção persistida, índice exclusivo, checagem de versão,
  revalidação de mutações após await, replay e bloqueio de resultado incerto.
  Conexões independentes/reabertura e reconciliação sintética passaram.
- Frontend: ativo por aba, principal no boot, ações por destino, geração e
  ordenação de respostas, painel responsivo e componentes compartilhados.
- Navegador: criação/seleção, quantidade, principal/F5, compra fake limpando
  só origem, duas abas, dez nomes, erro incerto, seis larguras e foco/Escape.
  Detalhes e limites em validacao-visual.md; recuperação em recuperacao.md.
- Resultado final registrado: backend 114/114, frontend 81/81, build Vite
  67 módulos, sintaxe dos novos serviços/controlador e git diff --check passaram.
  Testes usando Node 24.14.1, SQLite isolado e ERP simulado.

Checkmarks indicam evidência combinada de testes isolados, inspeção e navegação
sintética, não homologação do SIAC ou confirmação manual do usuário. Cancelar
formulários foi conferido por inspeção de handlers sem mutação; rede/401/500
com recarga e respostas tardias têm testes do controlador, sem interceptação
visual de cada variante. Publicação/CI remoto/deploy não executados.

Roteiro manual do usuário: criar dois carrinhos, definir principal, adicionar
em cada um, trocar/editar/remover na vitrine com busca/página mantidas, conferir
F5 e versão mobile; excluir com cancelar/confirmar e testar último carrinho.
Não criar pedido no ERP real apenas para validar esta unidade. Para compra,
seguir ambiente simulado; a validação real do SIAC exige autorização própria.

## Revisão após confirmação manual — 2026-10-13

Usuário confirmou “Validei, não encontrei nada” e solicitou nova análise.
Confirmação manual registrada para o percurso realizado, sem inferir compra
no SIAC real. A [revisão](revisao.md) reproduziu quatro falhas: lista tardia,
regressão de versão por resposta de mutação, fila global à aba e perda de
número ERP conhecido em resposta parcial. AC-06/AC-11 reabertos; fila por
carrinho da T4 também pendente. Suítes reexecutadas: backend 114/114 e frontend
81/81. Não houve alteração de implementação/testes ou nova aprovação de
correção; revisões de spec/plano e autorização necessárias antes de corrigir.

## Revisão v2 — Correções dos quatro achados com TDD

**Origem:** pedido “arrume o que voce encontrou usando TDD”, em 2026-10-13,
após apresentação de REV-01 a REV-04. Baseline de trabalho: conteúdo local
revisado na branch `feat/multiplos-carrinhos`, incluindo a v1 não commitada;
não substituir esse conteúdo pelo HEAD `f95ae66`.

### Escopo e escolhas

Corrigir os quatro achados dentro da unidade existente, porque completam
REQ-07/16 e o isolamento de operações já previsto, sem introduzir nova feature.
O histórico da v1 acima permanece como evidência daquela execução; esta seção
define as mudanças da v2. Toda correção terá teste que primeiro falha por
comportamento observado e depois passa com mudança mínima.

Alternativas consideradas:

1. **Escolha proposta:** manter controlador/serviços atuais, adicionar guardas
   de lista/versão, fila por ID e transportar referência ERP no erro interno.
   Resolve as causas reproduzidas e preserva os consumidores existentes.
2. Recarregar tudo após cada resposta: faz mais consultas e ainda permite que
   uma resposta antiga altere seleção antes da recarga; não substitui guardas.
3. Trocar gerência de estado ou implementar reconciliação automática: amplia
   dependências e regras de recuperação; desnecessário para estes achados.

### Requisitos adicionais e contratos internos

- **REV-REQ-01 — Lista e seleção:** resultado/erro de listagem iniciada antes
  de trocar a seleção ou alterar a coleção local não substitui o estado novo.
  Criar/renomear/excluir/definir principal invalidam listas anteriores à gestão
  e à sua conclusão. Lista atual continua detectando exclusão real em outra aba.
  Boot, F5 e falha atual com possibilidade de recarga continuam funcionando.
- **REV-REQ-02 — Snapshot:** resposta de mutação só publica no ciclo/seleção/ID
  de origem; seu ID deve corresponder ao solicitado. Versão inferior à já
  publicada é descartada. Uma escrita não invalida leitura mais nova já aceita.
  Conclusão no servidor não muda de destino por trocar seleção no navegador.
- **REV-REQ-03 — Concorrência por carrinho:** fila e contagem de operações
  pendentes são vinculadas ao ID. `ocupado` representa operações do ativo mais
  gestão global de carrinhos. Campo adicional `gerindo` identifica essa gestão;
  o seletor usa `gerindo`, permitindo trocar durante alteração de itens.
  Operações no mesmo carrinho continuam em ordem; B pode enviar antes da
  resposta pendente de A. Ao voltar a A ainda pendente, seus controles continuam
  bloqueados. Conclusão de A não libera indevidamente B. Operações enfileiradas
  mas não enviadas são canceladas quando a origem já não é atual; enviados
  podem terminar no ID original. Logout invalida filas e callbacks da sessão.
- **REV-REQ-04 — Referência ERP:** resposta 2xx com número utilizável, mas total
  inválido, transporta `numeroErp` no `ApiError` interno. Número utilizável é
  string não vazia após trim ou número finito; conservar sua representação
  textual. Antes de marcar incerta, o serviço tenta persistir a referência
  usando `registrarNumeroErp`. Não salvar pedido/vínculo/total inválido, limpar
  itens, liberar bloqueio ou reenviar. Se persistência falha, manter estado
  bloqueante `enviando`/`incerto`; não mascarar como recusa conclusiva.
- **REV-REQ-05 — Fronteiras:** `numeroErp` é dado interno do erro, sem alterar
  envelope HTTP ou adicionar payload ERP bruto/logs. A consulta autenticada de
  checkout já pode devolver `numero_erp` quando conhecido; esse número é
  referência para verificação, não comprovação isolada de conclusão.

HTTP público, schema/migração, regras comerciais, preço/estoque e contrato
do SIAC ficam preservados. Não criar endpoint de desbloqueio, timeout/reenvio
automático, dependências, persistência de catálogo ou alteração no ERP.
Sem commit/push/PR/deploy ou intervenção em banco real nesta aprovação.

### Critérios de aceite da revisão

- [x] **REV-AC-01:** lista antiga falha após trocar A→B sem esvaziar B; lista
  anterior à criação não remove o recém-criado nem troca seu ativo. Listagem
  atual ainda identifica exclusão externa e erro atual continua visível.
- [x] **REV-AC-02:** mutação v2 atrasada após leitura v3 mantém v3/quantidade
  nova; resposta com ID diferente é rejeitada; resposta atual válida é aceita.
- [x] **REV-AC-03:** API de B é chamada com A ainda pendente; seleção permanece
  disponível; voltar a A conserva ocupado; mesma origem continua serializada;
  finally de A não libera B e logout impede publicações antigas.
- [x] **REV-AC-04:** número válido com total inválido fica persistido com
  tentativa incerta/bloqueante, itens intactos, nenhum vínculo e apenas um POST;
  segundo envio é impedido. Número inválido não é persistido. Falha local
  conserva bloqueio; resposta válida e replay continuam funcionando.
- [x] **REV-AC-05:** registrar RED e GREEN por grupo, refatorar apenas depois
  do GREEN e rodar regressões pertinentes. Backend/frontend completos, build,
  diff e ensaio de seletor com resposta retida aprovados, com limitações reais.

### Validação, riscos e entrega

Promessas controladas no controlador real para REV-01/02/03; serviços reais
com SQLite isolado e ERP fake para REV-04. Falha RED deve demonstrar a asserção
comportamental desejada, não erro de importação/setup. Sem sleeps arbitrários
nem pedido no ERP real. Navegador com fake local confirma troca e ocupação do
seletor; não equivale a homologação SIAC.

Não descartar todas as listas indiscriminadamente: respostas válidas da
seleção atual precisam continuar publicáveis. Contagem por carrinho deve
limpar entradas finalizadas e não reaproveitar ciclo autenticado. A proteção
de versão não congela preço/estoque, que continuam enriquecidos pelo ERP.
Número conhecido não confirma conteúdo ou total e exige verificação operacional.

Ao concluir, atualizar esta seção, matriz do plano, revisao.md, recuperacao.md,
fix.md e índices com evidência observada. Reabrir/fechar AC-06/11 históricos
somente conforme as provas novas; não antecipar correção ou nova validação
manual do usuário. Relatório geral permanece fora desta revisão de escopo.

### Execução e validação da v2 — 2026-10-13

Aprovação explícita “aprovado” após apresentação dos dois documentos v2.
Implementados os quatro achados, com 22 novas regressões (13 frontend, nove
backend), testes RED comportamentais antes de cada grupo de correção.
Resultados e limitações em [plan.md](plan.md) e [revisao.md](revisao.md).

Backend 123/123, frontend 94/94 e build 67 módulos passaram. Navegador com
Express/React reais, SQLite temporário e ERP fake: resposta do Gol retida,
Civic recebeu outra peça antes da liberação, seletor disponível em desktop
e mobile; voltar ao Gol conserva bloqueio de itens, resposta dele não altera
Civic; busca/página e scroll desktop preservados. Zero pedidos neste ensaio.
AC-06/11 revalidados com as novas provas; sem afirmar auditoria exaustiva.
Sem escrita no SIAC real, novas dependências/schema, commit, push, PR ou deploy.

### Publicação autorizada e executada — 2026-10-13

Usuário solicitou abrir PR detalhado e enviar o link para avaliação. Commit de
implementação `2f9ff7a`, branch `feat/multiplos-carrinhos` enviada somente a
eduardofrois/kaizen-test. [PR #17](https://github.com/eduardofrois/kaizen-test/pull/17)
aberto contra main, sem conflitos na consulta. CI da implementação passou:
testes-backend e build-frontend no
[run 38360777053](https://github.com/eduardofrois/kaizen-test/actions/runs/38360777053).
Revisão documental geral preexistente preservada localmente e fora do PR.
Merge manual pendente; nenhum merge, deploy ou pedido real nesta publicação.
