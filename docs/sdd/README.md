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

## Investigação FIX-009 — 2026-10-12

Main sincronizada em f744b39; PR #13 ainda não integrado na consulta remota.
Branch fix/layout-responsivo-do-catalogo. Reprodução visual local como visitante:
viewport solicitado375x812, largura útil reportada341px; página/cabeçalho702px,
busca380px. Screenshot observado confirma corte do cabeçalho e cards comprimidos.
Nota de revisão KZN-5D1E lida em Cabecalho.jsx. Usuário escolheu ações visíveis,
distribuídas em linhas, sem menu recolhível. Spec versão1 em proposta em
 docs/sdd/layout-responsivo-do-catalogo/spec.md; aprovação e plano pendentes.
Sem código/testes/dependências alterados. Autenticado e matriz de larguras
permanecem pendentes; não declarar validação da correção nesta etapa.

## Spec FIX-009 aprovada — 2026-10-12

Usuário aprovou spec versão1 com “se temos essas informações na spec, aprovada”,
após confirmar busca flexível e grade responsiva. Plano versão1 preparado em
docs/sdd/layout-responsivo-do-catalogo/plan.md. Implementação aguarda aprovação
do plano; nenhum código, teste ou dependência alterado nesta etapa.

## FIX-009 implementado — 2026-10-12

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
corresponde à baseline main f744b39; FIX-008 está em outro PR e não nesta branch.
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

## Validação e publicação autorizada FIX-009 — 2026-10-12

Usuário confirmou “otimo, validado, pode abrir o PR”, incluindo o ajuste dos
botões Entrar/Criar conta em metades iguais. Validação manual confirmada pelo
usuário; não atribuir a essa confirmação execução detalhada da matriz de
todos os estados. Medidas de visitante e limitações registradas acima mantidas.
Build final após grid-cols-2 passou com61 módulos; git diff --check passou.
Commit, push e PR desta unidade autorizados. Merge manual pelo usuário.

## Publicação FIX-009 — 2026-10-12

Implementação: `c50fead`. Branch `fix/layout-responsivo-do-catalogo` publicada.
PR #14: https://github.com/eduardofrois/kaizen-test/pull/14
Validação manual confirmada; checks remotos em acompanhamento. Merge manual
pendente. Nenhum merge realizado pela IA.

## Investigação FIX-002 — 2026-10-12

Main sincronizada em14f5163 após merge do PR14. Branch fix/restricao-de-origem-cors.
Revisados comentários de app.js, proxy Vite, cookies e config.corsOrigem.
Proposta: permitir apenas origem configurada, padrão localhost5173 em dev/test
e nenhuma permissão CORS por padrão em produção; requisições seguem rotas
normalmente sem headers CORS quando origem não autorizada. CORS não é barreira
de autenticação/CSRF. Spec versão1 em docs/sdd/restricao-de-origem-cors/spec.md.
Aprovação e plano pendentes. Nenhum código/teste/env real alterado.

## Spec FIX-002 aprovada — 2026-10-12

Usuário confirmou “spec aprovada, pode fazer o plan”. Plano versão1 preparado
em docs/sdd/restricao-de-origem-cors/plan.md: configuração canônica, callback
com comparação exata, testes HTTP/SQLite isolados e guia por ambiente.
Nenhuma variável nova; .env real preservada. Plano em revisão, implementação
não autorizada nesta etapa. Nenhum código/teste/dependência alterado.

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
