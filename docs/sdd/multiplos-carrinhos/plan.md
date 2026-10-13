# Plano de implementação — Múltiplos carrinhos e edição na vitrine

**Versão:** 2
**Estado:** Revisão v2 implementada com TDD; quatro achados corrigidos e validação isolada/navegador simulado concluída; publicada no PR #17, avaliação/merge manual pendentes.
**Spec:** [spec.md](spec.md), versão 2 aprovada em 2026-10-13; versão 1 preservada no histórico.
**Aprovação da revisão v2 para implementar:** 2026-10-13; usuário “aprovado” após apresentação dos links da spec/plano v2 e pergunta “Aprova implementar essa versão?”. Inclui os quatro achados, testes RED/GREEN, regressões e ensaio simulado; sem publicação.
**Autorização de publicação:** 2026-10-13; usuário solicitou abrir PR detalhado da nova feature e enviar o link. Commit/push e PR desta unidade autorizados; merge manual e sem envio da consolidação documental anterior.
**Objetivo:** manter até dez carrinhos isolados por cliente e editar o ativo na vitrine, com checkout explícito e protegido por carrinho.
**Arquitetura:** entidades e bloqueio no SQLite; rotas validam HTTP/posse, serviços aplicam regras, cliente ERP concentra chamadas SIAC. O contexto React mantém principal persistido e ativo local à aba, publicando somente respostas do ciclo/seleção atual.
**Stack:** JavaScript ESM, Node/Express, better-sqlite3, React, React Router, Tailwind e node:test existentes; sem dependências novas.
**Baseline/data:** `f95ae66`; 2026-10-13, America/Sao_Paulo. Alterações documentais locais anteriores preservadas.
**Aprovação da spec:** usuário “aprovado” após apresentação da spec v1 e pergunta sobre preparar este plano.
**Aprovação histórica para implementar v1:** 2026-10-13; usuário “aprovado” após apresentação do plano v1 e pergunta explícita sobre implementar a feature nesta sessão. Escopo: spec v1 e plano v1; não atribuída à revisão v2.
**Execução:** nesta sessão, uma etapa por vez; sem delegação automática. Registrar resultado observado ao concluir cada etapa. Commit/push/PR exigem comando específico.

## Restrições globais

- Entre um e dez carrinhos por conta, incluindo vazios; até 50 produtos distintos e 99 unidades por produto em cada carrinho.
- Nome obrigatório com 1–60 caracteres após trim; nomes iguais permitidos.
- Primeiro carrinho e substituto do último excluído: “Meu carrinho”, vazio e principal.
- Excluir ativo/principal seleciona/promove o mais antigo, por `criado_em`, desempate `id`; excluir com itens exige confirmação.
- Principal persistido no servidor; ativo local à aba/ciclo autenticado; F5 e novo ciclo selecionam o principal.
- Escolher outro destino na adição torna-o ativo; cancelar não altera seleção ou itens.
- Busca, filtros e página ficam na URL; ações do painel preservam resultados e rolagem.
- Checkout usa carrinho_id, versão e identidade da tentativa; somente ele é esvaziado após sucesso confirmado e vínculo local salvo.
- Bloqueio persistente do carrinho durante envio/verificação; sem reenvio automático ou desbloqueio por tempo em resultado incerto.
- Posse no backend, ApiError, ColetorDeErros, envelope de erro e dinheiro em centavos preservados.
- ERP dono de produtos, preços, estoque e pedidos; sem reserva, cópia permanente de catálogo ou alteração do SIAC.
- SQLite isolado e ERP fake nos testes; nenhum pedido real. Sem reset, exposição de segredos ou descarte de alterações locais.
- JavaScript ESM, nomes em português, camadas atuais e identidade visual; sem troca de stack/dependências.

## Mapa de arquivos

| Ação | Caminho exato | Responsabilidade |
|---|---|---|
| Alterar | `backend/src/db/schema.sql` | Modelo final de carrinhos, itens e tentativas |
| Criar | `backend/src/db/migracoes.js` | Conversão transacional do schema legado e versão local |
| Alterar | `backend/src/db/index.js` | Aplicar migração/schema no bootstrap e db:init |
| Alterar | `backend/src/services/usuarioService.js` | Criar conta e primeiro carrinho na mesma transação |
| Criar | `backend/src/services/carrinhosService.js` | Gestão, posse, principal e consultas de bloqueio |
| Alterar | `backend/src/services/carrinhoService.js` | Itens e enriquecimento por carrinho explícito |
| Criar | `backend/src/services/checkoutService.js` | Tentativas, bloqueio, conclusão e estado de checkout |
| Alterar | `backend/src/services/pedidoService.js` | Orquestrar pedido com checkoutService; preservar listagem/detalhe |
| Criar | `backend/src/routes/carrinhos.js` | Contrato explícito da spec |
| Alterar | `backend/src/routes/carrinho.js` | Resposta segura para contrato legado sem ID |
| Alterar | `backend/src/routes/pedidos.js` | Validar ID, versão e tentativa no POST |
| Alterar | `backend/src/app.js` | Montar router `/api/carrinhos` |
| Alterar | `backend/src/erp/cliente.js` | Distinguir recusa conclusiva/resultado incerto e validar sucesso de criação |
| Criar | `backend/tests/apoio/multiplos-carrinhos.js` | Ambiente sintético compartilhado pelos novos testes |
| Criar | `backend/tests/fixtures/schema-carrinho-legado.sql` | Schema real anterior, sem dados/segredos |
| Criar | `backend/tests/migracao-carrinhos.test.js` | Preservação, repetição, rollback e integridade |
| Criar | `backend/tests/multiplos-carrinhos.test.js` | Serviços, HTTP, posse, limite e exclusão |
| Criar | `backend/tests/checkout-carrinhos.test.js` | Compra, repetição, bloqueio, falhas e reinício |
| Alterar | `backend/tests/carrinho-total.test.js` | Migrar fixtures/assinaturas preservando asserções KZN/FIX |
| Alterar | `backend/tests/pedido-dinheiro.test.js` | Pedido explícito e total ERP em centavos |
| Alterar | `frontend/src/api/cliente.js` | Métodos explícitos de carrinhos/checkout |
| Alterar | `frontend/src/lib/carrinhoPorSessao.js` | Ciclo, seleção, ordenação e operações vinculadas ao ID |
| Alterar | `frontend/src/contextos/CarrinhoContext.jsx` | Publicar lista, ativo, principal e ações; revalidar no foco |
| Criar | `frontend/tests/multiplos-carrinhos.test.js` | Seleção, isolamento, exclusão externa e ordem das respostas |
| Alterar | `frontend/tests/carrinho-por-sessao.test.js` | Adaptar fake/API mantendo regressões por sessão |
| Criar | `frontend/src/componentes/GerenciadorCarrinhos.jsx` | Seleção, criação, renomeação, principal e exclusão |
| Criar | `frontend/src/componentes/ConteudoCarrinho.jsx` | Itens, total, pendências e estado de checkout compartilhados |
| Criar | `frontend/src/componentes/PainelCarrinho.jsx` | Contêiner desktop/mobile, foco, Escape e barra fixa |
| Criar | `frontend/src/componentes/AdicionarAoCarrinho.jsx` | Ação direta e escolha opcional de destino |
| Alterar | `frontend/src/componentes/LinhaItemCarrinho.jsx` | Variante compacta e IDs únicos por instância |
| Alterar | `frontend/src/componentes/CardProduto.jsx` | Exibir ação compartilhada com destino |
| Alterar | `frontend/src/componentes/Cabecalho.jsx` | Nome/contador do ativo; preservar busca e nota KZN-5D1E |
| Alterar | `frontend/src/paginas/Catalogo.jsx` | Painel sem remontar catálogo ou alterar parâmetros |
| Alterar | `frontend/src/paginas/Produto.jsx` | Ação de adição com escolha e quantidade atual |
| Alterar | `frontend/src/paginas/Carrinho.jsx` | Reutilizar gestão/conteúdo, inclusive carrinho vazio |
| Alterar | `frontend/src/paginas/Checkout.jsx` | ID/versão/tentativa capturados, nome e estado incerto |
| Criar | `docs/sdd/multiplos-carrinhos/validacao-visual.md` | Medidas e resultados do protótipo/navegador |
| Criar | `docs/sdd/multiplos-carrinhos/recuperacao.md` | Backup, migração e roteiro de verificação operacional |
| Alterar | `docs/sdd/multiplos-carrinhos/spec.md`, `plan.md` | Estado, checkboxes e evidências reais |
| Alterar | `fix.md`, `docs/investigacao.md`, `docs/sdd/README.md` | Situação da unidade, INV-001/002 e próxima ação |

