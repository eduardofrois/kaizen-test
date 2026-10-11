# Guia da arquitetura real

Baseline inspecionada em 2026-10-11: commit original `81897d5`.
Este guia complementa `ARQUITETURA.md`; o documento original descreve a
intenção, enquanto este registra também divergências da implementação.

## Fluxo e responsabilidades

```text
React → /api → Express → serviços → SQLite da loja
                          └──────→ erp/cliente.js → SIAC externo
```

- Frontend: React 19, React Router 7, Vite 7 e Tailwind 4; JavaScript/JSX.
- Backend: Node, Express 5 e JavaScript ESM.
- Persistência: `better-sqlite3`; WAL, foreign keys e busy timeout habilitados.
- Integração: `fetch`, `X-API-Token` e timeout no processo do backend.
- A lista exata de versões resolvidas fica nos dois `package-lock.json`.

## Pontos de entrada

| Área | Arquivos | Responsabilidade |
|---|---|---|
| Bootstrap | `backend/src/server.js`, `config.js` | Validar env, abrir banco, aplicar schema, ouvir HTTP e encerrar |
| HTTP | `backend/src/app.js`, `routes/` | Montagem dos routers, corpo JSON, cookies, CORS e frontend de produção |
| Sessão | `middleware/autenticacao.js`, `services/usuarioService.js`, `lib/senha.js` | JWT em cookie httpOnly, usuário atual e scrypt |
| Erros | `lib/ApiError.js`, `lib/validacao.js`, `middleware/erros.js` | Validação acumulada e envelope HTTP |
| ERP | `backend/src/erp/cliente.js` | Catálogo, produtos, categorias, imagens, pedidos e health |
| Banco | `backend/src/db/index.js`, `schema.sql` | Conexão singleton e DDL inicial |
| Frontend | `frontend/src/main.jsx`, `App.jsx` | Providers, BrowserRouter e telas |
| Cliente HTTP | `frontend/src/api/cliente.js` | Caminhos relativos, cookies e ErroApi |
| Estado | `frontend/src/contextos/` | Sessão e representação do carrinho |
| Interface | `frontend/src/componentes/`, `paginas/`, `index.css` | Componentes compartilhados, telas e tokens |

## Dados locais

| Tabela | Conteúdo e restrições |
|---|---|
| `usuarios` | Identidade da conta, email único, senha_hash e contato |
| `enderecos` | Pertencem a usuário; principal booleano; exclusão em cascata |
| `carrinho_itens` | Código, quantidade e usuário; UNIQUE(usuario_id, codigo_produto) |
| `pedidos_usuario` | Número ERP único, proprietário, snapshot de endereço e total local em centavos |

O banco original foi consultado em modo somente leitura/imutável: integrity
check `ok`; quatro tabelas vazias. Não há dados de catálogo locais.
Não existe tabela de carrinhos nem infraestrutura de migrações versionadas.
`aplicarSchema()` executa DDL com `CREATE TABLE IF NOT EXISTS` no bootstrap.

## Fluxos principais

**Autenticação:** cadastro/login → hash/verificação → JWT → cookie
`kaizen_sessao` com httpOnly, SameSite=Lax e Secure em produção. Rotas privadas
verificam assinatura e existência do usuário. `/auth/eu` alimenta AuthContext.

**Catálogo:** parâmetros da URL → cliente frontend → router catálogo → SIAC.
O router força produtos ativos e reescreve imagens para o proxy da loja.

**Carrinho:** consulta linhas do usuário → busca produto por linha no SIAC →
calcula disponibilidade, contadores e valores. Alterações validam estoque
contra o ERP. Limites atuais: 50 produtos distintos e 99 unidades por produto.

**Checkout:** valida endereço do usuário → lê carrinho → bloqueia pendências →
cria pedido no ERP → transação local grava vínculo/snapshot e limpa carrinho.
O endereço também é enviado ao ERP na observação, limitada a 500 caracteres.
Não existe transação distribuída, proteção local contra duplicidade ou snapshot
versionado do carrinho em andamento.

**Pedidos:** listagem filtra vínculos do usuário e consulta status no ERP;
detalhe verifica posse antes de buscar no ERP.

## Execução e origem

- Desenvolvimento: Vite :5173 faz proxy de `/api` para backend :3001.
- Produção: backend serve `frontend/dist` e fallback de rotas React.
- API/HTML ficam na mesma origem no caminho previsto. O frontend não precisa
  de env com host da API ou credencial ERP.
- `/api/health` consulta banco e health do ERP; o HTTP local permanece 200 se
  a consulta ao banco funcionar, mesmo com estado ERP indisponível no corpo.

## Divergências observadas

- FIX-001 corrigido em 2026-10-11: env explícita para JWT/ERP, sem fallback
  secreto. Seis regressões em backend/tests/config.test.js; integração pendente.
- CORS reflete qualquer origem e ignora a origem configurada: FIX-002.
- Comentário de `main.jsx` diz que carrinho depende da sessão; o provider não
  observa AuthContext: FIX-005.
- Conversão monetária perde centavos: FIX-003.
- Busca/filtros preservam página incompatível: KZN-325.
- Documentação cita alertas vermelhos no tom 700, mas há usos de red-600.
  Uma auditoria visual atual ainda não foi feita.
- README menciona SIAC_URL; implementação lê ERP_URL.
- Build frontend e banco estavam versionados. A estrutura nova ignora esses
  artefatos; a publicação da aplicação precisa de revisão própria.

## Evolução ainda não aprovada

Múltiplos carrinhos exigirá entidade própria, migração de itens, contrato HTTP
com IDs, persistência da seleção, isolamento e checkout de um carrinho. Limite
de dez carrinhos, painel lateral e regras de exclusão são propostas iniciais,
não decisões implementadas. As propostas abaixo devem passar pelo ciclo SDD.

## Propostas para MULTI-001 — ainda não aprovadas

As escolhas desta seção seguem em proposta. O preenchimento aprovado do
relatório mantém essas decisões de produto como pendentes.

| Pergunta | Proposta inicial | Justificativa a revisar |
|---|---|---|
| Limite | 10 carrinhos por usuário | Limite previsível; valor é escolha de produto |
| Excluir ativo | Selecionar outro; último excluído gera padrão vazio | Evitar estado sem destino para adicionar peças |
| Vitrine desktop | Painel lateral | Editar carrinho sem abandonar resultado da busca |
| Celular | Painel recolhível | Preservar espaço para catálogo e acesso às ações |
| Entrada na loja | Último carrinho ativo persistido | Retomar orçamento de onde parou |
| Após checkout | Manter carrinho e nome; retirar conteúdo comprado | Reutilizar organização e preservar demais carrinhos |

Direção técnica proposta: entidade carrinhos; itens por carrinho; seleção
persistida no servidor; IDs explícitos nas operações; posse verificada em
todas as rotas; migração preservando itens existentes. Regras para alterações
concorrentes, duplicidade e múltiplas abas precisam entrar na spec.
