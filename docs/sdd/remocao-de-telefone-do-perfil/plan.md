# Plano — Remoção de telefone do perfil

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** c7e98cd; 2026-10-12
**Objetivo:** remover telefone explicitamente e preservar quando omitido.
**Arquitetura:** rota distingue presença; serviço distingue undefined de null.
**Stack:** JavaScript ESM, node:test, Express e SQLite existentes.
**Aprovação da spec:** usuário “spec aprovada”, em 2026-10-12.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação deste plano versão 1.
**Execução:** sequencial, sem subagentes.


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

## Restrições globais

REQ-01 a REQ-06: nome/documento seguem obrigatórios; telefone omitido preserva,
vazio/espaços/null remove; validação existente e proprietário autenticado.
Sem frontend, schema, dependência, ERP, .env real ou banco real alterados.
O teste HTTP usa arquivo SQLite descartável: autenticação e rota usam singleton
obterBanco sem injeção. Testes diretos do serviço usam SQLite em memória.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | backend/src/services/usuarioService.js | Preservar telefone somente se undefined |
| Alterar | backend/src/routes/perfil.js | Validar telefone apenas se propriedade presente |
| Criar | backend/tests/perfil-telefone.test.js | Serviço real e rota real isolados |
| Atualizar | docs/sdd/remocao-de-telefone-do-perfil/spec.md e plan.md | Aprovação, execução, aceite |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Evidências e pendências |

## Tarefa 1 — Regressão isolada e correção

**Cobertura:** AC-01 a AC-04; REQ-01 a REQ-06.
**Interfaces:** atualizarPerfil(usuarioId,dados,db), serializarUsuario(linha),
criarApp(), assinarToken(usuarioId), obterBanco/aplicarSchema/fecharBanco.

- [x] Registrar aprovação explícita deste plano e conferir Git/diff.
- [x] Criar perfil-telefone.test.js com node:test/assert, spawnSync, mkdtempSync,
  rmSync, tmpdir e path, seguindo isolamento dos testes existentes. Cada cenário
  roda em subprocesso com cwd temporário e env somente PATH + NODE_ENV=test,
  JWT_SEGREDO sintético de pelo menos32 caracteres, ERP_URL=https://erp.invalid,
  ERP_TOKEN sintético e DB_PATH dentro do temporário. Não herdar env real.
  Importar módulos por URL absoluta após env definida; timeout15s, status0
  exigido pelo pai, limpeza do temporário em finally.
- [x] Fixture usa schema real e usuários1/2, INSERT parametrizado com nome
  'Usuario teste', emails teste1/teste2@example.invalid, hash sintético sem login,
  documento '00000000000', telefone '11999999999' e datas sintéticas. Sem dados
  pessoais reais. Fake de fetch lança se qualquer URL externa for chamada.
- [x] Casos diretos do serviço com Database(':memory:') via createRequire da URL
  de usuarioService e schema real. Para cada caso restaurar fixture e executar:

```js
const resultado = atualizarPerfil(1, dados, db);
assert.equal(resultado.telefone, esperado);
assert.equal(db.prepare('SELECT telefone FROM usuarios WHERE id = ?').get(1).telefone, esperado);
assert.deepEqual(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(2), outroAntes);
assert.equal(Object.hasOwn(serializarUsuario(resultado), 'senha_hash'), false);
```

Tabela: dados={} preserva11999999999; {telefone:undefined} preserva;
{telefone:null} gravaNULL; {telefone:'21988888888'} substitui. Com telefone
originalNULL, omissão e null continuamNULL. Nome/documento/email do usuário1
preservados quando omitidos. Usuário inexistente retorna404 sem alterar usuários.
Fechar db em finally; não testar vazio cru como contrato do serviço.
- [x] Casos HTTP usam criarApp real com obterBanco/aplicarSchema no arquivo
  temporário. Servidor listen(0,'127.0.0.1'), aguardar listening, fechar em finally
  antes de fecharBanco. Cookie sintético assinado com assinarToken(1) e nome
  config.jwt.nomeCookie. Não registrar token/cookie/hash nos resultados.
  Preservar fetch nativo somente para HTTP local; negar outras origens:

```js
const fetchLocal = globalThis.fetch;
globalThis.fetch = (entrada, opcoes) => {
  assert.equal(new URL(entrada).origin, origemLocal);
  return fetchLocal(entrada, opcoes);
};
const resposta = await fetch(origemLocal + '/api/perfil', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookieSintetico },
  body: JSON.stringify(corpo),
});
```

Servidor não inicia server.js nem health; nenhuma consulta ERP esperada.
- [x] Cenários HTTP independentes com corpo base nome:'Usuario teste',
  documento:'00000000000': telefone omitido preserva; ''/'   '/null removem;
  '21988888888' substitui; conta originalmente sem telefone permaneceNULL ao
  omitir/limpar. Cada sucesso exige200, dados.telefone esperado, sem senha_hash,
  GET /api/perfil autenticado confirma valor e usuário2 permanece idêntico.
- [x] Telefone '123' e texto acima20 caracteres exigem422, erro.detalhes com
  campo telefone, todas as linhas antes/depois idênticas. Corpos sem nome e
  sem documento continuam422 e não persistem. Para provar não atualização
  parcial, usar nome válido diferente junto de telefone inválido e conferir DB.
- [x] Corpo com usuario_id:2 e telefone:null autentica usuário1; apenas1 muda.
  Sem cookie, PATCH devolve401 e nenhuma linha muda. Token inválido também401
  e dados intactos. Não gerar hash/login real para preparar autenticação.
- [x] Executar `node --test tests/perfil-telefone.test.js` em backend/ antes
  da correção. Esperado RED por limpeza que mantém telefone antigo. Casos de
  omissão/validação/posse podem passar; registrar números reais. Falha de porta
  ou fixture não comprova bug; resolver infraestrutura antes de aceitar RED.
- [x] Em atualizarPerfil trocar somente expressão:

```js
telefone === undefined ? atual.telefone : telefone,
```

- [x] Na rota perfil, remover telefone do objeto dados inicial e acrescentar
  após nome/documento, antes de erros.lancarSeInvalido:

```js
if (Object.hasOwn(corpo, 'telefone')) {
  dados.telefone = telefone(corpo.telefone, 'telefone', erros);
}
```

Não alterar validador global, serialização, sessão ou frontend.
- [x] Reexecutar teste focado; esperado todos passam. Registrar resultados e
  evidência de GET/persistência, distinção de ausência e propriedade alheia.

## Tarefa 2 — Regressões e entrega

**Cobertura:** AC-05 e comprovação manual AC-01/02.

- [x] Executar npm test em backend/ e frontend/; npm run build em frontend/;
  node --check nos dois módulos backend alterados; git diff --check na raiz.
  Registrar números reais sem antecipar resultados.
- [x] Revisar diff completo: somente rota/serviço em produção; campos/erros
  preservados; sem env, arquivo DB, dependências ou build no commit.
- [x] Manual pelo usuário: perfil com telefone, apagar, salvar, atualizar página;
  campo segue vazio. Preencher válido, salvar/F5; persiste. Não copiar número
  real para docs. Omissão é comprovada no HTTP isolado porque formulário sempre
  envia telefone; não exigir alterar payload manualmente para validar UI.
- [x] Atualizar spec/plano, fix.md, relatório, investigação e índice SDD com
  RED/GREEN, aprovações, estado e pendências. Teste HTTP isolado não equivale
  a sessão real no navegador; registro manual somente quando confirmado.
- [x] Após comando explícito, commit `fix: permite remover telefone do perfil`,
  publicar branch e abrir PR. Merge manual pelo usuário.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Serviço+PATCH/GET+manual | NULL persiste; sem hash | Serviço/HTTP passaram; manual confirmado pelo usuário em 2026-10-12 |