README, ARQUITETURA, docs/ai/arch e RELATORIO serão alinhados à entrega quando
sua edição estiver autorizada; não substituir a revisão documental anterior.
Não alterar `App.jsx` ou `index.css` se a composição do painel couber nas telas
e tokens atuais. O workflow já roda ambos os testes e build; sem mudança de CI.

## Tarefa 1 — Banco, migração e inicialização de contas

**Critérios:** REQ-02/04/17/18; AC-01 e fundação de AC-02/04/11.

**Interfaces produzidas:** `aplicarSchema(db)` mantém assinatura atual;
`migrarBanco(db, ddl)` em `db/migracoes.js`; `garantirCarrinhoInicial(usuarioId,
db)` em `carrinhosService.js`, chamada dentro da transação de cadastro.

- [x] Conferir Git, baseline, documentos e aprovação de spec/plano. Consultar
  worktrees anexadas antes de criar outra; usar checkout apropriado em
  `feat/multiplos-carrinhos`. Se alterações documentais anteriores impedirem
  separação, criar worktree gerenciada no ref revisado, copiando somente os
  documentos desta unidade; nunca stash/reset automático ou publicação das
  alterações anteriores como parte da feature.
- [x] Criar fixture SQL a partir do schema legado conferido no Git, mantendo
  suas tabelas/índices, sem dados reais. Criar helper sintético com interfaces:

```js
// backend/tests/apoio/multiplos-carrinhos.js
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export function executarCenario(cenarioFonte) {
  const pasta = mkdtempSync(path.join(tmpdir(), 'kaizen-multi-'));
  try {
    const resultado = spawnSync(process.execPath,
      ['--input-type=module', '-e', cenarioFonte], {
        cwd: pasta, encoding: 'utf8', timeout: 30000,
        env: {
          PATH: process.env.PATH, NODE_ENV: 'test',
          JWT_SEGREDO: 'jwt-sintetico-exclusivo-de-teste-0123456789',
          ERP_TOKEN: 'token-sintetico-de-teste',
          ERP_URL: 'https://erp.invalid',
          DB_PATH: path.join(pasta, 'isolado.db'),
        },
      });
    assert.ifError(resultado.error);
    assert.equal(resultado.status, 0, resultado.stderr);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}
```

  Cada cenário importa módulos por URL absoluta, abre SQLite em memória ou
  no DB_PATH temporário e fecha recursos em finally; cria dois proprietários
  sintéticos e instala o fake antes de qualquer operação externa.
  `cenarioFonte` é código de teste do repositório, nunca entrada do usuário.
  Fake de fetch aceita somente origem ERP sintética ou servidor HTTP local;
  cookie/JWT ficam em memória sem impressão. Helper não inclui nome *.test.js.
- [x] Escrever testes partindo do schema legado com duas contas, uma com dois
  itens e outra vazia, endereço e pedido histórico. Exemplo de asserções do
  cenário, usando o banco e funções importados no próprio subprocesso:

```js
const antes = db.prepare('SELECT * FROM carrinho_itens ORDER BY id').all();
aplicarSchema(db);
const depois = db.prepare(`SELECT i.id, c.usuario_id, i.codigo_produto,
  i.quantidade, i.adicionado_em FROM carrinho_itens i
  JOIN carrinhos c ON c.id=i.carrinho_id ORDER BY i.id`).all();
assert.deepEqual(depois, antes);
assert.equal(db.prepare('SELECT COUNT(*) n FROM carrinhos').get().n, 2);
aplicarSchema(db);
assert.equal(db.prepare('SELECT COUNT(*) n FROM carrinhos').get().n, 2);
assert.deepEqual(db.pragma('foreign_key_check'), []);
```

- [x] Rodar `node --test tests/migracao-carrinhos.test.js` em backend e
  registrar falha inicial, distinguindo módulo ausente de falha comportamental.
- [x] Implementar modelo e migração; algoritmo:

```text
schema final:
  carrinhos(id AUTOINCREMENT, usuario_id FK CASCADE, nome, principal 0/1,
            versao >=1 DEFAULT 1, criado_em, atualizado_em)
  UNIQUE(usuario_id) WHERE principal=1
  carrinho_itens(id preservado, carrinho_id FK CASCADE, codigo_produto,
                 quantidade>0, adicionado_em, UNIQUE(carrinho_id,codigo_produto))
  checkout_tentativas(usuario_id FK CASCADE, tentativa_id, carrinho_id_origem,
    versao_carrinho, assinatura_requisicao, endereco_entrega,
    estado, numero_erp nullable, criado_em, atualizado_em)
  PRIMARY KEY(usuario_id,tentativa_id)
  UNIQUE(carrinho_id_origem) WHERE estado IN ('preparando','enviando','incerto')
  estado IN ('preparando','enviando','incerto','concluido','recusado')

transação IMMEDIATE de migrarBanco:
  verificar PRAGMA user_version e table_info(carrinho_itens)
  se tabela possui usuario_id legado, renomear para carrinho_itens_legado
  executar DDL final, criar um principal por usuário existente
  copiar id/código/quantidade/data legado via JOIN carrinhos.usuario_id
  comparar contagem e conteúdo da cópia; abortar se divergir
  remover somente tabela legada já copiada, dentro da mesma transação
  conferir foreign_key_check; definir user_version=1; commit
  segunda aplicação não renomeia/copia; versão maior desconhecida aborta
```

  `carrinho_id_origem` é registro histórico lógico sem cascade de carrinho;
  IDs AUTOINCREMENT não são reutilizados. Isso preserva tentativas concluídas
  após excluir um carrinho. Não adicionar FK obrigatória aos pedidos antigos.
  `endereco_entrega` guarda somente snapshot necessário à reconciliação, como
  já ocorre em pedidos_usuario; não persistir pedido completo ou catálogo.
  Validar tamanho/conteúdo nas rotas e serviços, não usar SQL interpolado.
- [x] Inserir conta e `garantirCarrinhoInicial` na mesma transação síncrona
  após gerar a senha; manter erros de email e API de cadastro. Criar inicial
  também no caso legado de conta sem carrinho, sem permitir dois principais.
- [x] Adicionar rollback por falha de cópia (fixture com trigger abortando),
  banco novo, repetição, versão futura, cadastro e conexões independentes.
  Não desligar foreign_keys para esconder inconsistência.
- [x] Rodar a suíte focada e registrar resultado. Documentar backup consistente
  com API SQLite e recuperação sem reset em `recuperacao.md`. Não migrar o
  banco real para validar este passo.

## Tarefa 2 — Gestão e itens por carrinho com contrato HTTP explícito

**Critérios:** REQ-01 a REQ-04, REQ-08/09/13/18; AC-02/03/04.

**Interfaces produzidas:**

```js
// services/carrinhosService.js; db opcional = obterBanco()
garantirCarrinhoInicial(usuarioId, db); // metadados; idempotente
listarCarrinhos(usuarioId, db); // { carrinhos, principal_id }
buscarCarrinho(usuarioId, carrinhoId, db); // metadados ou ApiError 404
exigirCarrinhoEditavel(usuarioId, carrinhoId, db); // 404/409 ou metadados
criarCarrinho(usuarioId, nome, db); // metadados
renomearCarrinho(usuarioId, carrinhoId, nome, db); // metadados
definirPrincipal(usuarioId, carrinhoId, db); // { carrinhos, principal_id }
excluirCarrinho(usuarioId, carrinhoId, confirmarComItens, db);
// -> { carrinhos, principal_id, substituto_id }

// services/carrinhoService.js
lerCarrinho(usuarioId, carrinhoId, db); // Promise<representação com versão>
adicionarItem(usuarioId, carrinhoId, codigo, quantidade, db);
alterarQuantidade(usuarioId, carrinhoId, codigo, quantidade, db);
removerItem(usuarioId, carrinhoId, codigo, db);
limparCarrinho(usuarioId, carrinhoId, db); // mutação pública, respeita bloqueio
```

- [x] Criar testes de serviços/HTTP com duas contas, dois carrinhos e a mesma
  peça em ambos. Exemplo central, em cenário do helper com os módulos reais:

