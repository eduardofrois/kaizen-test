# Plano — Espaços na autenticação de senha

**Versão:** 1
**Estado:** Validado — publicação autorizada
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** f744b39; 2026-10-12
**Objetivo:** conferir senhas sem remover espaços escolhidos no cadastro/troca.
**Arquitetura:** validador específico nas duas rotas de conferência; hash intacto.
**Stack:** JavaScript ESM, node:test, Express, SQLite e scrypt existentes.
**Aprovação da spec:** usuário “aprovado”, em 2026-10-12.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação deste plano versão 1.
**Execução:** sequencial nesta sessão, sem subagentes.

## Restrições globais

REQ-01 a REQ-06: senhaDeAutenticacao preserva entrada, presença e máximo200;
login/senha_atual usam validador; política de criação, NFKC, scrypt, cookies,
erros e posse preservados. Sem frontend/schema/dependência/ERP/env real.
Não registrar hashes, cookies ou tokens nem em falhas de asserção.

## Arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | backend/src/lib/validacao.js | Exportar senhaDeAutenticacao |
| Alterar | backend/src/routes/auth.js | Usar validador no login |
| Alterar | backend/src/routes/perfil.js | Usar validador em senha_atual |
| Criar | backend/tests/senha-autenticacao.test.js | Validador real e fluxos HTTP |
| Atualizar | spec.md e plan.md desta unidade; fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Aprovações/evidências/pendências |

## Tarefa 1 — Provas do defeito e implementação

**Cobertura:** AC-01 a AC-05. Interfaces: senhaDeAutenticacao, ColetorDeErros,
senha, textoObrigatorio, criarApp, obterBanco/aplicarSchema/fecharBanco,
assinarToken, gerarHash/conferirSenha.

