# Ambiente e execução

## Situação verificada

Em 2026-10-11: Node local v24.14.1 e npm 11.11.0. `npm ci` instalou as dependências do backend (120 pacotes; auditoria: zero
vulnerabilidades). backend/.env criado com permissão 0600 e depois preenchido pelo candidato.
Execução local confirmada pelo candidato: catálogo, login, sessão após refresh,
logout e rejeição de JWT_SEGREDO vazio. Build novo e deploy não executados.
Os comandos abaixo são um procedimento previsto; sua execução deve ser
registrada posteriormente com resultados reais.

O backend declara Node >=20; Vite/@vitejs/plugin-react resolvidos nos lockfiles
exigem ^20.19.0 ou >=22.12.0. Usar a versão local já identificada para a
primeira validação e registrar eventual ajuste. Instalar pelos lockfiles.

## Variáveis do backend

`backend/.env` já foi criado por solicitação do usuário. O candidato confirmou o preenchimento de
JWT_SEGREDO, ERP_URL e ERP_TOKEN e a execução local. Esses campos são
obrigatórios e sua ausência impede inicialização. Para JWT, execute `npm run segredo:gerar` em backend/ e
copie o resultado somente para seu ambiente local. Os demais campos já têm
padrões de desenvolvimento. Não substitua um .env existente ao retomar. Executar o backend a
partir de backend/, pois dotenv carrega .env do diretório de trabalho.

| Variável | Papel |
|---|---|
| PORT | Porta HTTP; padrão 3001 |
| HOST | Interface de escuta |
| NODE_ENV | development, test ou production; influencia cookie e logs |
| JWT_SEGREDO | Assinatura da sessão; pelo menos 32 caracteres, aleatório |
| JWT_EXPIRACAO | Validade JWT; padrão 7d |
| DB_PATH | SQLite; relativo é resolvido a partir de backend/ |
| ERP_URL | Base HTTP(S) do SIAC; sem acrescentar /produtos ou /pedidos |
| ERP_TOKEN | Credencial de integração; somente backend |
| ERP_TIMEOUT_MS | Tempo limite da integração; padrão 8000 |
| CORS_ORIGEM | Origem prevista do frontend; ignorada pela baseline, ver FIX-002 |

README e implementação usam ERP_URL. Não criar env no
frontend com token ERP. Não publicar os valores nem copiar .env para docs.
FIX-001 corrigido: não há fallback secreto e exemplos são rejeitados.

## Desenvolvimento previsto

Terminal do backend, a partir da raiz:

```sh
cd backend
npm ci
npm run dev
```

Terminal separado do frontend, a partir da raiz:

```sh
cd frontend
npm ci
npm run dev
```

Frontend esperado em http://localhost:5173, proxy para backend :3001.
Se mudar PORT, revisar o target fixo do vite.config.js por SDD.
O bootstrap já aplica o schema; não é necessário resetar o banco para subir.

## Produção prevista

```sh
cd frontend
npm ci
npm run build
```

Depois, no backend com NODE_ENV=production no ambiente de execução:

```sh
cd backend
npm ci --omit=dev
npm start
```

Esses blocos partem da raiz em terminais separados. O backend serve o dist
somente em produção. O build distribuído no checkout original não substitui
um build da versão entregue. A topologia de deploy/HTTPS ainda será definida.
Cookie Secure requer que o navegador acesse a aplicação por HTTPS em produção.

## Diagnóstico previsto

- Consultar /api/health da loja e /health da base ERP; não presumir que health
  público valida ERP_TOKEN, pois esse endpoint não exige token.
- Validar credencial por leitura autenticada de catálogo, sem criar pedido.
- Correlacionar falhas por request_id sem registrar credenciais.
- Verificar se o erro é configuração, rede, autenticação ERP ou regra de estoque.
- Não executar db:reset para resolver problemas de schema: apaga dados.

## Arquivos gerados e validações futuras

`.env`, node_modules, dist, SQLite e WAL/SHM ficam fora do Git pela nova regra.
Arquivo já rastreado exige tratamento explícito no índice; ignore não remove
histórico. A suíte aprovada executa com
`cd backend` e `npm test` (seis testes passaram).
A sintaxe foi validada com `node --check backend/src/config.js` na raiz.
Testes usam subprocessos e variáveis sintéticas sem ERP/banco/.env real.
Cada spec aprovada deve definir
seus comandos de validação e usar banco/ERP isolados quando necessário.

## Instalação local — 2026-10-11

Após o usuário informar que preencheu o .env, executado npm ci nos dois
projetos: backend 120 pacotes; frontend 82 pacotes. Ambas as auditorias
informaram zero vulnerabilidades nessa execução. Manifests e lockfiles
preservados. Servidores não foram iniciados nesta etapa; usar npm run dev
em cada diretório, em terminais separados, conforme os comandos acima.

### Confirmação manual da configuração — 2026-10-11

Evidência informada pelo candidato: login, catálogo, persistência da sessão
após atualizar a página e logout funcionaram localmente. Ao executar
`JWT_SEGREDO= npm start` em backend/, o processo encerrou com
`Configuracao invalida: JWT_SEGREDO nao definido. Rode: npm run segredo:gerar`.
Fail-fast manual confirmado, sem alterar .env. Os seis testes automatizados
já haviam passado. Não foi executado checkout real; este registro não
comprova os demais fluxos do sistema. Implementação registrada no commit c46e68e. Validação concluída para o
escopo aprovado; resultados consolidados neste commit documental complementar.
Nenhuma nova alteração de aplicação realizada; publicação remota pendente.

## Pipeline de validação — CI-001

Workflow .github/workflows/validacao.yml: PRs para main e pushes na main,
dois jobs independentes em ubuntu-24.04/Node 24.14.1, timeout de 10 minutos.
Instalação por npm ci e cache npm pelo lockfile de cada projeto. Permissões
contents: read, checkout sem persistir credenciais. Não configurar secrets.

Reproduzir em terminais separados (instalar com servidores parados):

```sh
cd backend
npm ci
npm test
```

```sh
cd frontend
npm ci
npm run build
```

npm test descobre backend/tests/*.test.js diretamente nessa pasta. Novas
suítes devem usar ERP/banco isolados. O build não testa interface ou checkout.
Validação desta unidade ocorreu em cópia temporária, preservando servidores,
.env e banco locais: seis testes passaram; build gerou dist/index.html.

Depois de observar sucesso real no PR, em Settings > Branches > regra main,
ativar Require status checks to pass before merging e selecionar os checks
`testes-backend` e `build-frontend` exibidos pelo GitHub. Caso nomes apareçam
com prefixo do workflow, conferir os jobs da execução antes de selecionar.
Não tornar obrigatório um nome que ainda não executou. Nenhuma alteração de
proteção feita automaticamente; merge manual pelo candidato. Confirmar
execução após merge na main antes de marcar AC-02 como concluído.

Validação remota confirmada em 2026-10-11 no PR #2: ambos os checks passaram
nos runs 38172181159 (opened) e 38172264955 (synchronize). Já podem ser
selecionados na proteção de main pelo candidato. Ainda é necessário observar
push/main após merge manual para concluir AC-02 da unidade SDD.