```js
const a = criarCarrinho(1, 'Gol do João', db);
const b = criarCarrinho(1, 'Civic prata', db);
await adicionarItem(1, a.id, 'PECA-A', 2, db);
await adicionarItem(1, b.id, 'PECA-A', 4, db);
await alterarQuantidade(1, a.id, 'PECA-A', 1, db);
assert.equal((await lerCarrinho(1, b.id, db)).quantidade_pecas, 4);
await assert.rejects(lerCarrinho(2, a.id, db), e => e.status === 404);
```

  ERP fake fornece produto ativo com estoque suficiente; depois testar estoque
  insuficiente, produto ausente/inativo, 50/99 e indisponíveis fora do total.
- [x] Rodar `node --test tests/multiplos-carrinhos.test.js` em backend antes
  da implementação e registrar quais expectativas falham.
- [x] Implementar gestão em transações IMMEDIATE: validar posse/bloqueio,
  contar no momento da gravação, aplicar alteração e incrementar versão/data.
  Principal: desmarcar antigo e promover alvo no mesmo commit; não deixar
  estado observável sem principal. Excluir: contar itens e exigir booleano
  literal true, remover, promover/criar conforme spec; retornar mais antigo
  como substituto para o cliente decidir se sua seleção precisa mudar.
- [x] Adaptar serviço de itens com captura consistente de metadados/linhas
  antes do await de enriquecimento. Para mutar: verificar posse antes do ERP;
  após ERP, revalidar posse/bloqueio dentro da transação e calcular quantidade
  contra linha corrente, não contra leitura anterior ao await. Atualizar
  versão no mesmo commit. Sem chamada HTTP dentro da transação SQLite.

```text
adicionarItem:
  buscarCarrinho(usuarioId,carrinhoId) antes de consultar produto
  produto = await ERP.buscarProduto(codigo)
  transação IMMEDIATE:
    exigirCarrinhoEditavel(usuarioId,carrinhoId)
    ler linha atual, calcular nova quantidade e conferir estoque/capacidade
    inserir/atualizar SOMENTE carrinhoId; versao=versao+1
  retornar await lerCarrinho(usuarioId,carrinhoId)
```

- [x] Montar `rotasCarrinhos` em app.js. Reutilizar inteiroPositivo e
  textoObrigatorio para IDs/nome/código/quantidade; booleano de confirmação
  deve ser booleano real. Erros acumulados com ColetorDeErros. CRUD/itens/
  principal/status seguem tabela da spec; listagem não busca todos os produtos.
  A rota de estado de checkout chama a interface da Tarefa 3 quando disponível.
- [x] Tornar todas as rotas legadas `/api/carrinho` autenticadas e retornar
  409 CARRINHO_OBRIGATORIO, sem escrita nem ERP. Não criar fallback implícito.
- [x] Adaptar fixtures e assinaturas de carrinho-total.test.js preservando
  cada asserção anterior e adicionando carrinho vizinho. Chamadas de pedido
  nesse arquivo serão ajustadas junto com a Tarefa 3.
- [x] Testar vazio/com itens, cancelar confirmação, excluir ativo/principal/
  ambos/último, timestamps iguais, promoção e exclusão concorrentes. Para
  criação no limite, usar dois processos/conexões no mesmo SQLite temporário;
  resultado final nunca excede dez, nem perde o único principal.
- [x] Testar 401, corpo inválido, ID inexistente/alheio, nome inválido,
  requisições legadas e campos de proprietário/preço ignorados como autoridade.
  Executar suíte focada e registrar resultados em spec/plano/fix.

## Tarefa 3 — Checkout exclusivo, repetível e recuperável

**Critérios:** REQ-01/12 a REQ-18; AC-09/10/11; regressões AC-03/12.

**Interfaces consumidas:** buscarCarrinho/exigirCarrinhoEditavel e
lerCarrinho com ID explícito. **Interfaces produzidas:**

```js
// checkoutService.js; db opcional = obterBanco()
iniciarTentativa(usuarioId, dados, enderecoEntrega, db);
// dados={carrinho_id,versao_carrinho,tentativa_id,endereco_id,observacao}
// -> { tentativa, repetida, numero_erp? }; adquire bloqueio se nova
marcarEnviando(usuarioId, tentativaId, db);
registrarNumeroErp(usuarioId, tentativaId, numeroErp, db);
marcarIncerta(usuarioId, tentativaId, db);
recusarTentativa(usuarioId, tentativaId, db);
concluirTentativa(usuarioId, tentativaId, pedidoErp, db);
lerEstadoCheckout(usuarioId, carrinhoId, db);

// pedidoService.js
finalizarPedido(usuario, dados, db);
// -> Promise<{ pedido, repetido }>; rota mapeia 201/200, dados=pedido
```

- [x] Criar checkout-carrinhos.test.js com ERP fake que pode reter o POST,
  devolver recusa, timeout, 5xx, sucesso inválido e sucesso utilizável. Criar
  duas conexões ao arquivo temporário para provar bloqueio além da memória.
  Asserções obrigatórias durante POST retido:

```js
// iniciar finalização e aguardar o fake sinalizar recebimento do POST
assert.equal(posts.length, 1);
await assert.rejects(adicionarItem(1, a.id, 'PECA-B', 1, db2),
  e => e.status === 409 && e.codigo === 'CARRINHO_EM_CHECKOUT');
await adicionarItem(1, b.id, 'PECA-B', 1, db2);
assert.equal((await lerCarrinho(1, b.id, db2)).quantidade_pecas, 1);
// liberar resposta e esperar finalização; A vazio, B intacto, A mantém nome
```

  Criar teste distinto para mutação cujo GET de produto começou antes do
  bloqueio: liberar esse GET após início do POST; gravação deve ser recusada.
- [x] Rodar teste focado antes de implementar. Ajustar pedido-dinheiro.test.js
  e chamadas de finalizarPedido em carrinho-total.test.js para payload explícito,
  mantendo prova de centavos, endereço selecionado e isolamento anterior.
- [x] Implementar assinatura canônica da requisição com crypto de Node sobre
  ID, versão, endereço_id e observação normalizada, junto ao proprietário;
  armazenar somente resumo verificável, nunca credenciais. tentativa_id UUID
  validado na rota; sua posse sempre depende da sessão. Snapshot de endereço
  capturado antes do envio, para reconciliação preservar a entrega original.
- [x] Adquirir bloqueio em transação IMMEDIATE. Consultar tentativa do mesmo
  proprietário antes de iniciar trabalho externo: mesma chave/requisição
  concluída não envia; incompatível retorna 409; pendente/incerta mantém
  bloqueio; recusada não reenvia com a mesma chave. Nova chave exige carrinho
  próprio, versão atual e ausência de outra tentativa bloqueante.
  Após excluir carrinho, chave antiga permanece registrada; responder 404
  para ID inexistente, sem recriar carrinho ou reutilizar a tentativa.
- [x] Implementar fluxo exato:

```text
validar usuário/carrinho/endereço/payload; verificar replay sem trabalho ERP
iniciarTentativa atomiza checagem de versão e bloqueio em estado preparando
tentar lerCarrinho e validar vazio/pendências/preço/estoque com bloqueio mantido
  se falhar antes de criar pedido: estado recusado; preservar itens; liberar
marcarEnviando persiste antes do POST; nenhum await antes dessa gravação
chamar uma vez ERP.criarPedido com códigos/quantidades do carrinho bloqueado
  recusa conclusiva: recusado; itens intactos; permitir nova chave
  transporte/5xx/JSON inválido: incerto; itens intactos; manter bloqueio
sucesso com numero válido e valor_total finito não negativo:
  registrarNumeroErp, sem resposta de sucesso ao navegador ainda
  concluirTentativa em uma transação:
    verificar tentativa, proprietário e carrinho de origem
    inserir vínculo com snapshot endereço e total ERP em centavos
    apagar itens SOMENTE desse carrinho (caminho interno de conclusão)
    incrementar versão, estado concluido; commit
falha persistindo número/concluindo: conservar estado bloqueante, não reenviar
retornar {pedido,repetido:false}; replay usa vínculo já salvo, repetido:true
```

  Conclusão interna não chama a mutação pública `limparCarrinho`, que deve
  recusar o bloqueio. Replay confirmado retorna os campos locais disponíveis
  (número, total e snapshot), sem depender de disponibilidade do ERP para
  provar que já concluiu; não promete devolver cópia integral do pedido.
- [x] No cliente ERP, manter envelope público e classificar origem da falha
  de criação internamente. Recusas documentadas 401/404/409/422 não criam
  pedido; 5xx/transporte/resposta inesperada são conservadoramente incertos.
  Não modificar a tradução geral das leituras ou inferir segurança do texto
  da mensagem. Número/total ausentes ou inválidos não são sucesso confirmado.
