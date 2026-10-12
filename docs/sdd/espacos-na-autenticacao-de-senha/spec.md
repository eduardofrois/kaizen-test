# Spec — Espaços na autenticação de senha

**Versão:** 1
**Estado:** Validado — PR #13 aberto
**Baseline/data:** f744b39; 2026-10-12
**Origem:** FIX-008
**Branch:** fix/espacos-na-autenticacao-de-senha
**Aprovação da spec:** 2026-10-12; usuário “aprovado”, após apresentação da versão 1.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação do plano versão 1.

## Problema e evidência

Cadastro e nova senha usam senha(), que retorna entrada sem trim. Login e
senha_atual no perfil usam textoObrigatorio(), que remove espaços. Hash e
verificação normalizam NFKC igualmente, preservando espaços ASCII nas bordas.
Inspeção atual confirma divergência nas rotas auth/perfil e validacao.js.
Registro anterior com hash real sintético confirmou original=true e trim=false;
esta preparação ainda não executou fluxo HTTP completo nem reprodução própria
em navegador. Não registrar credenciais reais em documentos ou testes.

## Objetivo e comportamento esperado

Senha aceita no cadastro/nova senha deve permitir autenticação com a mesma
entrada, incluindo espaços iniciais/finais e internos. Não remover espaços
antes da conferência. Preservar normalização NFKC existente: não prometer
igualdade byte a byte entre formas Unicode que o hash já normaliza.

## Escopo e requisitos

- REQ-01: criar validador senhaDeAutenticacao(valor,campo,erros), preservando
  string original. Aceitar entrada não vazia de até200 caracteres; não aplicar
  política de criação (mínimo8/letra/número) à conferência de credencial existente.
- REQ-02: string vazia, só espaços/whitespace ou não string gera erro obrigatório;
  trim pode verificar presença, mas nunca transformar retorno. Comprimento
  máximo200 é medido na string original, incluindo espaços, como na criação.
- REQ-03: login e senha_atual usam esse validador; senha() de cadastro/nova senha
  e textoObrigatorio() dos campos comuns permanecem com comportamento atual.
- REQ-04: hash/verificação scrypt e NFKC preservados; nenhum hash regravado em
  lote, fallback tentando senha com/sem espaços ou migração de credenciais.
- REQ-05: preservar erros acumulados, envelope, login genérico, cookies e posse.
  Senha errada não autentica; senha atual errada não altera hash.
- REQ-06: sem frontend, schema, dependência, ERP, env ou banco real alterados.

## Contratos, dados e interface

Mesmas rotas/campos: POST /api/auth/cadastro, POST /api/auth/login e
PATCH /api/perfil/senha com senha_atual/nova_senha. Erros de entrada continuam
422 por campo; credencial incorreta mantém resposta genérica401 no login e
422 de senha atual na troca. Interface preservada.
Entrada acima200 com espaços deixa de ser aceita após trim: limite passa a
ser coerente com criação e é decisão explícita desta spec. Strings somente
whitespace continuam inválidas. Senhas novas continuam mínimo8/letra+número.
Sem migração: hashes existentes continuam válidos para a entrada original
normalizada pelo NFKC. Contas sem espaços continuam com o fluxo atual.

## Decisões e alternativas

Recomendação: validador separado para credencial existente, retornando string
original. Evita afetar todos os campos textuais ou impor regras novas à senha
atual. Alternativa: opção trim:false no validador de texto comum. Mistura
credenciais e texto genérico e facilita uso indevido futuro.
Alternativa: trim no cadastro e tentar senhas legadas nos dois formatos.
Muda a senha escolhida e amplia as credenciais aceitas; descartada.

## Critérios de aceite

- [x] AC-01: cadastro com senha sintética contendo espaços nas bordas e login
  com entrada original funciona; versão sem os espaços falha.
- [x] AC-02: troca autenticada confirma senha atual com espaços e aceita nova
  com espaços; login novo funciona, senha antiga e nova sem espaços falham.
- [x] AC-03: senhas sem espaços continuam funcionando e espaços internos
  preservados; scrypt/NFKC mantidos sem fallback de credencial.
- [x] AC-04: obrigatório/tipo/whitespace/máximo200 respeitados e erros por campo
  preservados; cadastro/nova senha mantêm mínimo e composição existentes.
- [x] AC-05: senha atual incorreta ou entrada inválida não altera hash; troca
  sem sessão rejeitada; outro usuário não é afetado; respostas não expõem hash.
- [x] AC-06: regressões backend/frontend/build passam; manual confirma criação,
  login e troca com senha sintética, sem copiar senha/cookie/hash para docs.

## Riscos e estratégia de validação

Testes do validador real e HTTP completo com SQLite temporário, scrypt real,
config sintética e porta local efêmera, sem .env/banco real ou ERP. Registrar
RED comportamental; falhas de porta/setup não são reprodução do bug.
Testes devem verificar hash persistido apenas em asserções locais, sem imprimir
valores. Falhas de asserção sobre hashes/tokens não devem expor esses valores.
Validação manual pelo usuário distinta dos testes HTTP isolados. Não criar ou
alterar contas reais automaticamente. Harness detalhado após aprovação da spec.
Nota de escopo: NFKC não é novo requisito; é comportamento já existente.

## Entrega e histórico

PR #12 confirmado integrado à main f744b39; pull concluído. Spec versão1 em
proposta. Após aprovação, detalhar plan.md para revisão antes de implementar.
Atualizar fix.md, RELATORIO.md, investigação e SDD com evidências reais.
Código/testes intactos nesta unidade; publicação/merge exigem comando específico.

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

## Publicação FIX-008 — 2026-10-12

Commit de implementação: `9b29049`. Branch publicada:
`fix/espacos-na-autenticacao-de-senha`. PR #13 aberto para main:
https://github.com/eduardofrois/kaizen-test/pull/13
Estado Validado; testes locais e confirmação manual concluídos. Checks remotos
em acompanhamento. Merge manual pendente. Nenhum merge realizado pela IA.
