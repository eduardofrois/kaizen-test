# Spec Driven Development

## Fluxo acordado

1. Investigar o comportamento e reunir evidência.
2. Escrever `docs/sdd/<nome-descritivo>/spec.md`; revisar requisitos e decisões com o usuário.
3. Escrever `docs/sdd/<nome-descritivo>/plan.md` cobrindo a spec.
4. Obter aprovação explícita para implementar os documentos revisados.
5. Implementar apenas o escopo aprovado, em branch `<tipo>/<assunto>` (ex.: `fix/total-do-carrinho`).
6. Executar validações previstas e regressões pertinentes.
7. Atualizar fix.md, spec/plano e, quando autorizado, RELATORIO.md.

Documentos podem ser preparados como propostas em paralelo à investigação.
Nunca executar um plano em proposta. Aprovação da organização documental,
pedido para investigar ou comando genérico para continuar não substitui a
aprovação de uma implementação claramente identificada.

## Organização

```text
docs/sdd/
  README.md
  _templates/
    spec.md
    plan.md
  total-do-carrinho/
    spec.md
    plan.md
  configuracao-por-ambiente/
    spec.md
    plan.md
  multiplos-carrinhos/
    spec.md
    plan.md
```

Pastas de exemplos só são criadas quando houver unidade em preparação.
Configuração por ambiente está validada. Pipeline de validação está Validada, com execução push/main confirmada
no run 38172472231; demais correções/features ainda não têm aprovação.
Total do carrinho (KZN-312) versão 1 Validado: 17 testes, confirmação manual
e checks do PR #3 concluídos. Merge manual pelo usuário pendente.
Preferir uma unidade por causa/regra; justificar agrupamento de mudanças
interdependentes sem esconder vários problemas num único commit.

## Conteúdo e rastreabilidade

- Nomear pasta e branch pelo objetivo concreto, em minúsculas com hífens.
  Não usar apenas IDs como fix-001 para identificar o trabalho.
- Manter ID oficial KZN, quando existir, nos metadados; FIX/INV são IDs
  internos do inventário e servem para rastrear a origem.
- Spec define comportamento e aceite; plan define arquivos, passos e provas.
- Registrar versão, estado, baseline e referência da aprovação nos dois.
- Registrar aprovação como mensagem do usuário + data e escopo; usar ID da
  mensagem se a ferramenta disponibilizar. Não inventar IDs ou datas.
- Mudança material exige nova revisão e invalida a aprovação da parte afetada.
- Marcar cada critério da spec no plano, incluindo isolamento e migração.
- Registrar resultado observado, não apenas resultado esperado.

## Estados

| Estado | Significado |
|---|---|
| Proposta | Documento em revisão; implementação não autorizada |
| Aprovado | Usuário aprovou explicitamente a versão e o escopo |
| Em implementação | Alterações autorizadas em andamento |
| Implementado | Código pronto; validação ainda pode estar pendente |
| Validado | Critérios executados e resultados registrados |
| Adiado/descartado | Motivo documentado, com evidência quando aplicável |

## Validação

Usar testes focados no risco: dinheiro, autenticação, posse, migração e checkout
merecem provas de regressão; texto documental pode ser conferido por diff e
links. Não impor cobertura completa ao teste técnico. Nunca usar o ERP real
para escritas automáticas. Testes com fake não provam o contrato real do SIAC.

## Retomada

Antes de continuar uma spec aprovada, conferir se código/contratos e documentos
permanecem compatíveis. Consultar aprovação registrada e não reinferi-la de
uma checklist preenchida pela IA. Se faltar informação, avançar na investigação
independente e explicitar a decisão necessária.

Contador do carrinho (KZN-318) versão 1 Validado: 23 testes, build, confirmação
manual e checks do PR #5 concluídos. Merge manual pendente.

Busca e paginação (KZN-325): versão 1 aprovada e Implementada; testes locais
frontend/backend e build passaram. Validação manual e checks remotos pendentes.
Contador (KZN-318) integrado na main pelo PR #5, merge 27217ff confirmado após pull.

Endereço selecionado no checkout (KZN-331): versão 1 aprovada e Implementada;
regressões locais/build passaram. Payload manual e checks remotos pendentes.