- [x] Expor GET de estado, revalidando posse. Estado livre se não há tentativa
  bloqueante; preparando/enviando mostra envio; incerto mostra verificação.
  Reinício não apaga estados persistidos; tentativa sem conclusão nunca é
  reenviada automaticamente. Se não houver prova de executor vivo, orientar
  verificação conservadora também para preparando/enviando interrompidos;
  sem tarefa automática que vença locks de processos ainda ativos.
- [x] Ensaiar replay em nova conexão/subprocesso, mesma chave com outro
  payload, nova chave enquanto bloqueado, replay após exclusão, perda de
  resposta HTTP depois de commit, erro ao salvar vínculo e sucesso sem número.
  Para falha local, trigger sintético aborta INSERT em pedidos_usuario.
  Nenhum cenário pode produzir segundo POST por repetir uma tentativa.
- [x] Escrever recuperacao.md: número conhecido exige GET ERP e conferência
  de dono/itens/endereço antes de concluir localmente; número desconhecido
  exige confirmação responsável SIAC. Documentar transação de reconciliação
  com dados sintéticos e evidência registrada. Não oferecer SQL genérico de
  desbloqueio nem endpoint público, não executar em banco/ERP reais.
- [x] Rodar `node --test tests/checkout-carrinhos.test.js tests/pedido-dinheiro.test.js tests/carrinho-total.test.js` em backend;
  registrar contagens e limites observados.

## Tarefa 4 — Cliente HTTP e estado por sessão/seleção

**Critérios:** REQ-01/05/06/07/08/09/12; AC-05/06 e suporte AC-07/11.

**Interfaces produzidas:**

```js
// api/cliente.js, grupo carrinhos; resposta mantém envelope {dados}
listar(); criar(nome); renomear(id,nome); definirPrincipal(id);
excluir(id,confirmarComItens); ler(id); adicionar(id,codigo,quantidade=1);
alterar(id,codigo,quantidade); remover(id,codigo); limpar(id);
estadoCheckout(id);

// criarCarrinhoPorSessao(api.carrinhos, autenticado): controlador estendido
// snapshot: {carrinhos,principalId,ativoId,carrinho,carregando,erro,ocupado}
ativar(); invalidar(); assinar(ouvir); obterSnapshot();
recarregar(); selecionar(id); criar(nome); renomear(id,nome);
definirPrincipal(id); excluir(id,confirmarComItens);
adicionar(codigo,quantidade=1,destinoId); alterar(codigo,quantidade);
remover(codigo); limpar();
// Promise<boolean>: false=origem invalidada, não mostrar sucesso; erros atuais
// de mutação mantêm ErroApi. setCarrinho não fica exposto sem uso real.
```

- [x] Criar testes com promessas controladas sem rede/DOM. Cada fake declara
  listar/ler e mutações com IDs explícitos, snapshots completos e versões.
  Exemplo de regra de seleção a testar:

```js
controle.ativar();
await controle.recarregar();
assert.equal(controle.obterSnapshot().ativoId, principalId);
await controle.selecionar(outroId);
await controle.adicionar('PECA-A', 1);
assert.deepEqual(chamadas.at(-1), ['adicionar', outroId, 'PECA-A', 1]);
await controle.definirPrincipal(principalId);
assert.equal(controle.obterSnapshot().ativoId, outroId);
```

- [x] Rodar `node --test tests/multiplos-carrinhos.test.js tests/carrinho-por-sessao.test.js` em frontend
  e registrar falhas iniciais. Migrar fixtures de sessão sem reduzir asserções
  de visitante, X→Y→X, 401, erro técnico, StrictMode e callbacks invalidados.
- [x] Implementar API exatamente pelos endpoints da spec, incluindo corpo
  JSON na exclusão com confirmação, encodeURIComponent no código do produto
  e envio dos campos extras no pedido; remover chamadas implícitas antigas.
- [x] Estender controlador mantendo ciclo autenticado existente. Boot carrega
  metadados e principal; selecionar limpa representação antiga, incrementa
  geração e carrega ID explícito; lista e leitura têm sequências independentes.
  Nunca remontar catálogo como técnica de troca de seleção.

```text
captura = {ciclo,geracaoSelecao,id,sequenciaLeitura}
publicar leitura apenas se ciclo/geração/id continuam iguais
e nenhuma leitura mais recente já foi aceita
snapshot de versão menor que a publicada é descartado
mutações da aba são serializadas por carrinho, com origem capturada na chamada
antes de enviar mutação enfileirada, revalidar ciclo/geração e metadados/posse
se troca ocorreu antes do envio, retornar false; nunca reenviar para novo ativo
mutação já enviada pode concluir em seu destino; não publica em outra seleção
sucesso de mutação invalida leituras anteriores e recarrega seleção ainda atual
erro/finally tardio também precisa conferir captura
```

  Ao escolher destino opcional, selecionar explicitamente e adicionar somente
  se seleção ainda corresponde à escolha; não adicionar em fallback caso o
  destino tenha sido excluído. Se API retornar 404, atualizar lista/seleção,
  informar exclusão e encerrar aquela adição sem repetição automática.
- [x] Revalidar lista/ativo ao recuperar foco/visibilidade e antes de mutações.
  Lista nova mantém ativo válido; se excluído, selecionar mais antigo. Boot
  e F5 usam principal. Criar/excluir/definirPrincipal atualizam metadados sem
  inferir ativo global. Login/logout invalidam todos os callbacks/filas.
- [x] Publicar no contexto as ações estáveis; registrar listeners em efeito
  com cleanup, sem chamadas de rede durante render. Preservar usoMemo e
  useSyncExternalStore ou simplificação equivalente sem estado divergente.
- [x] Testar A→B→A com resolve/reject tardios, leitura antiga após mutação,
  duas mutações sucessivas, criação/exclusão durante outra leitura, erro do
  destino, principal alterado externamente, exclusão externa e visitante sem
  chamadas privadas. Registrar resultados, sem alegar integração React.

## Tarefa 5 — Painel, gestão e escolha de destino

**Critérios:** REQ-03/05/06/08/10/11; AC-05/07/08.

**Interfaces:** GerenciadorCarrinhos e ConteudoCarrinho consomem useCarrinho;
PainelCarrinho compõe ambos; AdicionarAoCarrinho recebe produto/quantidade e
usa ação do contexto, compartilhada por CardProduto e Produto.

```jsx
// Contratos de composição
<GerenciadorCarrinhos />
<ConteudoCarrinho compacto={true} />
<PainelCarrinho />
<AdicionarAoCarrinho produto={produto} quantidade={quantidade} />
// LinhaItemCarrinho acrescenta compacto, sem alterar handlers existentes.
// useId() fornece id de quantidade único em painel e página.
```

- [x] Montar protótipo descartável com conteúdo sintético, sem backend ou
  alterações de comportamento no app, após aprovação deste plano. Usar arquivo
  HTML em diretório temporário permitido; conferir em navegador 320, 375,
  390, 768, 1024 e 1280px, com dez nomes longos, lista vazia e item pendente.
  Registrar em validacao-visual.md medidas/capturas sem dados pessoais.
  Direção inicial: desktop aberto e recolhível, coluna 320px; abaixo de 1024px
  fechado, botão inferior fixo, painel sobreposto. Ajustar dimensões/grade
  dentro da interação aprovada; mudanças materiais exigem revisão da spec.
- [x] Implementar gestão sempre visível também quando carrinho está vazio:
  select do ativo com nome/principal, formulário curto de criar/renomear,
  definir principal e excluir. Cancelar confirmação conserva dados. Em 409
  CONFIRMACAO_NECESSARIA, pedir confirmação explícita; não apagar em retry
  silencioso. Limite de dez desabilita criação e explica a razão.
- [x] Extrair conteúdo de Carrinho.jsx para ConteudoCarrinho, usando a mesma
  representação do contexto, sem segundo fetch/estado de itens no painel.
  Manter item indisponível visível, controles de estoque e total/contador
  existentes. Mostrar bloqueio e impedir ações/checkout enquanto envia/incerto.
- [x] Criar PainelCarrinho e integrar em Catalogo.jsx mantendo a árvore dos
  filtros/resultados e dependências da busca. Alterar grid de produtos conforme
  espaço lateral; não comprimir quatro colunas no espaço restante.

