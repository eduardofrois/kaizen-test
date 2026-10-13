# Mapa do código e da arquitetura atual

Atualizado em 2026-10-13. Referência: main, com múltiplos carrinhos v2
integrados. O contexto da baseline original está no
[histórico da investigação](../historico/fix.md).
[ARQUITETURA.md](../../ARQUITETURA.md) documenta os contratos e regras atuais.

## Camadas e pontos de entrada

```text
React → /api → Express → serviços → SQLite da loja
                          └──────→ erp/cliente.js → SIAC externo
```

Frontend em JavaScript/JSX, React 19, React Router 7, Vite 7 e Tailwind 4.
Backend Node/Express 5 em JavaScript ESM, com better-sqlite3.
Versões exatas resolvidas nos dois package-lock.json; Node 24.14.1 usado na CI
e na última verificação local.

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Inicialização | backend/src/server.js, config.js | Validar configuração, aplicar schema, abrir HTTP e encerrar |
| HTTP | backend/src/app.js, routes/ | Cookies, CORS, validação, status e serialização |
| Sessão | middleware/autenticacao.js, services/usuarioService.js, lib/senha.js | JWT em cookie, conta e scrypt |
| Erros | lib/ApiError.js, lib/validacao.js, middleware/erros.js | Validação acumulada e envelope de erro |
| ERP | backend/src/erp/cliente.js | Único acesso a catálogo, produtos, imagens, pedidos e health |
| Persistência | backend/src/db/index.js, schema.sql, migracoes.js | SQLite, modelo atual e conversão legada |
| Gestão | services/carrinhosService.js | Posse, nomes, principal, limites e exclusão |
| Itens | services/carrinhoService.js | Estoque, enriquecimento, quantidades e totais por carrinho |
| Checkout | services/pedidoService.js, checkoutService.js | Orquestração ERP, tentativas e conclusão local |
| Navegação | frontend/src/main.jsx, App.jsx | Providers, BrowserRouter e telas |
| HTTP frontend | frontend/src/api/cliente.js | Caminhos relativos, cookies e ErroApi |
| Estado | contextos/CarrinhoContext.jsx, lib/carrinhoPorSessao.js | Sessão, seleção por aba, filas e respostas |
| Vitrine | componentes/PainelCarrinho.jsx, GerenciadorCarrinhos.jsx, ConteudoCarrinho.jsx, AdicionarAoCarrinho.jsx | Gestão e edição sem sair do catálogo |

## Persistência e migração

| Tabela | Conteúdo |
|---|---|
| usuarios | Identidade, contato e hash de senha |
| enderecos | Endereços por usuário |
| carrinhos | Proprietário, nome, principal, versão e datas |
| carrinho_itens | Carrinho, código ERP e quantidade; UNIQUE(carrinho_id, codigo_produto) |
| checkout_tentativas | Identidade por usuário, origem, versão, assinatura da requisição, snapshot de endereço, estado e número ERP conhecido |
| pedidos_usuario | Vínculo ERP/usuário, snapshot de endereço e total em centavos |

WAL, foreign keys e busy timeout são configurados na conexão. A migração
transacional converte itens por usuário para itens por carrinho, preserva IDs,
quantidades e datas e cria um principal por conta, inclusive vazia.
`PRAGMA user_version=1` identifica o modelo suportado; versão superior aborta.
Reexecução não duplica itens. Cadastro cria conta e primeiro carrinho na mesma
transação. Roteiro: [migração e recuperação](../sdd/multiplos-carrinhos/recuperacao.md).

## Fluxos atuais

**Sessão:** AuthContext consulta /auth/eu no boot. O controlador do carrinho
é associado à identidade autenticada; logout e troca de conta invalidam
operações antigas. Visitante não consulta a API privada de carrinhos.

**Catálogo:** busca, categoria, disponibilidade e página vivem na URL.
Mudança de filtros reinicia a página. Trocar carrinho não remonta os resultados.

**Carrinhos:** principal persistido no servidor; ativo pertence à aba/ciclo
autenticado. Boot e F5 selecionam o principal. Ações usam ID explícito e
verificam posse no backend. Limites: dez carrinhos, 50 produtos distintos e
99 unidades por produto em cada um. Preço/estoque/descrição são lidos no ERP.

**Assíncrono:** ciclo, geração de seleção e sequências descartam respostas
superadas. Leituras e mutações validam ID/versão; filas e ocupação são por
carrinho. Gestão da coleção tem ocupação própria. Ao recuperar foco ou antes
de mutar, os metadados são revalidados; ativo excluído recebe substituto.

**Checkout:** ID, versão, tentativa, endereço selecionado e observação
identificam a confirmação. Antes do POST ERP, a loja registra tentativa e
bloqueio exclusivo persistente. Mutações revalidam o bloqueio após awaits.
Sucesso salva vínculo, limpa só a origem, incrementa versão e conclui tentativa
na mesma transação local. Nome, ID e outros carrinhos são preservados.

**Recuperação:** mesma tentativa concluída retorna vínculo sem novo POST.
Recusa conclusiva preserva itens e libera edição; falha incerta conserva
bloqueio. Número conhecido de resposta parcial é persistido quando possível.
F5/reinício não liberam nem reenviam automaticamente. Não há atomicidade
distribuída ou garantia de idempotência remota. O bloqueio protege processos
que compartilham o mesmo SQLite.

**Pedidos:** listagem consulta vínculos próprios e busca status por pedido no
ERP. Detalhe verifica posse antes da chamada externa. Snapshot de endereço
não muda com edições posteriores do cadastro.

## Execução, testes e limites

Vite :5173 encaminha /api para backend :3001. Em production, o backend serve
frontend/dist; cookie Secure exige HTTPS no navegador. Não há env de API/ERP
no frontend. Health local pode responder 200 com ERP indisponível no corpo.
CORS permite somente a origem configurada; produção sem origem não autoriza
leitura entre origens. CORS não substitui sessão, posse ou proteção CSRF.

Reavaliação local de 2026-10-13: backend 123/123, frontend 94/94 e build de
67 módulos passaram. ERP simulado e SQLite isolado; não é homologação SIAC.
Ensaios visuais da feature: [evidências](../sdd/multiplos-carrinhos/validacao-visual.md).
Não há suíte E2E completa nem auditoria atual integral de contraste.

INV-001/002 foram mitigados pelo checkout persistente; recuperação de resultado
remoto incerto continua operacional. INV-003 (principal de endereço),
INV-004 (erro em pedidos) e INV-005 (texto da busca/histórico) permanecem
abertos, com grau de evidência no [inventário](../../fix.md).
Execução local confirmada; deploy público não registrado.