Carrinho por sessão (FIX-005): spec/plano versão 1 aprovados e Implementados;
27 testes novos, frontend 37/backend 23 e build passaram. Manual/CI pendentes.

## Precisão monetária implementada e validada localmente — 2026-10-11

FIX-003: usuário aprovou spec/plano versão 1 com “aprovado” nesta sessão.
Substituído floor por round em backend/src/lib/dinheiro.js/paraCentavos,
para valores finitos não negativos com até duas casas no domínio aprovado.
RED focado: 29 testes, 20 sucessos/9 falhas, incluindo subtotal 3.42 em vez de
3.45 e vínculo local 1998 em vez de 1999. GREEN: backend 35/35, frontend
37/37, build 60 módulos; sintaxe e diff passaram. Adicionados 12 testes:
nove conversões, ida/volta de 100001 valores, carrinho e pedido com ERP fake.
Carrinho 3×1.15+2×4.10=11.65; indisponível excluído e checkout bloqueado.
Pedido simulado conserva 19.99 como 1999 no SQLite em memória; endereço alheio
rejeitado, apenas carrinho do proprietário limpo, vínculo alheio ausente.
Sem .env/banco real, pedido real, dependências, schema ou contratos alterados.
Históricos não reparados; mais de duas casas exige política separada.
Estado: Validado localmente; manual opcional/CI não executados. Commit,
publicação e PR aguardam comando do usuário. Próxima ação: revisão/validação
pelo usuário e autorização para publicação. Registros anteriores são históricos.

## Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/precisao-monetaria e abertura do PR para main. Validação local concluída;
CI remoto será acompanhado. Validação manual não foi informada. Merge manual
pelo usuário; nenhuma autorização para integrar diretamente na main.

## Publicação da correção — 2026-10-11

Commit de implementação: 3f584ce. Branch fix/precisao-monetaria publicada.
PR #9: https://github.com/eduardofrois/kaizen-test/pull/9
Checks testes-backend e build-frontend passaram no run 38187488965,
commit 3f584ce: https://github.com/eduardofrois/kaizen-test/actions/runs/38187488965
Esta atualização documental gera nova execução de CI a acompanhar.
Merge permanece manual e pendente.
Validação manual não informada; ERP real não utilizado nos testes.
Os registros anteriores de publicação pendente descrevem etapas passadas.

## FIX-004 implementado — 2026-10-11

Usuário aprovou plano versão 1 com “aprovado”, após apresentação nesta sessão.
Branch fix/ultima-pagina. Produção: em Paginacao, comparação passou de
pagina >= totalPaginas - 1 para pagina >= totalPaginas. Nenhuma outra
alteração de produção, contrato, dependência, API, banco ou ERP nesta unidade.
Teste novo frontend/tests/paginacao.test.js carrega o módulo real transformado
pelo Vite existente, confere HTML renderizado e callbacks dos botões.
RED: nove testes, sete passaram e dois falharam (1/2 e 2/3). GREEN focado:
9/9; suíte frontend 46/46; backend 35/35; build passou com 60 módulos;
git diff --check passou. Sem servidor ou pedidos reais nos testes.
AC-01/02/03/04/06 comprovados por verificação isolada/regressões. AC-05 manual
pendente: percorrer catálogo até última página preservando filtros e voltar;
conferir pedidos apenas se histórico existente tiver páginas suficientes.
HTML/callback direto não equivalem a navegação real no navegador.
Estado Implementado. Sem commit, publicação ou PR; aguardar conferência e
comando do usuário. Registros anteriores descrevem etapas passadas.

## Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/ultima-pagina e abertura de PR para main. Checks locais concluídos;
validação manual não foi informada. CI remoto será acompanhado. Merge manual
pelo usuário; os registros anteriores de publicação pendente são históricos.

## Publicação de última página — 2026-10-11

Commit de implementação: 6607796. Branch fix/ultima-pagina publicada.
PR #10: https://github.com/eduardofrois/kaizen-test/pull/10
Checks testes-backend e build-frontend passaram para 6607796 no run
38187909239: https://github.com/eduardofrois/kaizen-test/actions/runs/38187909239
Esta atualização documental dispara novos checks a acompanhar. Manual pendente;
estado Implementado. Merge manual pelo usuário, não realizado nesta sessão.
Registros anteriores de publicação pendente são históricos.