```text
>=1024px: catálogo minmax(0,1fr) + aside ~320px; recolher remove coluna lateral
<1024px: catálogo usa largura disponível; acionador inferior mostra unidades/total
abrir: guardar elemento acionador e scrollY; mostrar dialog com aria-modal
dialog: foco inicial no título/controle; Tab/Shift+Tab ficam dentro
fechar/Escape: retirar bloqueio de rolagem, restaurar scrollY e foco acionador
barra: reservar padding inferior incluindo safe-area-inset-bottom
```

  Usar comportamento nativo de dialog quando compatível com navegador alvo,
  ou controle explícito equivalente; testar teclado, não assumir pelo atributo.
- [x] Implementar ação compartilhada: botão com destino explícito e botão
  “Escolher carrinho”, lista de destinos, cancelar, selecionar/adicionar. Não
  mudar quantidade escolhida no detalhe nem cadastrar visitante automaticamente.
  visitante segue login; após retorno não repetir adição sem ação do usuário.
- [x] Adaptar cabeçalho para identificar ativo/contador sem alterar handlers
  da busca. Nome completo acessível, textos podem quebrar/truncar; preservar
  paleta e notas KZN. Guardar retornos false antes de qualquer mensagem de sucesso.
- [x] Integrar página /carrinho com os mesmos componentes e tratar erro antes
  de vazio; não esconder gerenciador quando o carrinho foi esvaziado na compra.
- [x] Conferir React com checklist do skill react-best-practices após editar
  múltiplos componentes: hooks, efeitos, IDs únicos, sem HTML de nomes, estados
  derivados, labels/foco e ausência de fetch por item duplicado no painel.
- [x] Validar no navegador ações, cancelar, nomes longos, pendências, erro e
  recarga. Registrar URL/scroll antes e depois; nenhuma edição/troca altera
  busca, filtros ou página. Rodar testes frontend e build, registrando evidência.

## Tarefa 6 — Integração do checkout e validação final

**Critérios:** REQ-01/07/09/12 a REQ-18; AC-09 a AC-12 e percurso AC-01 a AC-08.

**Interfaces consumidas:** API carrinhos.estadoCheckout, pedidos.criar com
payload explícito e contexto da Tarefa 4. Nenhum endpoint administrativo novo.

- [x] Em Checkout.jsx, mostrar nome do ativo, resumo e versão corrente; enquanto
  troca/carrega, impedir confirmar com representação anterior. Capturar conta,
  ciclo, ativo, versão, endereço e observação ao confirmar. Gerar tentativa_id
  com crypto.randomUUID uma vez por tentativa, preservando-o para consultas/
  replay; não gerar nova chave automaticamente em catch.

```js
const dados = {
  carrinho_id: carrinho.id,
  versao_carrinho: carrinho.versao,
  tentativa_id: tentativaId,
  endereco_id: enderecoId,
  observacao,
};
// Publicar/navegar somente se ciclo e seleção capturados continuam atuais.
const resposta = await api.pedidos.criar(dados);
// Resposta confirmada pode levar ao pedido; resposta tardia só atualiza
// origem válida, nunca o formulário de outra conta/carrinho.
```

- [x] Em falha de rede/resultado incerto, consultar estado daquele ID quando
  possível; sem prova conclusiva, manter mensagem de verificação e botão
  indisponível. F5 consulta estado persistido junto da seleção inicial;
  enviar/incerto não é carrinho livre. Se tentativa terminou, mostrar número/
  ligação ao pedido; não reenviar para “descobrir”. Erro conclusivo permite
  corrigir dados e iniciar nova tentativa por nova confirmação explícita.
- [x] Preservar endereço escolhido e formulário existente. Impedir efeitos
  tardios de endereços, pedido e recarga após mudança de conta/seleção, usando
  o mesmo vínculo de origem; sem reformular autenticação/endereço principal.
- [x] Fazer percurso integrado com API real e ERP simulado: duas contas,
  duas abas, A/B com mesma peça em quantidades distintas, principal B,
  busca/filtros/página/rolagem, escolher A na adição, finalizar A com endereço
  não principal, confirmar nome preservado e B intacto. Retorno via F5 usa B.
- [x] Repetir integrado com ERP retido, tentativa repetida, mutação de outra
  aba, outra conta/ID, timeout, sucesso inválido, falha de persistência e
  reinício. Confirmar Network sem novo POST ERP nos casos bloqueados/replay.
  Testes de compra usam somente ambiente sintético; validação manual local
  com ERP real limita-se à leitura/gestão de carrinhos autorizada.
- [x] Executar verificações finais uma vez após as últimas alterações:

```sh
# cwd backend
npm test
# cwd frontend
npm test
npm run build
# cwd raiz
git diff --check
```

  Só repetir/ampliar se houver falha, alteração posterior ou risco não resolvido.
  Registrar versão Node efetivamente usada, contagens e comandos, sem reutilizar
  96/79 ou build histórico como prova desta feature.
- [x] Atualizar matriz abaixo, checkboxes da spec, fix/investigacao/índice e
  relatórios autorizados. Distinguir protótipo, controlador puro, HTTP isolado
  e navegação integrada; pedir ao usuário validação manual do resultado concreto
  sem declarar concluídos os cenários que ele não conferiu.
- [x] Revisar diff completo e histórico a publicar somente se houver comando
  de publicação; selecionar arquivos explicitamente, sem git add . e sem
  incluir frontend/.vite, banco, ambiente ou documentos anteriores fora do
  escopo. Mensagem prevista: `feat: adiciona multiplos carrinhos e painel na vitrine`.
  Commit/push/PR aguardam autorização própria; merge manual, deploy separado.

## Migração e recuperação

- Backup real deve usar snapshot SQLite consistente, incluindo estado WAL,
  sem copiar só o arquivo principal com processo escrevendo. Validar primeiro
  em banco temporário, depois seguir roteiro e autorização de execução local.
- `aplicarSchema()` usa migração antes de servir requisições; versão/schema
  incompatível impede iniciar. db:init chama a mesma função, sem --reset.
- Rollback de migração que falha ocorre na própria transação. Depois de uso
  do modelo novo, não rodar código antigo sobre o banco nem restaurar backup
  descartando novos dados. Preferir correção progressiva; recuperação com dados
  reais requer parada/coleta consistente e decisão explícita.
- Tentativas persistidas não expiram automaticamente. Pedido confirmado exige
  conferir vínculo e concluir limpeza na mesma transação, sem segundo POST;
  prova de não criação permite recusa/liberação. Sem prova, manter bloqueio.
- `recuperacao.md` deve incluir ensaio sintético de cada caminho e o ponto em
  que é necessária evidência do responsável SIAC; não prometer ferramenta de
  reconciliação ou idempotência remota inexistente.

## Matriz de validação

| Aceite | Tarefas/prova | Resultado esperado | Resultado observado |
|---|---|---|---|
| AC-01 | T1; migracao-carrinhos.test.js | Preserva legado, idempotente, rollback e FK íntegros | Passou: preservação/reexecução/rollback/versão futura |
| AC-02 | T1/T2; multiplos-carrinhos.test.js, HTTP/2 conexões | Dez no máximo, cadastro inicial, posse e erros | Passou: cadastro, nome, HTTP/posse e dois processos no limite |
| AC-03 | T2/T3; serviços e regressões total/dinheiro | Itens por ID, 50/99, total/contador/estoque preservados | Passou: itens/50/99/centavos/estoque, 27 regressões de carrinho mantidas |
| AC-04 | T2/T4; exclusão concorrente e controlador | Substituição correta, confirmação e um principal | Passou isoladamente: confirmação, promoção, último e exclusão por dois processos; cancelamento por inspeção |
| AC-05 | T4/T5/T6; controlador e duas abas | Principal no boot/F5, ativo independente e destino claro | Passou: controlador e navegador, duas abas/boot/F5/escolha pelo card |
| AC-06 | T4/T6 e R1/R2; promessas controladas e respostas retidas | Sem publicação, mensagem ou navegação de origem antiga | Revalidado na v2: listas antigas descartadas; mutação não regride versão nem invalida leitura mais nova; ID validado |
| AC-07 | T5/T6; navegador, URL/scroll e erro fake | Editar/trocar preserva vitrine; recarga recupera erro | Navegador preservou URL/scroll; falhas/recarga passaram isoladamente |
| AC-08 | T5; protótipo e navegador em seis larguras | Sem overflow, foco/Escape e barra sem obstrução | Seis larguras sem overflow; dez nomes, Tab/Shift+Tab/Escape conferidos |
| AC-09 | T3/T6; checkout HTTP fake e endereço alternativo | Só carrinho confirmado comprado/limpo, nome preservado | Compra fake limpou só origem; HTTP conferiu endereço alternativo |
| AC-10 | T3/T6; POST retido, processos/conexões distintas | Bloqueio backend, outro carrinho livre, único envio | Passou: lock em duas conexões, corrida pré-await e repetição sem novo POST |
| AC-11 | T3/T6 e R4; falhas, replay e reinício | Bloqueio/itens preservados, sem reenvio, roteiro ensaiado | Revalidado na v2: número de resposta parcial persistido; falha local conserva bloqueio; reabertura e replay passam |
| AC-12 | T6/R5; npm test dos dois, build e diff | Suítes/build passam, documentos/evidências coerentes | V2: backend 123/123; frontend 94/94; build 67 módulos; diff/sintaxe passaram |