- [x] Registrar aprovação explícita do plano e conferir Git/diff.
- [x] Criar senha-autenticacao.test.js. Usar spawnSync por cenário com cwd de
  mkdtempSync, env sintética (PATH, NODE_ENV=test, JWT_SEGREDO exclusivo>=32,
  ERP_URL=https://erp.invalid, ERP_TOKEN sintético, DB_PATH no temporário),
  imports por URL absoluta, timeout20s e limpeza em finally. Não herdar .env.
  Seguir isolamento de perfil-telefone.test.js, sem copiar dados pessoais.
- [x] Testes unitários importam módulo de validação dentro do subprocesso e
  verificam export por assert.equal(typeof modulo.senhaDeAutenticacao,'function')
  antes de chamar. Antes da criação do export, registrar RED estrutural separado
  do RED HTTP comportamental; não tratar função ausente como reprodução do bug.
- [x] Tabela de válidos do validador: ' senha123 ', 'senha123', 'sen ha123',
  'x', '1', 'a'.repeat(200). Exigir retorno estritamente igual à entrada e
  erros.itens vazio. Curtas são aceitas na conferência, sem política de criação.
  Inválidos: undefined,null,42,{},[], '', '   ', '\t\n', 'a'.repeat(201),
  ' '+'a'.repeat(199)+' '. Exigir null e erro para o campo solicitado.
  Testar também campo senha_atual. Controles: textoObrigatorio(' Nome ') segue
  retornando 'Nome'; senha(' senha123 ') preserva; senha('abc'),senha('12345678')
  e senha('abcdefgh') seguem inválidas. NFKC: hash real de 'senhaＡ123' confere
  com 'senhaA123', sem alterar módulo de criptografia.
- [x] Harness HTTP inicia criarApp real em127.0.0.1:0 e usa banco temporário do
  singleton. Capturar cookie de Set-Cookie apenas em variável local, nunca logar.
  Substituir fetch global por guarda de origem local (fetch nativo capturado),
  negar qualquer chamada ERP. finally fecha servidor se listening, depois banco.
  Helper request(method,rota,corpo,cookie) retorna status/json/cookie internamente;
  asserções de status, códigos e presença de campos não imprimem credenciais.
- [x] Cenário cadastro/login: POST /api/auth/cadastro com nome sintético, email
  teste@example.invalid, documento00000000000 e senha sintética ' senha123 '.
  Exigir201, cookie de sessão presente e dados sem senha_hash. POST logout,
  login original exige200; login versão sem espaços exige401 CREDENCIAIS_INVALIDAS;
  login senha incorreta e email inexistente retornam mesmo código/mensagem.
  Cada resposta de usuário não contém hash; GET /auth/eu com cookie confirma id.
- [x] Cenário troca independente: preparar conta com serviço cadastrarUsuario
  real/scrypt real e senha de bordas; assinar cookie sintético, sem depender do
  login quebrado para alcançar rota. Criar usuário2 sintético como controle.
  PATCH /perfil/senha com senha_atual original e nova_senha ' novaSenha456 '
  exige200. Login nova original200; nova trim401; antiga401. Usuário2 mantém
  hash e todos os dados. Comparar igualdade por booleano seguro:

```js
assert.ok(outroDepois.senha_hash === outroAntes.senha_hash, 'hash alheio preservado');
assert.ok(hashDepois !== hashAntes, 'troca bem-sucedida substitui hash');
```

Não usar assert.equal/deepEqual diretamente sobre hashes, cookies ou snapshots
com esses campos. Comparar dados não secretos separadamente.
- [x] Cenários sem espaços e espaços internos: cadastro/login/troca continuam
  aceitando entrada original. Para senha com espaço interno, versão sem esse
  espaço deve falhar. Nenhum fallback com credencial normalizada por trim.
- [x] Validação HTTP em login e senha_atual: vazio, whitespace, não string e
  >200 incluindo espaços exigem422/detalhe campo correspondente. Credencial
  com200 caracteres é validada sem truncar (login inexistente retorna401,
  não422). Nova senha curta/sem letra/sem número segue422 nova_senha.
- [x] Troca com senha_atual incorreta exige422; com entrada inválida também422;
  sem sessão401. Em todos verificar hash e atualizado_em inalterados por
  comparação booleana; usuário2 intacto. Respostas sem hash/token no JSON.
- [x] Executar `node --test tests/senha-autenticacao.test.js` em backend/ antes
  de corrigir. Registrar RED estrutural e comportamental separados; falha de
  porta/setup não conta. Se sandbox bloquear porta, executar com autorização.
- [x] Adicionar a validacao.js:

```js
export function senhaDeAutenticacao(valor, campo, erros) {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    erros.adicionar(campo, 'Campo obrigatorio.');
    return null;
  }
  if (valor.length > 200) {
    erros.adicionar(campo, 'Deve ter no maximo 200 caracteres.');
    return null;
  }
  return valor;
}
```

- [x] Importar senhaDeAutenticacao nas rotas auth/perfil. Substituir somente:

```js
// auth/login
const texto = senhaDeAutenticacao(corpo.senha, 'senha', erros);
// perfil/senha
const atual = senhaDeAutenticacao(corpo.senha_atual, 'senha_atual', erros);
```

Manter textoObrigatorio importado para nome e demais campos. Não alterar senha(),
serviços ou lib/senha.js. Não migrar hashes nem aceitar versão trim como fallback.
- [x] Reexecutar teste focado, registrar GREEN e contagens reais.

## Tarefa 2 — Regressão, manual e entrega

**Cobertura:** AC-06 e integração manual AC-01/02.

- [x] Executar npm test em backend/ e frontend/; npm run build em frontend/;
  node --check nos três módulos alterados; git diff --check na raiz.
- [x] Revisar diff completo e segredos: produção restrita ao validador/duas
  chamadas; schema, scrypt/NFKC, cookies, erros e política de criação intactos.
- [x] Manual pelo usuário: criar conta de teste com senha contendo espaços nas
  bordas, sair e entrar com a mesma entrada; trocar senha por outra com espaços,
  sair/entrar com nova. Não registrar valores de senha ou cookies no relatório.
  Conta real não será criada/alterada automaticamente pela IA.
- [x] Atualizar spec/plano, relatório, inventário, investigação e índice SDD com
  aprovações, RED/GREEN, limites e pendências. HTTP isolado não é manual real.
- [ ] Commit/publicação/PR após comando explícito. Mensagem sugerida:
  `fix: preserva espacos na autenticacao de senha`. Merge manual pelo usuário.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Cadastro/login HTTP real isolado | Original funciona; trim falha | Passou isoladamente |
| AC-02 | Troca/login com hash real | Nova original funciona; antiga/trim falham | Passou isoladamente |
| AC-03 | Controles sem espaços/internos/NFKC | Sem regressão nem fallback | Passou isoladamente |
| AC-04 | Validador e HTTP422 | Presença/tipo/200/política de criação | Passou isoladamente |
| AC-05 | Erros de troca/sessão/usuário2 | Hash intacto e isolamento | Passou isoladamente |
| AC-06 | Suítes/build/sintaxe/diff/manual | Sucesso com evidências | Backend72/frontend53/build61 passaram; manual confirmado pelo usuário |

## Migração, recuperação e autorrevisão

Sem migração: hashes existentes são preservados. Reversão por commit, sem reset.
Scrypt real torna testes mais caros, portanto cenários focados em causa e riscos,
sem matriz combinatória desnecessária. Dados/credenciais exclusivamente sintéticos.
Plano cobre spec versão1. Implementação e validação concluídas; publicação autorizada, CI pendente.

## FIX-008 implementado — 2026-10-12

Plano versão1 aprovado pelo usuário com “aprovado” após apresentação nesta
sessão. Criado senhaDeAutenticacao em validacao.js, usado no login e senha_atual.
Retorna string original, rejeita vazio/whitespace/não string e mede máximo200
incluindo espaços. Política de criação, textos comuns, scrypt/NFKC preservados.
RED focado:7 cenários,3 passaram/4 falharam. Uma falha estrutural de export
inexistente; três comportamentais: login com bordas401 em vez de200, troca422
em vez de200 e entrada acima200 com espaços aceita após trim. GREEN7/7.
Testes agrupam tabelas de validador e fluxos HTTP completos; não equivalem
à contagem de cada asserção. Suíte backend72/72, frontend53/53; build61 módulos,
sintaxe dos três módulos e git diff --check passaram.
HTTP local com SQLite temporário, scrypt real e contas/config sintéticas;
sem .env/banco real, ERP, dependências, schema ou frontend alterados.
Comprovados cadastro/login original versus trim, troca e login novo/antigo,
senhas sem espaços/internos, normalização NFKC, limites/erros de campo,
política de criação, falhas sem alteração do hash, sessão e usuário2 intacto.
Hashes/tokens/cookies mantidos apenas em memória de teste, sem impressão.
Estado Implementado. AC-01 a AC-05 passaram isoladamente. AC-06 regressões e
build passaram; confirmação manual pendente. Roteiro: conta de teste com senha
contendo espaços nas bordas, sair/entrar, trocar para outra senha com espaços
e sair/entrar novamente. Não registrar credenciais pessoais nos documentos.
Sem migração ou fallback de credencial. Commit, publicação e PR aguardam comando
explícito; CI não executado nesta unidade. Registros anteriores são históricos.

## FIX-008 validado — 2026-10-12

Usuário confirmou “validei a correcao, pode abrir o PR”. Validação manual
confirmada; AC-06 concluído junto às regressões locais registradas acima.
Estado Validado. Commit, push da branch e abertura do PR autorizados nesta
sessão. CI remoto será acompanhado após a publicação; merge manual pelo usuário.
Registros anteriores de manual/autorização pendentes são históricos.