## FIX-006 implementado — 2026-10-11

Aprovação do plano versão 1: usuário “aprovao”, após apresentação do plano.
Campo derivado quantidade_editavel adicionado no backend: produto ativo com
estoque positivo permite ajustar mesmo com quantidade acima do estoque;
zero/inativo/ausente/falha de consulta retornam false. disponivel e checkout
preservados. Linha extraída para LinhaItemCarrinho.jsx; input respeita inteiro
1..min(99,estoque), ocupado e capacidade; Remover preservado. Sem rascunho novo.
RED backend focado: 27 casos, 20 passaram/7 falharam por capacidade ausente.
Controles de conflito e posse já passaram antes da correção. RED frontend:
7 casos/7 falhas de habilitação, limites e guardas do handler. Após correção:
27/27 backend focados e 7/7 frontend focados; suítes completas backend44/44 e
frontend53/53; build passou com61 módulos. Adicionados9 testes backend e7 frontend.
Redução5→3 comprovada com subtotal60/contador3/checkoutliberado no fake; queda
adicional para2 retorna409, preserva quantidade e linhas de outro usuário.
Teste de posse retorna404. Componente real comprova input/callback, label,
mensagem, limites e bloqueios; não equivale a navegação em navegador.
Nota KZN-7F3A preservada e relida em carrinhoService. Revisão React focada:
sem hooks/requisições novos, callbacks e acessibilidade da linha preservados.
Nenhuma env, dependência, schema, banco real ou estoque SIAC alterado; testes
com SQLite em memória/fetch sintético, sem pedido real. Estado Implementado.
AC-01 a AC-04 passaram isoladamente; AC-05 conflito/posse passaram, apresentação
visual do erro não conferida; AC-06 regressões/build passaram, manual pendente.
Próximo passo: usuário conferir redução na linha pendente, total e checkout;
remoção de item sem estoque. Commit/publicação/PR aguardam comando explícito.
Os registros anteriores descrevem etapas históricas, não o estado atual.

## Autorização de publicação FIX-006 — 2026-10-11

Usuário: “pode commitar e abrir o pr”. Autorizados commit, publicação da branch
fix/ajuste-de-quantidade-com-estoque-reduzido e PR para main. Validação local
concluída; manual não informada. CI será acompanhado; merge manual pelo usuário.

## Publicação FIX-006 — 2026-10-12

Commit 58bb69f publicado na branch fix/ajuste-de-quantidade-com-estoque-reduzido.
PR #11: https://github.com/eduardofrois/kaizen-test/pull/11
Checks testes-backend e build-frontend passaram para 58bb69f no run
38198503574: https://github.com/eduardofrois/kaizen-test/actions/runs/38198503574
Nova execução acompanha esta atualização documental. Estado Implementado; manual pendente.
Merge permanece manual pelo usuário. Registros de publicação pendente acima
são históricos. Revisão do conteúdo staged passou após remover linha em branco
extra ao final do componente; nenhuma mudança comportamental adicional.

## FIX-007 implementado — 2026-10-12

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

## Validação manual e publicação autorizada — 2026-10-12

Usuário confirmou “validado, pode abrir o PR”, após roteiro de remoção,
salvamento/F5 e edição de telefone válido. Confirmação manual registrada sem
expor número pessoal. AC-05 concluído com regressões locais e confirmação
do usuário. Estado Validado; commit/publicação da branch e PR para main
autorizados. CI remoto será acompanhado; merge manual pelo usuário.
Registros anteriores de validação/publicação pendente são históricos.

## Publicação FIX-007 — 2026-10-12

Implementação publicada no commit40ea907, branch fix/remocao-de-telefone-do-perfil.
PR #12: https://github.com/eduardofrois/kaizen-test/pull/12
Checks testes-backend e build-frontend passaram no run38314449233:
https://github.com/eduardofrois/kaizen-test/actions/runs/38314449233
Validação manual confirmada pelo usuário. Estado Validado; merge manual pendente.
Esta atualização documental gera novos checks a acompanhar. Registros anteriores
de publicação/CI/manual pendentes são históricos. Nenhum merge realizado pela IA.

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