## Autorrevisão e execução

Cobertura dos 18 requisitos: T1 cobre persistência/migração/contas; T2 cobre
posse, limites, gestão e mutações; T3 cobre envio/repetição/recuperação; T4
cobre sessão/seleção/respostas; T5 cobre interface; T6 cobre integração e
entrega. A matriz relaciona os 12 aceites a provas concretas.

Detalhes executivos não ampliam os limites da spec: snapshot de endereço já
pertence à loja; registro de tentativas não é cópia de pedido ERP; bloqueio
conservador não promete transação distribuída. Se implementação exigir novas
regras de produto, dependências, storage ou risco, parar a parte afetada e
revisar spec/plano, preservando trabalho independente autorizado.

Checklist técnica executada após aprovação real; item de revisão para publicação
concluído em 2026-10-13 após comando explícito do usuário, registrado abaixo. Nenhuma
instrução deste plano autoriza delegação, commit, publicação, reset ou teste
de escrita no ERP real. Aprovação para implementar registrada em 2026-10-13; Tarefa 1 iniciada depois dessa mensagem. Não usar skills ausentes como requisito implícito de execução.

## Histórico

- **2026-10-13 — Spec v1 aprovada:** usuário “aprovado” após apresentação do
  documento e pergunta sobre preparar o plano. Implementação ainda pendente.
- **2026-10-13 — Plano v1 preparado:** inspeção de arquivos/consumidores,
  mapa de interfaces, seis tarefas e matriz de aceites. Sem código, testes,
  migração, protótipo, build, branch nova ou publicação executados nesta etapa.
- **2026-10-13 — Conferência documental:** script transitório conferiu seis
  tarefas, cobertura dos 12 aceites, links locais dos cinco documentos desta
  etapa, formatação e ausência dos marcadores incompletos pesquisados;
  `git diff --check` passou. Revisão das interfaces e limites feita nesta
  sessão, sem subagentes. Verificações não equivalem a teste funcional/build.

## Execução e desvios registrados — 2026-10-13

Aprovação explícita do plano/spec v1 com “aprovado” nesta conversa. Branch
feat/multiplos-carrinhos criada preservando todas as alterações locais; nenhum
stash/reset/commit/push. Tarefas executadas na própria sessão, sem subagentes.

1. Migração: RED 0/2 (tabela ausente e ausência de rejeição), GREEN 2/2.
   Rollback comprovado com item órfão sintético, em vez de trigger durante cópia;
   chaves estrangeiras desligadas somente para construir esse fixture inválido.
2. Gestão: primeira rodada 1/3; duas falhas por assinaturas ainda antigas,
   incompatibilidade estrutural da nova API. Serviço adaptado e testes passaram.
3. Checkout: RED estrutural 0/7 por módulo inexistente; GREEN 7/7, depois
   ampliado para 10/10 pelos riscos de await, conexão e recuperação. Não alegar
   que erro de importação reproduziu duplicidade da baseline.
4. Frontend: fixtures de sessão migradas para lista/ID; 24 cenários de sessão
   e cinco de seleção, total 29/29. Setter sem consumidores deixou de ser
   exposto, conforme plano. Com demais regressões, frontend 81/81.
5. UI: protótipo antes da composição; revisão React aplicada. Foco do dialog
   nativo falhou no Shift+Tab, corrigido com ciclo explícito e rechecado.
   useId fica no ConteudoCarrinho, passando ID à linha pura: mantém IDs únicos
   sem invalidar os testes reais dos handlers de quantidade.
6. Integração: fake inicial de detalhe omitia cliente/imagem; fixture corrigido
   sem modificar PedidoDetalhe. Cliente HTTP de teste precisava Content-Length
   no DELETE; corrigido antes de conferir confirmação booleana. Testes HTTP
   requereram permissão de porta local; nenhuma escrita no SIAC real.

Última suíte completa: backend 114/114, frontend 81/81. Após acrescentar
asserções de exclusão concorrente, teste focado multiplos-carrinhos 6/6 passou;
nenhum código backend mudou depois da suíte completa. Após últimas guardas
React, frontend 81/81 e build 67 módulos passaram, com smoke mobile no build
final (quantidade 1→2 e total R$39,98). git diff --check e node --check dos
serviços novos/controlador passaram. Evidências em validacao-visual.md.

Os checkboxes incluem as verificações realizadas com a adaptação de prova
acima; não representam a execução literal de todo comando ilustrativo do plano.
Confirmação manual do usuário pendente; publicação/CI/deploy não executados.
Revisão final acrescentou guardas de origem também nos callbacks de endereço
salvo/consulta e ajustou apenas indentação em cadastro/catálogo. Build final
passou com 67 módulos; percurso sintético terminou em confirmação/detalhe
renderizados. Servidor temporário encerrado depois das capturas; serviços
locais preexistentes não foram encerrados por esta unidade.
Relatório geral/arquitetura de entrega anteriores preservados nesta unidade;
alinhamento final desses documentos depende da autorização de escopo indicada
no plano, sem sobrescrever sua revisão local. Documentos da unidade e índices
registram o estado atual da feature.

## Revisão solicitada após validação manual — 2026-10-13

Usuário: “Validei, não encontrei nada”, seguido de pedido de análise de
brechas/falhas. Manual confirmado sem inferir criação de pedido real.
[Revisão detalhada](revisao.md): REV-01/02 no tratamento de respostas,
REV-03 na serialização global (diverge da fila por carrinho prevista em T4),
REV-04 na persistência de número ERP conhecido. AC-06/11 reabertos e T4 com
pendência de fila/ocupação por ID. Checkboxes de execução anteriores são
históricos e não significam que esses achados estejam corrigidos.

Reexecutados backend 114/114 e frontend 81/81; scripts transitórios reproduziram
as quatro causas com API simulada/SQLite isolado. Sem código/testes alterados,
build novo ou publicação. Próxima etapa: preparar revisão de spec/plano para
as correções e obter aprovação explícita; implementação não autorizada pelo
pedido de revisão.

## Revisão v2 — Plano TDD dos achados posteriores

Preparado em 2026-10-13 após pedido “arrume o que voce encontrou usando TDD”.
Esta seção substitui os próximos passos da revisão anterior, sem reexecutar
as tarefas históricas da v1. Skills brainstorming/writing-plans aplicadas;
local e modelo SDD do repositório prevalecem sobre defaults das skills.
Execução nesta mesma sessão/checkout após aprovação, sem subagentes, commit
ou publicação. Não exige skills de execução ausentes como bloqueio adicional.

### Arquivos e restrições

| Arquivo | Mudança limitada |
|---|---|
| frontend/tests/multiplos-carrinhos.test.js | Regressões de listas, versões e concorrência por ID |
| frontend/tests/carrinho-por-sessao.test.js | Acrescentar prova de invalidação da fila por sessão, se não coberta |
| frontend/src/lib/carrinhoPorSessao.js | Sequências, validação de snapshot, filas e ocupação por carrinho |
| frontend/src/contextos/CarrinhoContext.jsx | Publicar `gerindo` com os demais campos do snapshot |
| frontend/src/componentes/GerenciadorCarrinhos.jsx | Seletor disponível durante mutação de itens; bloqueio na gestão |
| backend/tests/checkout-carrinhos.test.js | Resposta parcial, número inválido, falha ao persistir e proteção contra reenvio |
| backend/src/erp/cliente.js | Transportar número válido no erro interno de resposta parcial |
| backend/src/services/pedidoService.js | Persistir número recebido mesmo em caminho incerto |
| docs/sdd/multiplos-carrinhos/spec.md, plan.md, revisao.md, recuperacao.md | Estado/evidências e interpretação operacional de número conhecido |
| fix.md, docs/investigacao.md, docs/sdd/README.md | Situação atual e próximos passos |

