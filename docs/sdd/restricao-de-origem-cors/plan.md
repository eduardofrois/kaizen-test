# Plano de implementação — Restrição de origem CORS

**Versão:** 1
**Estado:** Validado — PR #15 aberto
**Spec:** [spec.md](spec.md), versão1 aprovada.
**Objetivo:** conceder CORS somente à origem configurada.
**Arquitetura:** callback de origem no middleware existente e validação fail-fast
na configuração; sem mudança nas rotas, serviços ou cookies.
**Stack:** JavaScript ESM, Express, cors, node:test e SQLite existentes.
**Aprovação da spec:** 2026-10-12; usuário “spec aprovada, pode fazer o plan”.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação do plano versão 1.
**Execução:** sequencial nesta sessão, sem subagentes.

## Restrições globais

REQ-01 a07: uma origem HTTP(S) canônica; comparação exata; dev/test padrão
http://localhost:5173; produção sem configuração não concede CORS. Origem
recusada segue fluxo normal sem headers de permissão, sem403 novo. Preservar
cookies, posse, envelope, proxy, métodos/headers do cors. Não tocar .env real,
ERP, banco real, frontend, dependências, schema, trust proxy ou política CSRF.
Nota KZN-2B9C preservada e citada no relatório. Nenhuma nova variável de ambiente.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | backend/src/config.js | Default por ambiente e validação da origem |
| Alterar | backend/src/app.js | Comparação exata e comentário coerente |
| Criar | backend/tests/cors-config.test.js | Configuração isolada por subprocesso |
| Criar | backend/tests/cors.test.js | Headers/preflight e autenticação HTTP |
| Alterar | backend/.env.example | Política CORS e exemplo canônico |
| Alterar | docs/ambiente.md | Default por ambiente, deploy e diagnóstico |
| Atualizar | spec.md, plan.md, fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Estado, aprovação e evidências |

## Tarefa1 — Configuração explícita

**Aceite:** AC-03. Interface preservada: config.corsOrigem string, validarConfig().
Sem origem em produção será string vazia, não null ou array.

- [x] Registrar aprovação deste plano e conferir Git/baseline/diff.
- [x] Criar cors-config.test.js seguindo config.test.js: spawnSync Node ESM,
  cwd mkdtemp, env construída apenas com PATH, NODE_ENV e credenciais sintéticas
  válidas; não herdar ambiente. Importar config/validarConfig por URL absoluta.
  Retornar somente corsOrigem ou mensagem de erro; nunca retornar JWT/token.
  Timeout10s, remover diretório temporário no finally.
- [x] Testar ausente, vazio e whitespace em development/test/production.
  Esperado: localhost5173 nos dois primeiros; string vazia em production.
  Testar origem explícita em todos os ambientes e trim exterior existente.
- [x] Válidos: https://loja.example, http://localhost:5173,
  https://loja.example:8443. Inválidos: *, null, https://, ftp://loja.example,
  https://loja.example/, /caminho, https://loja.example/app,
  https://loja.example?x=1, https://loja.example#fragmento,
  https://usuario:senha@loja.example, lista separada por vírgula, porta padrão
  explícita https://loja.example:443 e host com maiúscula (não canônicos).
  Exigir erro citando CORS_ORIGEM, mas sem ecoar valor fornecido.
- [x] Executar `node --test tests/cors-config.test.js` em backend/ antes da
  produção e registrar falhas esperadas de defaults/validação, separadas de setup.
- [x] Em config.js definir ambiente uma vez antes do objeto, mantendo export:

```js
const ambiente = process.env.NODE_ENV?.trim() || 'development';
// dentro de config:
ambiente,
corsOrigem: process.env.CORS_ORIGEM?.trim()
  || (ambiente === 'production' ? '' : 'http://localhost:5173'),
```

- [x] Em validarConfig, quando config.corsOrigem não vazia, tentar new URL e
  exigir http:/https: e url.origin === config.corsOrigem. Igualdade canônica
  também rejeita credenciais/caminhos/query/fragmento. Acumular erro genérico:

```js
problemas.push('CORS_ORIGEM invalida. Informe uma unica origem HTTP(S), sem caminho ou credenciais.');
```

Não interpolar a entrada. Preservar demais validações e emProducao.
- [x] Reexecutar teste focado e config.test.js; registrar contagens reais.

## Tarefa2 — Middleware e regressões HTTP

