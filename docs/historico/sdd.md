> Arquivo histórico preservado em 2026-10-13. Estados, propostas e pendências
> abaixo descrevem etapas passadas e não o projeto atual. Consulte o
> [relatório atual](../../RELATORIO.md), o [inventário](../../fix.md) e o
> [índice SDD](../sdd/README.md). Nenhum registro histórico concede autorização nova.

# Spec Driven Development

## Publicação MULTI-001 — 2026-10-13

Usuário solicitou PR detalhado da nova feature e link para avaliação.
Implementação enviada em `feat/multiplos-carrinhos` ao repositório
eduardofrois/kaizen-test. [PR #17](https://github.com/eduardofrois/kaizen-test/pull/17)
aberto contra main, sem conflitos na consulta. Checks testes-backend e
build-frontend da implementação passaram no
[run 38360777053](https://github.com/eduardofrois/kaizen-test/actions/runs/38360777053).

Validação local registrada: backend 123/123, frontend 94/94, build e navegador
simulado; 22 regressões TDD na revisão v2. A consolidação documental anterior
foi preservada localmente, fora do PR. Merge manual pendente; sem merge/deploy.
Atualização documental da publicação gerará nova CI, separada do run acima.

## Múltiplos carrinhos — situação da unidade em 2026-10-13

Spec/plano v2 aprovados e implementados, com 123 testes backend, 94 frontend,
build e navegação em ambiente simulado aprovados. Os quatro achados da revisão
foram corrigidos com TDD. Validação manual da v1 confirmada pelo usuário.

Usuário solicitou abrir PR detalhado da nova feature e enviar o link para
avaliação. Publicação desta unidade autorizada em eduardofrois/kaizen-test;
merge manual pelo usuário. Consolidação documental anterior é trabalho local
separado e não integra este envio. Registro abaixo preserva o histórico anterior.

[Spec](../sdd/multiplos-carrinhos/spec.md) · [Plano](../sdd/multiplos-carrinhos/plan.md) · [Recuperação](../sdd/multiplos-carrinhos/recuperacao.md)

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

## Situação atual — 2026-10-12

Quatro chamados e dez itens FIX implementados. O usuário confirmou que fez
a validação manual das correções e pediu a revisão dos registros nesta sessão.
Essa confirmação complementa as evidências automatizadas e manuais anteriores;
não acrescenta capturas por variante ou homologação do SIAC. Os checkboxes
específicos sem evidência individual permanecem distinguidos da confirmação
geral. Aprovações de implementação mantidas; nenhuma publicação autorizada
por esta revisão documental.

| Unidade | Referência | Situação/evidência |
|---|---|---|
| [Configuração por ambiente](../sdd/configuracao-por-ambiente/spec.md) | FIX-001 | Implementada; seis regressões originais e manual confirmados |
| [Pipeline de validação](../sdd/pipeline-de-validacao/spec.md) | CI-001 | Implementado; CI em PR e push/main registrada |
| [Total do carrinho](../sdd/total-do-carrinho/spec.md) | KZN-312 | Implementado; testes e manual confirmados |
| [Contador do carrinho](../sdd/contador-do-carrinho/spec.md) | KZN-318 | Implementado; testes e manual confirmados |
| [Busca e paginação](../sdd/busca-e-paginacao/spec.md) | KZN-325 | Implementada; testes e manual confirmados |
| [Endereço selecionado](../sdd/endereco-selecionado-no-checkout/spec.md) | KZN-331 | Implementado; payload e manual confirmados; sem prova de pedido SIAC |
| [Carrinho por sessão](../sdd/carrinho-por-sessao/spec.md) | FIX-005 | Implementado; testes determinísticos e troca manual confirmados |
| [Precisão monetária](../sdd/precisao-monetaria/spec.md) | FIX-003 | Implementada; testes e manual confirmados |
| [Última página](../sdd/ultima-pagina/spec.md) | FIX-004 | Implementada; testes e manual confirmados |
| [Ajuste de quantidade](../sdd/ajuste-de-quantidade-com-estoque-reduzido/spec.md) | FIX-006 | Implementado; testes e manual confirmados |
| [Remoção de telefone](../sdd/remocao-de-telefone-do-perfil/spec.md) | FIX-007 | Implementada; serviço/HTTP e manual confirmados |
| [Espaços na senha](../sdd/espacos-na-autenticacao-de-senha/spec.md) | FIX-008 | Implementado; HTTP/scrypt e manual confirmados |
| [Layout responsivo](../sdd/layout-responsivo-do-catalogo/spec.md) | FIX-009 | Implementado; medições e manual confirmados |
| [Documento e telefone](../sdd/limites-de-documento-e-telefone/spec.md) | FIX-010 | Implementado; testes de máscara e manual confirmados |
| [Múltiplos carrinhos](../sdd/multiplos-carrinhos/spec.md) | MULTI-001 | V2 aprovada/corrigida com TDD; backend 123/123, frontend 94/94, build/navegador simulado; manual da v1 confirmado; publicação pendente |

Após a implementação de múltiplos carrinhos, em 2026-10-13, a última validação
conjunta registrada passou com backend 114/114, frontend 81/81 e build de
67 módulos. Verificações da feature usam ERP simulado; manual confirmado pelo
usuário. [Revisão posterior](../sdd/multiplos-carrinhos/revisao.md) identificou quatro
falhas, corrigidas após aprovação da v2 com TDD. Resultado atual: backend
123/123, frontend 94/94, build 67 módulos e navegador desktop/mobile simulado;
AC-06/11 revalidados. Publicação pendente. O [RELATORIO.md](../../RELATORIO.md) geral preserva a
revisão anterior e será alinhado quando essa atualização for autorizada.

## Histórico de execução

### Múltiplos carrinhos implementado — 2026-10-13

Plano v1 aprovado com “aprovado” após pergunta explícita sobre implementar
na sessão. Migração, API, checkout protegido, seleção por aba e painel entregues
na branch feat/multiplos-carrinhos, sem publicação. Backend 114/114, frontend
81/81, build 67 módulos e verificações de diff/sintaxe passaram. Navegador
usou API real com SQLite temporário/ERP simulado, seis larguras, duas abas,
compra e envio incerto; ver evidências da unidade. Confirmação manual do
usuário pendente; histórico abaixo não representa a situação atual da feature.

### Spec aprovada e plano preparado — 2026-10-13

Usuário “aprovado” em resposta à apresentação da spec v1 e ao pedido de
aprovação para preparar o plano. Spec aprovada; plano v1 escrito com seis
tarefas, interfaces, migração, bloqueio persistente, validação visual e matriz
de aceites. Aprovação para implementar ainda pendente. Nenhum código, teste,
schema, dependência, protótipo, banco ou ERP alterado nesta preparação.

### Preparação de múltiplos carrinhos — 2026-10-13

Entrevista concluída com “confirmado” após respostas Q1–Q8. Criada spec v1 em
`multiplos-carrinhos/spec.md` com decisões de produto, propostas técnicas,
migração, isolamento por conta/carrinho e bloqueio de checkout incerto.
Confirmação da entrevista não aprova a spec escrita posteriormente nem sua
implementação. Próximo passo: revisão da spec, seguida da preparação do plano.
Somente documentação alterada; sem testes funcionais, build, migração ou
publicação nesta etapa. Registros anteriores preservam seu contexto histórico.

Relatos abaixo preservam o estado conhecido em cada etapa. Pendências antigas
de confirmação manual foram superadas pela consolidação de 2026-10-12.
Publicação e merge têm seus registros próprios, sem inferir situação remota atual.

## Histórico — Precisão monetária implementada e validada localmente — 2026-10-11

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

## Histórico — Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/precisao-monetaria e abertura do PR para main. Validação local concluída;
CI remoto será acompanhado. Validação manual não foi informada. Merge manual
pelo usuário; nenhuma autorização para integrar diretamente na main.

## Histórico — Publicação da correção — 2026-10-11

Branch fix/precisao-monetaria publicada.
PR #9: https://github.com/eduardofrois/kaizen-test/pull/9
Checks testes-backend e build-frontend passaram no run 38187488965,
execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38187488965
Esta atualização documental gera nova execução de CI a acompanhar.
Merge permanece manual e pendente.
Validação manual não informada; ERP real não utilizado nos testes.
Os registros anteriores de publicação pendente descrevem etapas passadas.

## Histórico — FIX-004 implementado — 2026-10-11

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

## Histórico — Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/ultima-pagina e abertura de PR para main. Checks locais concluídos;
validação manual não foi informada. CI remoto será acompanhado. Merge manual
pelo usuário; os registros anteriores de publicação pendente são históricos.

## Histórico — Publicação de última página — 2026-10-11

Branch fix/ultima-pagina publicada.
PR #10: https://github.com/eduardofrois/kaizen-test/pull/10
Checks testes-backend e build-frontend passaram no run
38187909239: https://github.com/eduardofrois/kaizen-test/actions/runs/38187909239
Esta atualização documental dispara novos checks a acompanhar. Manual pendente;
estado Implementado. Merge manual pelo usuário, não realizado nesta sessão.
Registros anteriores de publicação pendente são históricos.

## Histórico — FIX-006 implementado — 2026-10-11

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

## Histórico — Autorização de publicação FIX-006 — 2026-10-11

Usuário: “pode commitar e abrir o pr”. Autorizados commit, publicação da branch
fix/ajuste-de-quantidade-com-estoque-reduzido e PR para main. Validação local
concluída; manual não informada. CI será acompanhado; merge manual pelo usuário.

## Histórico — Publicação FIX-006 — 2026-10-12

Implementação publicada na branch fix/ajuste-de-quantidade-com-estoque-reduzido.
PR #11: https://github.com/eduardofrois/kaizen-test/pull/11
Checks testes-backend e build-frontend passaram no run
38198503574: https://github.com/eduardofrois/kaizen-test/actions/runs/38198503574
Nova execução acompanha esta atualização documental. Estado Implementado; manual pendente.
Merge permanece manual pelo usuário. Registros de publicação pendente acima
são históricos. Revisão do conteúdo staged passou após remover linha em branco
extra ao final do componente; nenhuma mudança comportamental adicional.

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

Implementação publicada na branch fix/remocao-de-telefone-do-perfil.
PR #12: https://github.com/eduardofrois/kaizen-test/pull/12
Checks testes-backend e build-frontend passaram no run38314449233:
https://github.com/eduardofrois/kaizen-test/actions/runs/38314449233
Validação manual confirmada pelo usuário. Estado Validado; merge manual pendente.
Esta atualização documental gera novos checks a acompanhar. Registros anteriores
de publicação/CI/manual pendentes são históricos. Nenhum merge realizado pela IA.

## Histórico — FIX-008 implementado — 2026-10-12

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

## Histórico — FIX-008 validado — 2026-10-12

Usuário confirmou “validei a correcao, pode abrir o PR”. Validação manual
confirmada; AC-06 concluído junto às regressões locais registradas acima.
Estado Validado. Commit, push da branch e abertura do PR autorizados nesta
sessão. CI remoto será acompanhado após a publicação; merge manual pelo usuário.
Registros anteriores de manual/autorização pendentes são históricos.

## Histórico — Publicação FIX-008 — 2026-10-12

Branch publicada:
`fix/espacos-na-autenticacao-de-senha`. PR #13 aberto para main:
https://github.com/eduardofrois/kaizen-test/pull/13
Estado Validado; testes locais e confirmação manual concluídos. Checks remotos
em acompanhamento. Merge manual pendente. Nenhum merge realizado pela IA.

## Histórico — Investigação FIX-009 — 2026-10-12

Main sincronizada; PR #13 ainda não integrado na consulta remota.
Branch fix/layout-responsivo-do-catalogo. Reprodução visual local como visitante:
viewport solicitado375x812, largura útil reportada341px; página/cabeçalho702px,
busca380px. Screenshot observado confirma corte do cabeçalho e cards comprimidos.
Nota de revisão KZN-5D1E lida em Cabecalho.jsx. Usuário escolheu ações visíveis,
distribuídas em linhas, sem menu recolhível. Spec versão1 em proposta em
 docs/sdd/layout-responsivo-do-catalogo/spec.md; aprovação e plano pendentes.
Sem código/testes/dependências alterados. Autenticado e matriz de larguras
permanecem pendentes; não declarar validação da correção nesta etapa.

## Histórico — Spec FIX-009 aprovada — 2026-10-12

Usuário aprovou spec versão1 com “se temos essas informações na spec, aprovada”,
após confirmar busca flexível e grade responsiva. Plano versão1 preparado em
docs/sdd/layout-responsivo-do-catalogo/plan.md. Implementação aguarda aprovação
do plano; nenhum código, teste ou dependência alterado nesta etapa.

## Histórico — FIX-009 implementado — 2026-10-12

Plano versão1 aprovado com “aprovado” nesta sessão. Alterados apenas
Cabecalho.jsx e Catalogo.jsx: marca sem compressão, busca flexível sem mínimo
380px, navegação com quebra de linha, cabeçalho em coluna abaixo1024px e grade
1/2/4 colunas nos limites640/1024px. Nota KZN-5D1E preservada e reavaliada:
o trecho do cabeçalho continha a restrição de largura responsável pelo corte.
Nenhum handler, contrato, estado React, paleta ou dependência alterado.
Revisão React: DOM/ordem de teclado e semântica preservados, sem novos hooks.

Medições no catálogo local como visitante (largura útil/clientWidth/scrollWidth
iguais em cada caso):320,375,390,640,768,1024,1280px. Colunas observadas:
1,1,1,2,2,4,4. Larguras da busca respectivamente288,343,358,608,736,587.45,715.45px.
Paginação em320px: largura288px e scrollWidth288px, sem ajuste necessário.
Não foi necessário alterar CardProduto ou ui.jsx. Busca amortecedor retornou
produtos; categoria SUSPENSAO e estoque atualizados na URL mantendo busca.
Tab da busca alcançou Entrar com outline solid. Login em375px sem overflow.
Screenshot local: /private/tmp/kaizen-fix009-mobile.png (artefato temporário,
não versionado). Evidência anterior: screenshot do usuário e medida341/702px.

Regressões: frontend53/53, backend65/65, build61 módulos passaram. Backend65
corresponde à baseline main; FIX-008 está em outro PR e não nesta branch.
Sem teste que replique classes CSS. Estado Implementado: faltam matriz
autenticada/contador/perfil, percurso completo de teclado/rolagem, adição e
confirmação manual pelo usuário. Estado adicionando e captura desktop ainda
não conferidos visualmente. Commit/publicação/PR aguardam comando explícito.

### Ajuste FIX-009 — ações de visitante

Em 2026-10-12, usuário solicitou Entrar e Criar conta ocupando a linha inteira
com larguras iguais. Aplicado flex-1/text-center abaixo1024px, preservando gap
e larguras pelo conteúdo no desktop. ItemMenu aceita className opcional.
Validação manual geral continua pendente.

Distribuição exata usa grid-cols-2 na navegação de visitante abaixo1024px,
pois flex-1 isolado pode diferir por causa dos paddings dos links. Navegação
autenticada continua flex-wrap; desktop usa flex.

## Histórico — Validação e publicação autorizada FIX-009 — 2026-10-12

Usuário confirmou “otimo, validado, pode abrir o PR”, incluindo o ajuste dos
botões Entrar/Criar conta em metades iguais. Validação manual confirmada pelo
usuário; não atribuir a essa confirmação execução detalhada da matriz de
todos os estados. Medidas de visitante e limitações registradas acima mantidas.
Build final após grid-cols-2 passou com61 módulos; git diff --check passou.
Commit, push e PR desta unidade autorizados. Merge manual pelo usuário.

## Histórico — Publicação FIX-009 — 2026-10-12

Branch `fix/layout-responsivo-do-catalogo` publicada.
PR #14: https://github.com/eduardofrois/kaizen-test/pull/14
Validação manual confirmada; checks remotos em acompanhamento. Merge manual
pendente. Nenhum merge realizado pela IA.

## Histórico — Investigação FIX-002 — 2026-10-12

Main sincronizada após merge do PR14. Branch fix/restricao-de-origem-cors.
Revisados comentários de app.js, proxy Vite, cookies e config.corsOrigem.
Proposta: permitir apenas origem configurada, padrão localhost5173 em dev/test
e nenhuma permissão CORS por padrão em produção; requisições seguem rotas
normalmente sem headers CORS quando origem não autorizada. CORS não é barreira
de autenticação/CSRF. Spec versão1 em docs/sdd/restricao-de-origem-cors/spec.md.
Aprovação e plano pendentes. Nenhum código/teste/env real alterado.

## Histórico — Spec FIX-002 aprovada — 2026-10-12

Usuário confirmou “spec aprovada, pode fazer o plan”. Plano versão1 preparado
em docs/sdd/restricao-de-origem-cors/plan.md: configuração canônica, callback
com comparação exata, testes HTTP/SQLite isolados e guia por ambiente.
Nenhuma variável nova; .env real preservada. Plano em revisão, implementação
não autorizada nesta etapa. Nenhum código/teste/dependência alterado.

## Histórico — FIX-002 implementado — 2026-10-12

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
git diff --check passaram. Baseline contém 65 testes backend anteriores;
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

## Histórico — FIX-002 validado — 2026-10-12

Usuário confirmou “validado, pode abrir o PR” após roteiro de reinício, catálogo,
login/perfil e sessão apósF5. AC-05 concluído com regressões e confirmação
manual. Estado Validado. Commit, publicação da branch e PR autorizados.
Confirmação de uso normal não equivale a exploração autenticada em navegador.
CI remoto será acompanhado; merge manual pelo usuário. Registros anteriores
de manual/autorização pendentes são históricos.

## Histórico — Publicação FIX-002 — 2026-10-12

Implementação publicada em `fix/restricao-de-origem-cors`.
PR #15: https://github.com/eduardofrois/kaizen-test/pull/15
Estado Validado, confirmação manual registrada. Checks remotos em acompanhamento;
merge manual pendente. Nenhum merge realizado pela IA.

## Histórico — Preparação FIX-010 — 2026-10-12

Main sincronizada após PR15. Branch fix/limites-de-documento-e-telefone.
Cadastro.jsx e DadosPessoais em Perfil.jsx sem maxLength; Campo já encaminha
props. Backend mantém documento18/telefone20 caracteres e regras de dígitos.
Spec versão1 propõe limites nativos nos quatro inputs, sem máscaras ou filtro
só numérico, preservando telefone opcional e zeros iniciais. Limite de entrada
não substitui validação do servidor nem impede valores programáticos.
Documento: docs/sdd/limites-de-documento-e-telefone/spec.md. Aprovação e plano
pendentes; nenhum código/teste/dependência alterado nesta etapa.

## Histórico — FIX-010 — spec revisada para máscaras — 2026-10-12

Por pedido do usuário, spec versão2 inclui CPF/CNPJ automático por quantidade
de dígitos (até11 CPF,12–14 CNPJ), telefone brasileiro fixo/celular com DDD,
limites14/11 dígitos, colagem/edição/cursor e preservação de zeros. Substitui
proposta de maxLength isolado. Sem DDI/ramal, algoritmo de dígitos verificadores
ou alteração da API. Versão2 em revisão; plano e implementação pendentes.
Nenhum código/teste/dependência alterado nesta etapa.

## Histórico — FIX-010 — spec v2 aprovada e plano preparado — 2026-10-12

Usuário aprovou versão2 com “aprovado”. Plano versão1 preparado em
docs/sdd/limites-de-documento-e-telefone/plan.md: funções puras compartilhadas,
CampoComMascara, integração cadastro/perfil, cursor/exclusão e testes reais
de entrada. Legado fora do domínio preservado ao carregar; telefone removível.
Plano em revisão; nenhum código/teste/dependência alterado nesta etapa.

## Histórico — FIX-010 implementado — 2026-10-12

Plano versão1 aprovado com “aprovado” após apresentação nesta sessão. Criados
mascaras.js e CampoComMascara.jsx; integrados documento/telefone em Cadastro
e DadosPessoais de Perfil. CPF/CNPJ automático11/12 dígitos, telefone fixo/
celular10/11, limites14/11, zeros preservados e payload textual formatado.
Sem maxLength nativo que corte colagem prematuramente; máscara limita dígitos.
Campo genérico, API, dependências e schema intactos. Inicialização formata apenas
valores completos no domínio e preserva legado fora do domínio até edição.

26 testes novos de funções reais, incluindo tabelas e todas as posições de
exclusão ao redor da pontuação; frontend79/79, backend89/89 e build63 módulos
passaram; diff --check passou. Primeira execução focada23/24: expectativa de
cursor escrita como14 estava incorreta (fim da saída tem15); corrigida a
asserção após conferir comprimento. Não é RED comportamental do defeito original;
reprodução original vem da confirmação manual/inspeção registrada anteriormente.

Navegador no cadastro: digitação sintética produziu01.234.567/8901-23; telefone
formatado; colagem com máscara e excesso limitada corretamente; exclusão no
meio produziu012.345.678-0 com cursor11. Nenhum cadastro/perfil enviado.
Revisão React: reutilização de componente, handlers compatíveis, sem estado
paralelo do valor; ref de seleção restaurada após render. Labels/erros mantidos.
Estado Implementado. Testes puros não comprovam toda interação: perfil
autenticado/persistência, autofill nativo, teclado virtual, atalhos/desfazer e
composição ainda precisam de conferência. AC-01 a04 parcialmente comprovados
isoladamente/cadastro; AC-05 regressões/build passaram, manual pendente.
Próximo passo: usuário validar nas duas telas digitação, colagem, troca CPF/CNPJ,
fixo/celular, seleção/exclusão no meio e remoção de telefone com salvar/F5.
Sem dados pessoais nos docs. Commit/push/PR aguardam comando específico.

## Histórico — FIX-010 validado — 2026-10-12

Usuário confirmou “validado, pode abrir o PR” após roteiro das duas telas,
colagem/edição e remoção de telefone. Estado Validado pelo usuário; regressões
79 frontend/89 backend e build registrados acima. Confirmação não equivale
a prova automatizada de autofill/composição/teclado virtual; limitações mantidas.
Commit, push e PR desta unidade autorizados; merge manual pelo usuário.
Registros anteriores de manual/publicação pendentes são históricos.

## Histórico — Publicação FIX-010 — 2026-10-12

Implementação publicada em `fix/limites-de-documento-e-telefone`.
PR #16: https://github.com/eduardofrois/kaizen-test/pull/16
Validação manual confirmada. Checks remotos em acompanhamento; merge manual
pendente. Nenhum merge realizado pela IA.

## Histórico — Atualização do PR #13 e resolução de conflitos — 2026-10-12

Usuário solicitou corrigir os conflitos do PR #13. Incorporada a main
na branch `fix/espacos-na-autenticacao-de-senha`, preservando os
registros da FIX-008 e os trabalhos posteriores (layout, CORS e máscaras).
Os conflitos eram documentais em RELATORIO.md, fix.md, docs/investigacao.md
e docs/sdd/README.md; o código foi integrado automaticamente, sem alteração
adicional de comportamento. Revisado o diff contra main: permanece restrito
à correção de autenticação, seus testes e documentação.
Validação conjunta: backend96/96, frontend79/79 e build63 módulos passaram;
git diff --check passou. Nenhum teste manual novo realizado nesta atualização.
PRs #14, #15 e #16 já integrados à main. PR #13 continua aberto: atualização
da branch autorizada, checks remotos a acompanhar e merge manual pelo usuário.