Sem schema, dependências, troca de stack, timeout HTTP, refatoração geral ou
contrato público novo. Respeitar todos os limites globais da v1. Não escrever
testes da implementação: asserções devem observar ID, versão, itens, chamadas
API, ocupação, tentativa persistida e ausência de POST/vínculo extra.

### Tarefa R1 — Listas anteriores não substituem seleção/coleção novas

**Requisitos:** REV-REQ-01; REV-AC-01/05; AC-06 original.
**Interface:** `recarregar()/selecionar()/criar()` e `obterSnapshot()` existentes.

- [x] RED: adicionar dois testes ao arquivo frontend de múltiplos carrinhos.
  Usar fixture `montar()` existente e promessa com resolver/rejeitar. Ordem
  exata e asserções centrais:

```js
const antiga = c.recarregar(); // api.listar retida
await c.selecionar(2);
rejeitarLista(new Error('falha anterior'));
await antiga;
assert.equal(c.obterSnapshot().ativoId, 2);
assert.equal(c.obterSnapshot().carrinho.id, 2);
assert.equal(c.obterSnapshot().erro, null);
```

```js
const antiga = c.recarregar(); // lista [1,2] retida
await c.criar('Novo'); // fake criar responde {dados:{id:3,nome:'Novo'}}
resolverLista({dados:{carrinhos:[{id:1},{id:2}],principal_id:1}});
await antiga;
assert.equal(c.obterSnapshot().ativoId, 3);
assert.ok(c.obterSnapshot().carrinhos.some(i => i.id === 3));
assert.equal(c.obterSnapshot().aviso, null);
```

- [x] Rodar na pasta frontend `node --test --test-name-pattern='REV-01' tests/multiplos-carrinhos.test.js`;
  nomes dos novos testes devem conter REV-01. Registrar falhas nas asserções
  sobre carrinho/erro/seleção e conferir que fixture/imports funcionam.
- [x] GREEN: invalidar lista na mudança de seleção, início e conclusão de
  gestão; capturar origem/geração da coleção para listagens. Publicar erro
  somente se a mesma origem continua atual. Invalidar respostas superadas
  sem apagar a seleção ou aplicar fallback a coleção antiga.
- [x] Rodar os novos testes e o arquivo inteiro; preservar testes existentes
  de boot/principal, troca A→B→A e exclusão externa real. Acrescentar cenário
  de erro atual e recarga se os testes de sessão não demonstrarem esse fluxo.
- [x] REFACTOR: remover duplicação de guardas apenas se os testes passam;
  reexecutar arquivos de múltiplos carrinhos e sessão, registrar resultados.

### Tarefa R2 — Escrita tardia não regride versão

**Requisitos:** REV-REQ-02; REV-AC-02/05; AC-06 original.
**Interface:** resposta `{dados:{id,versao,...}}` da API existente.

- [x] RED: teste REV-02 com `api.alterar` retida após pré-leitura. Aguardar
  sinal explícito de entrada na API, aceitar recarga v3/quantidade7, liberar
  mutação v2/quantidade2. Asserções após aguardar ambas:

```js
assert.equal(c.obterSnapshot().carrinho.versao, 3);
assert.equal(c.obterSnapshot().carrinho.itens[0].quantidade, 7);
```

- [x] Rodar frontend `node --test --test-name-pattern='REV-02' tests/multiplos-carrinhos.test.js`;
  registrar RED com observado v2/quantidade2.
- [x] GREEN: comparar ID/versão antes de publicar resposta da mutação. Não
  incrementar sequência de forma a invalidar leitura mais nova aceita.
  Preservar retorno de operação concluída e guarda de origem; snapshot antigo
  pode ser descartado sem declarar falha de uma gravação já feita.
- [x] Adicionar e rodar testes que rejeitem resposta com ID diverso e aceitem
  resposta atual válida; definir erro sintético para resposta incoerente sem
  publicar seu conteúdo. Rodar arquivos de seleção/sessão.
- [x] REFACTOR: compartilhar validação de snapshot somente se simplificar
  leitura/escrita sem confundir sequências; repetir testes focados.

### Tarefa R3 — Fila e ocupação independentes por ID

**Requisitos:** REV-REQ-03; REV-AC-03/05; T4 original.
**Interface:** API pública do controlador mantida; snapshot ganha `gerindo`
booleano, `ocupado` continua booleano para ativo/gestão. Contexto já espalha
snapshot; conferir consumidores em vez de duplicar estado.

- [x] RED: API de adição A retida, selecionar B, iniciar adição B. Aguardar
  marco de uma volta do event loop (`setImmediate`) sem sleeps; afirmar que
  a chamada de B já ocorreu antes de liberar A. Liberar promessas em finally
  para não deixar teste pendurado se a asserção falhar.

```js
assert.deepEqual(chamadas.map(i => i.id), [1, 2]);
assert.equal(c.obterSnapshot().ativoId, 2);
assert.equal(c.obterSnapshot().ocupado, true); // B ainda retida
```

- [x] Rodar frontend `node --test --test-name-pattern='REV-03' tests/multiplos-carrinhos.test.js`;
  registrar RED com somente chamada A.
- [x] GREEN: substituir promessa global por `Map<id,Promise>` e contadores
  por ID/ciclo; incrementar ocupação ao enfileirar e decrementar no finally
  mesmo após mudar seleção, sem publicar dados de origem antiga. Derivar
  ocupado a partir do ativo e da gestão. Limpar entradas finalizadas e Maps
  na invalidação/ativação; uma finalização antiga não altera mapas novos.
- [x] Separar ocupação da gestão global em `gerindo`; garantir finally após
  recarga aguardada. No seletor, usar gestão como bloqueio, mantendo controles
  de itens sujeitos à ocupação do carrinho exibido. Não alterar URL/rolagem.
- [x] Testar B terminando antes de A, voltar a A ainda ocupada, finally de A
  enquanto B pendente, serialização de duas mutações na mesma origem, operação
  ainda na fila cancelada após troca e logout com respostas pendentes.
- [x] REFACTOR: revisar contadores/limpeza e executar ambos os arquivos frontend.
  Inspecionar GerenciadorCarrinhos, AdicionarAoCarrinho, ConteudoCarrinho e
  Checkout para confirmar significado compatível do booleano `ocupado`.

### Tarefa R4 — Preservar referência ERP em resposta parcial

**Requisitos:** REV-REQ-04/05; REV-AC-04/05; AC-11 original.
**Interface produzida:** `ApiError.numeroErp` interno opcional; status/código
e envelope externo existentes. Número persistido usa função existente
`registrarNumeroErp(usuarioId,tentativaId,numero,db)`.

- [x] RED: no backend, adicionar teste REV-04 reutilizando `inicio` de
  checkout-carrinhos; ERP fake retorna número sintético e total null.

```js
respostaPost = async () => Response.json({dados:{numero:'PED-PARCIAL',valor_total:null}});
await assert.rejects(finalizarPedido(u,dados,db), e => e.codigo === 'CHECKOUT_INCERTO');
assert.equal(checkout.lerEstadoCheckout(1,a.id,db).numero_erp, 'PED-PARCIAL');
assert.equal(checkout.lerEstadoCheckout(1,a.id,db).estado, 'incerto');
assert.equal(db.prepare('SELECT COUNT(*) n FROM pedidos_usuario').get().n, 0);
assert.equal((await itens.lerCarrinho(1,a.id,db)).quantidade_pecas, 3);
await assert.rejects(finalizarPedido(u,dados,db), e => e.codigo === 'CHECKOUT_INCERTO');
assert.equal(posts.length, 1);
```

- [x] Rodar backend `node --test --test-name-pattern='REV-04' tests/checkout-carrinhos.test.js`;
  registrar RED com número null, mantendo setup/rede falsos corretos.
- [x] GREEN: separar reconhecimento de número e validação de total no cliente
  ERP; anexar referência utilizável ao ApiError parcial. No serviço, persistir
  referência antes de marcar incerta; se gravação falha, manter estado
  bloqueante e erro incerto. Não completar pedido nem reutilizar total enviado
  pelo navegador. Não expor corpo ERP no erro HTTP ou logs.
- [x] Testar total ausente/negativo, número string/número finito, número
  vazio/não utilizável e falha sintética em UPDATE de numero_erp por trigger.
  Asserções: itens/vínculos/POST, proteção após reabertura quando aplicável;
  consulta de outra conta continua 404. Não acrescentar regras de formato do
  SIAC além do contrato definido na spec v2.
- [x] REFACTOR: revisar caminho válido, recusa conclusiva e falha local;
  rodar arquivo checkout-carrinhos e pedido-dinheiro existentes.