**Aceites:** AC-01,02,04. Consome config.corsOrigem e criarApp(); não cria serviço.

- [x] Criar cors.test.js com harness por subprocesso/cwd temporário e DB_PATH
  temporário. Usar app real e schema real via obterBanco/aplicarSchema; iniciar
  em127.0.0.1:0, aguardar listening. Capturar fetch nativo e instalar guarda
  permitindo apenas origem do servidor local. Sem health/ERP/pedidos.
  finally fecha servidor somente se listening, depois fecha banco e limpa cwd.
  Timeout20s. Sintéticos JWT>=32, ERP_URL https://erp.invalid, ERP_TOKEN de teste.
- [x] Usar GET /api/perfil sem sessão: status401, envelope de não autenticado.
  Para origem configurada https://loja.example, exigir Allow-Origin exato,
  Allow-Credentials true e Vary contendo Origin. Para OPTIONS /api/perfil,
  enviar Access-Control-Request-Method:PATCH e Headers:content-type; exigir204,
  Allow-Origin/Credentials, Allow-Methods contendo PATCH e Allow-Headers contendo
  content-type. Não fixar todos os defaults em string ordenada.
- [x] Tabela negada: https://outra.example, https://loja.example:8443,
  https://loja.example.atacante.invalid, https://prefixo.loja.example e null.
  Testar GET e OPTIONS; exigir ausência de Allow-Origin/Allow-Credentials e,
  no OPTIONS, Allow-Methods/Allow-Headers. Sem Origin segue200 no GET sem
  permissões. OPTIONS não autorizado segue roteamento Express normal: não
  fixar status como403 nem confundir Allow HTTP com Access-Control-Allow-Methods.
- [x] Produção sem CORS_ORIGEM: testar localhost5173 e origem arbitrária sem
  permissões; produção com origem configurada concede apenas essa. Dev/test
  sem configuração concede localhost5173 e nega outra porta.
- [x] Inserir dois usuários sintéticos no SQLite, sem credenciais reais; assinar
  cookie em memória via assinarToken. GET /api/perfil com origem permitida e
  sem cookie exige401; cookie usuário1 devolve apenas id1, não id2, sem senha_hash.
  Origem negada e mesmo cookie ainda pode receber200 no cliente HTTP de teste,
  porém sem headers CORS: isso demonstra que CORS não substitui autenticação
  nem bloqueia a execução da rota. Não imprimir cookie/token/hash nas asserções.
- [x] Executar `node --test tests/cors.test.js` em backend/ ainda na baseline;
  registrar RED por permissões indevidas, não por falhas de porta. Se sandbox
  impedir servidor, executar com autorização adequada.
- [x] Em app.js substituir reflexão pelo callback:

```js
app.use(cors({
  origin(origem, callback) {
    callback(null, Boolean(origem && config.corsOrigem && origem === config.corsOrigem));
  },
  credentials: true,
}));
```

origin false desativa CORS para aquela requisição antes de emitir credentials.
Manter demais opções padrão. Comentar que proxy/produção mesma origem dispensam
CORS, e acesso cruzado só é concedido à origem explícita. Não mudar ordem de
middlewares sem necessidade. Sem erro403 e sem bypass da autenticação.
- [x] Reexecutar HTTP focado e configuração; exigir GREEN.

## Tarefa3 — Guia, regressões e confirmação manual

**Aceite:** AC-05 e entrega. Dados e contratos não mudam.

- [x] Atualizar comentário de CORS_ORIGEM em .env.example: origem única,
  exemplo localhost5173, padrão dev/test e ausência desabilitando CORS em produção.
  Explicar retirar/zerar configuração local de desenvolvimento no deploy se
  deseja apenas mesma origem. Não modificar .env preenchida pelo usuário.
- [x] Em docs/ambiente.md atualizar tabela e exemplos: mesma origem dispensa
  permissão; frontend separado requer origem canônica, sem barra final;
  reiniciar backend após alterações. Diferenciar bloqueio de leitura no browser
  de firewall/CSRF e os limites de SameSite=Lax.
- [x] Executar npm test em backend/ e frontend/; npm run build em frontend/;
  node --check nos módulos alterados; git diff --check. Revisar conteúdo completo
  e ausência de segredos/artefatos. Não adicionar testes espelhando implementação.
- [x] Atualizar documentos com RED/GREEN, contagens, limites de prova e KZN-2B9C.
  Marcar Implementado até confirmação manual. Não declarar exploração autenticada.
