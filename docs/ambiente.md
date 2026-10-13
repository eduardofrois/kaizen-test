# Ambiente e execução

Atualizado em 2026-10-13, referência main.
O [README](../README.md#como-rodar-o-projeto) contém a instalação passo a passo.
Backend e frontend têm package.json e lockfiles próprios. Node 24.14.1 é a
versão usada na CI e na última validação local; não há script único na raiz.

## Configuração do backend

Crie backend/.env a partir de .env.example somente se ainda não existir.
Execute comandos do backend dentro de backend/, pois dotenv lê o diretório
de trabalho. Nunca substitua um ambiente já preenchido ao retomar.

| Variável | Comportamento atual |
|---|---|
| PORT | Porta HTTP; padrão 3001 |
| HOST | Interface de escuta; padrão 0.0.0.0 |
| NODE_ENV | Padrão development; production ativa cookie Secure e build estático |
| JWT_SEGREDO | Obrigatório; mínimo 32 caracteres; gerar com npm run segredo:gerar |
| JWT_EXPIRACAO | Padrão 7d |
| DB_PATH | Padrão ./data/ecommerce.db; relativo é resolvido a partir de backend/ |
| ERP_URL | Obrigatória; base HTTP(S) do SIAC, sem acrescentar /produtos ou /pedidos |
| ERP_TOKEN | Obrigatório; credencial exclusivamente do backend |
| ERP_TIMEOUT_MS | Timeout ERP em milissegundos; padrão 8000 |
| CORS_ORIGEM | Origem HTTP(S) única e canônica; regras abaixo |

A configuração rejeita ausência dos três campos obrigatórios, placeholders,
JWT curto, URL inválida e origem CORS não canônica, sem imprimir os valores.
Não há fallback secreto. Nenhuma credencial deve ir para frontend, documentos
ou Git. Os exemplos versionados não servem como credenciais de execução.

## Desenvolvimento

Em dois terminais independentes, cada bloco partindo da raiz:

```sh
cd backend
npm ci
npm run dev
```

```sh
cd frontend
npm ci
npm run dev
```

O backend precisa estar configurado antes de iniciar.
Abra [http://localhost:5173](http://localhost:5173). O proxy de /api aponta
para localhost:3001; mudar PORT exige alinhar o target em vite.config.js.

O bootstrap cria o SQLite quando necessário e aplica o modelo/migração
antes de aceitar requisições. Não é necessário db:init nem db:reset para
instalar. A conversão legada preserva dados em transação; para um banco
existente, siga o [roteiro de backup e recuperação](sdd/multiplos-carrinhos/recuperacao.md)
antes de iniciar a versão nova. Esta instrução não confirma backup ou migração
do banco de uso local.

## Execução em produção

Cada bloco parte da raiz, em terminais separados:

```sh
cd frontend
npm ci
npm test
npm run build
```

```sh
cd backend
npm ci --omit=dev
NODE_ENV=production npm start
```

Configure JWT/ERP e persistência do SQLite no ambiente escolhido.
O backend serve frontend/dist junto da API. O navegador deve acessar via
HTTPS porque o cookie usa Secure em production. Estes são comandos de
execução, não evidência de implantação pública. Não há hospedagem, URL pública
ou deploy verificado registrado na entrega.

O enunciado menciona “colocar a aplicação no ar”, sem especificar hospedagem
pública ou domínio. A documentação registra a execução observada e não decide
por conta própria o significado adicional dessa expressão.

## Política de origem

Em development/test, CORS_ORIGEM ausente/vazia usa http://localhost:5173.
Em production, ausente/vazia não autoriza leitura entre origens. A origem
configurada deve ser canônica, sem caminho, barra final, lista ou credenciais.

No uso de mesma origem, remova o localhost copiado do exemplo em produção.
Origem desconhecida ou ausência de Origin não interrompe a rota: a resposta
fica sem headers de permissão CORS. Sessão e posse continuam obrigatórias.
CORS restringe leitura no navegador; não é firewall nem proteção CSRF completa.

## Diagnóstico seguro

```sh
curl http://localhost:3001/api/health
curl http://localhost:3001/api/catalogo
```

Confira o campo erp no health. O /health público do SIAC não valida ERP_TOKEN;
o catálogo exercita a leitura autenticada. Confirmar compra cria pedido no
ERP e não é necessário para diagnosticar instalação.

Use request_id para correlacionar erros sem expor cookies ou credenciais.
Não execute db:reset para corrigir schema. Pedido em verificação exige
consulta e evidência operacional; não há desbloqueio por prazo ou reenvio cego.

## Testes, build e CI

```sh
cd backend
npm test
```

Em outro terminal, partindo da raiz:

```sh
cd frontend
npm test
npm run build
```

Testes usam configuração sintética, ERP simulado e SQLite em memória ou
temporário. Não leem .env/banco de uso local nem criam pedidos no SIAC real.
Suítes HTTP abrem porta local efêmera; restrição de sandbox pode impedir
essa etapa sem indicar falha de negócio.

Workflow Validacao: PRs para main e pushes na main, dois jobs,
Ubuntu 24.04 e Node 24.14.1. Ambos instalam por npm ci; testes-backend
roda npm test e build-frontend roda npm test seguido de npm run build.
Não há credenciais reais no workflow. A configuração de proteção de branch
depende do repositório; sua aplicação não foi confirmada nesta revisão.

Última execução observada nesta conversa, em 2026-10-13: backend 123/123,
frontend 94/94 e build 67 módulos passaram. O build dessa reavaliação foi
direcionado a /private/tmp, preservando o dist local. Testes e build não
substituem interação de navegador; limites em [RELATORIO](../RELATORIO.md).

.env, dependências, dist, bancos e WAL/SHM são gerados e ignorados pelo Git.
A exclusão por ignore não remove arquivos já rastreados nem sanitiza histórico.
Decisões e evidências de configuração: [unidade SDD](sdd/configuracao-por-ambiente/spec.md).