### Tarefa R5 — Regressões, interface e registros

- [x] `npm test` em backend e frontend. Resultado esperado: todos os testes
  anteriores e novos passam; registrar quantidades efetivamente observadas.
- [x] `npm run build` no frontend; `git diff --check` na raiz. Rodar sintaxe
  nos arquivos JS alterados; não declarar resultados antes da execução.
- [x] Servidor transitório com SQLite/fetch fake e frontend real: reter resposta
  de itens A, trocar para B e adicionar; conferir B antes de liberar A, voltar
  a A e conferir ocupado, liberar sem corromper B. Conferir seleção em desktop
  e mobile, URL/busca/página/rolagem preservadas. Encerrar somente servidor
  criado para esse ensaio. Sem checkout de escrita no SIAC real.
- [x] Atualizar evidências RED/GREEN por tarefa, checkboxes REV-AC e status
  dos quatro achados; recuperação explica número conhecido com total inválido.
  Conferir docs/links e preservar arquivos gerados/preexistentes sem stage.

### Matriz da revisão e migração

| Aceite | Tarefa/prova | Esperado | Observado |
|---|---|---|---|
| REV-AC-01 | R1, promessas de lista controladas | Seleção nova preservada; exclusão real detectada | Passou; dois novos casos e regressões de boot/erro atual/exclusão |
| REV-AC-02 | R2, mutação v2/leitura v3 | Snapshot não regride; ID incoerente rejeitado | Passou; quatro casos, incluindo leitura ainda pendente |
| REV-AC-03 | R3/R5, filas e seletor real | B opera antes de A concluir; ocupação por ID | Passou; sete casos e navegador desktop/mobile com resposta retida |
| REV-AC-04 | R4, serviço/fake/SQLite | Número preservado; bloqueio/itens, um POST | Passou; nove casos e regressões de checkout/dinheiro |
| REV-AC-05 | R1–R5, RED/GREEN e regressões | Evidência por causa, suítes/build/diff passam | Passou; RED/GREEN abaixo, backend 123/123, frontend 94/94, build 67 módulos |

Migração não se aplica: modelo persistente já suporta numero_erp e não será
alterado. Não reconciliar tentativas antigas nem mudar seu estado em dados
reais como parte desta correção. Falha de gravação continua recuperável pelo
procedimento operacional existente e evidência do responsável pelo ERP.

### Autorrevisão da proposta

REV-REQ-01→R1; 02→R2; 03→R3; 04/05→R4; regressões/entrega→R5. Casos e nomes
de campos compatíveis com consumidores existentes; somente `gerindo` e o
atributo interno `numeroErp` são adicionados. Esta conferência foi feita antes
da implementação; aprovação e execução efetivas registradas abaixo.

### Execução TDD da revisão v2 — 2026-10-13

Usuário “aprovado” após links da spec/plano v2 e pergunta explícita para
implementar. Mesma branch/checkout com alterações anteriores preservadas.

| Grupo | Comando RED, na respectiva pasta | Observado antes da correção | GREEN após mudança |
|---|---|---|---|
| R1 | node --test --test-name-pattern=REV-01 tests/multiplos-carrinhos.test.js | 0/2: carrinho indefinido em B e ativo 1 em vez de 3 | Seleção/sessão 31/31 |
| R2 | node --test --test-name-pattern=REV-02 tests/multiplos-carrinhos.test.js | 1/4: versão 2 em vez de 3 em dois casos; ID incorreto aceito | Seleção/sessão 35/35 |
| R3 | node --test --test-name-pattern=REV-03 tests/multiplos-carrinhos.test.js | 3/7: chamada B não ocorre, retorno a A livre, gerindo ausente | Seleção/sessão 42/42 |
| R4 | node --test --test-name-pattern=REV-04 tests/checkout-carrinhos.test.js | 5/9: número null em três respostas parciais e na reabertura | Checkout/dinheiro 20/20 |

Falhas RED vieram de asserções comportamentais, sem erro de importação/setup.
Treze regressões frontend e nove backend novas. Assert de array em R3 mostra
diff sem B no momento da falha, embora o runner possa renderizar a referência
já modificada pelo cleanup; finally libera promessas para não deixar pendências.

Mudanças: sequência da lista invalidada na seleção/início/conclusão de gestão;
validação compartilhada de snapshot para leitura/escrita e invalidação somente
de leituras anteriores ao envio; filas/contadores por ID e ciclo; gerindo global
aguarda recarga, contexto já publica via spread (sem edição desnecessária).
Seletor usa gerindo, outros consumidores continuam usando ocupado do ativo.
Cliente ERP transporta numeroErp válido em erro interno; serviço tenta registrar
antes de marcar incerta, preservando bloqueio se banco falha. Envelope de erro
conferido por inspeção; nenhum dado bruto ERP foi adicionado ao HTTP/logs.

Após GREEN, revisão de refatoração manteve a guarda compartilhada de snapshot
e derivação central de ocupado, sem exigir reestruturação adicional. Sem
módulo/dependência/schema novos. Regressões rodadas após mudanças, sem
repetir suíte completa após apenas documentação. Resultado final: backend
123/123, frontend 94/94, build 67 módulos; sintaxe dos três JS e diff passaram.

Ensaio de UI: servidor transitório em 127.0.0.1:3209, Express/React reais,
SQLite exclusivo em /private/tmp e fetch ERP.invalid simulado. Resposta de
POST de itens Gol (ID 1/PECA-25) retida depois da gravação; Civic (ID 3/PECA-26)
recebeu uma unidade antes da liberação. Voltar ao Gol mantém itens bloqueados
e seletor habilitado. URL ?busca=a&pagina=2 preservada, scroll desktop 395,5
antes/depois da troca. Em 390×844, dialog permite selecionar Civic com Gol
pendente; após liberar Gol, Civic continua com uma peça e controles habilitados.
Conferência readonly no banco sintético: uma peça distinta em cada carrinho,
zero pedidos. Capturas: /private/tmp/kaizen-revisao-v2-desktop.jpg e
/private/tmp/kaizen-revisao-v2-mobile.jpg. Viewport restaurado e aba encerrada.

Primeira tentativa de servidor dentro do sandbox não ficou acessível ao
navegador (conexão recusada); reiniciado fora dele com a mesma configuração
sintética após permissão da ferramenta. HTTP 200 confirmado antes do ensaio.
Somente servidor temporário criado para este teste foi encerrado.
Não houve pedido real, alteração do banco local, publicação, CI remoto ou deploy.
Validação manual anterior do usuário refere-se à v1; não foi inventada
confirmação humana adicional para a v2. Limites distribuídos de SIAC mantidos.

### Preparação do PR autorizada — 2026-10-13

Usuário solicitou abrir PR detalhado da nova feature e enviar o link. Confirmado
origin eduardofrois/kaizen-test e base main; HEAD f95ae66 já alcançável por
origin/main, sem diferença de árvore. Nenhum PR anterior desta branch na consulta.
Stage explícito de 45 arquivos: código/testes/unidade e somente trechos da
feature em fix.md e índices. Revisão documental geral anterior preservada no
checkout, fora do index; frontend/.vite, banco, ambiente e build excluídos.

Conferidos conteúdo completo do index, links locais, diff e 378 blobs únicos
do histórico alcançável. Sem coincidências com valores de segredos locais
ou padrões de credenciais verificados; não é garantia exaustiva de ausência
de todo tipo de segredo. Código/testes são os mesmos que passaram 123/94 e
build; sem nova execução funcional nesta preparação documental.
Commit/push/PR serão registrados após execução; merge manual pelo usuário.

### Publicação do PR — 2026-10-13

Commit `2f9ff7a` criado e enviado na branch `feat/multiplos-carrinhos` ao
repositório autorizado eduardofrois/kaizen-test. [PR #17](https://github.com/eduardofrois/kaizen-test/pull/17)
aberto contra main, regular, com regras/justificativas, implementação, migração,
contratos, checkout/recuperação, quatro correções TDD, evidências e roteiro
manual. PR anexado a esta conversa pela ferramenta do aplicativo.

Consulta remota confirmou OPEN/MERGEABLE e dois checks SUCCESS para a
implementação: testes-backend e build-frontend no
[run 38360777053](https://github.com/eduardofrois/kaizen-test/actions/runs/38360777053).
Esta atualização documental acompanha a publicação sem alterar código/testes;
seu commit gera nova execução de CI. Demais alterações documentais locais
e frontend/.vite preservados fora do envio. Nenhum merge/deploy realizado.