| AC-02 | Omissão/edição/contaNULL | Preservação ou substituição conforme entrada | Passou |
| AC-03 | HTTP422 e snapshot SQLite | Erro por campo; nenhuma atualização parcial | Passou |
| AC-04 | Cookie sintético/sem sessão/payloadalheio | Somente autenticado altera | Passou |
| AC-05 | Suítes/build/sintaxe/diff/manual | Sucesso com limitações registradas | Backend65/frontend53/build61; manual confirmado pelo usuário em 2026-10-12 |

## Migração, recuperação e autorrevisão

Sem migração: coluna já aceitaNULL; não apagar contatos existentes em lote.
Reversão por commit; sem reset de banco. Harness HTTP usa banco descartável e
porta efêmera local para exercer middleware real, sem mudar aplicação para teste.
Esquema do teste direto em memória, HTTP em arquivo temporário; ambos isolados.
Plano cobre spec versão1. Implementação concluída; manual confirmado. CI/publicação da implementação registradas no histórico.

## Histórico — FIX-007 implementado — 2026-10-12

Plano versão1 aprovado pelo usuário com “aprovado”, após apresentação nesta
sessão. Rota valida telefone apenas quando Object.hasOwn(corpo,'telefone');
serviço preserva valor anterior somente diante de undefined. Null gravaNULL.
Vazio/espaços seguem normalização existente; nome/documento obrigatórios.
Adicionados21 testes:7 serviço real/SQLite em memória e14 HTTP autenticado
com banco temporário e porta local efêmera. Nenhuma env/DB real ou ERP acessado.
Primeira execução HTTP sob sandbox falhou em infraestrutura; limpeza do
servidor mascarou erro de inicialização, posteriormente guardada por listening.
Essa execução não conta como reprodução do bug. Execução autorizada RED:
21 casos,16 passaram/5 falharam por telefone antigo em vez deNULL (serviço,
vazio,espaços,null e payload com usuario_id alheio). GREEN focado21/21.
Regressão completa backend65/65 e frontend53/53; build61 módulos passou;
sintaxe dos dois módulos e git diff --check passaram. Testes comprovam GET
após PATCH, omissão, edição, conta sem telefone, validação422 sem atualização
parcial,401 sem sessão/token inválido e isolamento entre proprietários.
Nenhum hash/token/cookie real usado; serialização não expõe senha_hash.
Estado Implementado. AC-01 a AC-04 comprovados isoladamente; AC-05 testes/build
passaram, manual pendente. Próximo passo: apagar telefone no perfil, salvar e
F5; depois editar um telefone válido e conferir persistência. Sem registrar
número pessoal nos docs. Nenhuma alteração frontend/schema/dependências.
Commit, publicação e PR aguardam comando explícito; CI não executado nesta
unidade. Registros anteriores descrevem etapas históricas.

## Histórico — Validação manual e publicação autorizada — 2026-10-12

Usuário confirmou “validado, pode abrir o PR”, após roteiro de remoção,
salvamento/F5 e edição de telefone válido. Confirmação manual registrada sem
expor número pessoal. AC-05 concluído com regressões locais e confirmação
do usuário. Estado Validado; commit/publicação da branch e PR para main
autorizados. CI remoto será acompanhado; merge manual pelo usuário.
Registros anteriores de validação/publicação pendente são históricos.

## Histórico — Publicação FIX-007 — 2026-10-12

Implementação publicada no commit40ea907, branch fix/remocao-de-telefone-do-perfil.
PR #12: https://github.com/eduardofrois/kaizen-test/pull/12
Checks testes-backend e build-frontend passaram no run38314449233:
https://github.com/eduardofrois/kaizen-test/actions/runs/38314449233
Validação manual confirmada pelo usuário. Estado Validado; merge manual pendente.
Esta atualização documental gera novos checks a acompanhar. Registros anteriores
de publicação/CI/manual pendentes são históricos. Nenhum merge realizado pela IA.