- [x] Usuário reinicia backend, acessa loja via localhost5173, confere catálogo,
  login, perfil e sessão apósF5. Não exige mudar segredo ou resetar banco.
  Registrar confirmação para AC-05; não registrar dados pessoais.
- [x] Após comando específico: commit `fix: restringe cors a origem configurada`,
  publicar branch e abrir PR para main; acompanhar checks. Merge manual.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | GET/OPTIONS permitido | Headers exatos e preflight204 | Pendente |
| AC-02 | Tabela de origens, sem Origin | Sem permissões indevidas, rotas preservadas | Pendente |
| AC-03 | Subprocessos de configuração | Defaults corretos, inválidos rejeitados sem eco | Pendente |
| AC-04 | Perfil com/sem sessão sintética | 401 ou próprio usuário; CORS não autoriza | Pendente |
| AC-05 | Suítes/build e manual via proxy | Sem regressão de uso normal | Pendente |

## Recuperação e autorrevisão

Sem migração; banco e credenciais existentes preservados. Reversão por commit
quando autorizada, sem reset. Falhas de integração de frontend separado devem
ser resolvidas configurando a origem explícita, não reabrindo reflexão global.
Plano cobre REQ-01 a07/AC-01 a05, mantém HTTP/cookies e não amplia para CSRF.
Implementação aguarda aprovação deste plano; aprovação da spec já registrada.

## FIX-002 implementado — 2026-10-12

Plano versão1 aprovado pelo usuário com “aprovado” após apresentação.
app.js compara Origin exatamente com config.corsOrigem; desconhecida/null/
ausente não recebe permissões CORS e segue as rotas/autenticação normais.
config.js valida origem canônica HTTP(S), sem ecoar entrada inválida; padrão
localhost5173 em dev/test, vazio em produção sem configuração. .env.example
e guia de ambiente atualizados. Nenhuma variável nova; .env real preservada.
Nota de revisão KZN-2B9C lida e preservada em config.js. Comentário antigo
sobre refletir qualquer origem substituído pela política efetiva.

Adicionados19 testes de configuração (alguns com tabelas internas) e5 cenários
HTTP agrupados. RED24:5 passaram/19 falharam por default produção, ausência de
validação e reflexão indevida. GREEN24/24; com config.test.js30/30. Suíte
backend89/89, frontend53/53 e build61 módulos passaram; sintaxe app/config e
git diff --check passaram. Baseline14f5163 contém65 testes backend anteriores;
a correção FIX-008 permanece em PR separado e não compõe essa contagem.

HTTP usa app real, SQLite/schema temporários, JWT/usuários sintéticos e fetch
restrito à origem local. Comprovados GET/OPTIONS permitido, métodos/headers,
Vary, origens enganadoras/porta/null/ausente, defaults em3 ambientes,401 sem
sessão e perfil do usuário1 sem hash com sessão. Origem negada com sessão
continua200 no cliente HTTP sem permissão CORS, conforme decisão da spec.
Não executada exploração no navegador; não é promessa de proteção CSRF.
Ajuste de roteiro: /auth/eu exige autenticação, diferente do pressuposto no
plano inicial; teste usa /perfil com401 sem sessão, mantendo objetivo aprovado.
Estado Implementado: AC-01 a04 passaram isoladamente; AC-05 regressões/build
passaram, confirmação manual pendente. Reiniciar backend, abrir loja via
localhost5173, conferir catálogo, login, perfil e sessão apósF5. Sem reset
ou alteração de segredo. Commit/push/PR aguardam comando específico.

## FIX-002 validado — 2026-10-12

Usuário confirmou “validado, pode abrir o PR” após roteiro de reinício, catálogo,
login/perfil e sessão apósF5. AC-05 concluído com regressões e confirmação
manual. Estado Validado. Commit, publicação da branch e PR autorizados.
Confirmação de uso normal não equivale a exploração autenticada em navegador.
CI remoto será acompanhado; merge manual pelo usuário. Registros anteriores
de manual/autorização pendentes são históricos.

## Publicação FIX-002 — 2026-10-12

Implementação `b3096f8` publicada em `fix/restricao-de-origem-cors`.
PR #15: https://github.com/eduardofrois/kaizen-test/pull/15
Estado Validado, confirmação manual registrada. Checks remotos em acompanhamento;
merge manual pendente. Nenhum merge realizado pela IA.
