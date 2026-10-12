# Spec — Layout responsivo do catálogo

**Versão:** 1
**Estado:** Validado pelo usuário — publicação autorizada
**Origem:** FIX-009
**Baseline/data:** f744b39; 2026-10-12
**Branch:** fix/layout-responsivo-do-catalogo
**Aprovação da spec:** 2026-10-12; usuário “se temos essas informações na spec, aprovada”.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação do plano versão 1.

## Problema e evidência

Cabecalho.jsx mantém marca, busca com mínimo de 380px e navegação na mesma
linha. Catalogo.jsx fixa quatro colunas em todas as larguras. Reprodução
no navegador local como visitante em 2026-10-12: viewport solicitado de
375x812; área útil efetivamente reportada pelo navegador de 341px;
scrollWidth da página e do cabeçalho de 702px; busca com 380px.
Screenshot observado confirma busca cortada, navegação fora da área visível
e cards comprimidos. Medida solicitada e medida efetiva não são equivalentes.
Estado autenticado e demais larguras ainda não medidos.
Nota de revisão lida no cabeçalho: **KZN-5D1E**.

## Objetivo e escopo

Adaptar cabeçalho compartilhado e grade do catálogo para celular, preservando
paleta, conteúdo, rotas e comportamento. Inclui ajustes mínimos em cards ou
paginação apenas se necessários para os critérios abaixo.
Fora: múltiplos carrinhos, painel na vitrine, redesenho das outras páginas,
correção de sincronização do input com histórico (INV-005), backend e contratos.

## Requisitos e interface

- REQ-01: ações de navegação sempre visíveis, sem menu recolhível. Preferência
  expressa pelo usuário nesta sessão; não equivale à aprovação desta spec.
- REQ-02: abaixo de 1024px, marca, busca e navegação ocupam linhas próprias,
  nesta ordem visual e de teclado. Busca ocupa a largura disponível, sem
  mínimo fixo. Navegação pode quebrar linha, sem ocultar ações.
- REQ-03: a partir de 1024px, manter cabeçalho em uma linha se couber, com
  busca flexível e marca/ações legíveis; permitir adaptação sem overflow.
- REQ-04: catálogo com uma coluna abaixo de 640px, duas de 640 a 1023px e
  quatro a partir de 1024px. Textos/preços/botões não se sobrepõem nem cortam.
- REQ-05: preservar busca/filtros/página na URL, eventos, contador, sessão,
  estados de estoque, links, foco visível e tokens de contraste existentes.
- REQ-06: não mascarar overflow com overflow-x:hidden no body/página.

Sem alterações HTTP, schema, persistência ou dependências. O cabeçalho é
compartilhado; conferir sua apresentação também nas telas de entrar e perfil.
A política de colunas vale para o catálogo, não para outras grades do sistema.

## Decisões e alternativas

Proposta: quebra de linhas e breakpoints Tailwind existentes. Mantém ações
descobríveis e reduz mudanças comportamentais. Menu recolhível foi apresentado
e não escolhido pelo usuário. Grade auto-fit seria mais fluida, mas torna
menos previsível o número de colunas; breakpoints explícitos facilitam conferir
a composição existente no desktop. Painel de carrinho pertence a outra unidade.

## Critérios de aceite

- [ ] AC-01: em larguras úteis 320, 375, 390, 640, 768, 1024 e 1280px,
  página do catálogo sem overflow horizontal (scrollWidth <= clientWidth +1).
- [ ] AC-02: visitante e autenticado acessam marca, busca e todas as ações,
  inclusive contador e Sair, sem corte ou sobreposição.
- [ ] AC-03: grade respeita colunas propostas; descrição, preço, estoque e
  ação dos cards são legíveis. Validar produto com nome longo e sem estoque.
- [ ] AC-04: teclado alcança busca, navegação, filtros, produtos e paginação
  com foco visível; busca/filtros/paginação continuam funcionando pela URL.
- [ ] AC-05: desktop preserva identidade; screenshots antes/depois e medidas
  reais registradas; regressões frontend/backend e build passam.
- [x] AC-06: usuário confirma validação manual antes de marcar Validado.

## Riscos e validação

Cabeçalho em várias linhas fica mais alto e é sticky: verificar que conteúdo
continua utilizável em celular, incluindo rolagem e foco. Autenticação aumenta
número de ações. Não criar/alterar contas reais automaticamente.
Registrar medidas efetivas de viewport; não assumir que override foi aplicado
exatamente. Testes renderizados/SSR não comprovam layout: medidas e screenshots
no navegador são necessários. Usar dados sintéticos quando possível, sem
pedidos no ERP, e não expor dados pessoais nos registros.

## Entrega e histórico

Atualizar fix.md, RELATORIO.md, investigação e índice SDD conforme evidências.
Spec preparada após investigação e preferência do usuário. Implementação não
aprovada; após aprovação desta spec, detalhar plan.md para revisão separada.
Commit, publicação e PR dependem de comando específico. Merge manual.

## Aprovação — 2026-10-12

Spec versão 1 aprovada pelo usuário após confirmar que busca flexível e grade
responsiva estão incluídas. Plano versão 1 preparado para revisão separada.

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

## Ajuste solicitado pelo usuário — 2026-10-12

Usuário solicitou Entrar e Criar conta ocupando toda a largura disponível,
com metade para cada um. Aplicar abaixo1024px: ambos com flex-1 e texto
centralizado; o gap existente fica entre as duas metades iguais do espaço
útil. Desktop mantém largura pelo conteúdo. Pedido direto autoriza o ajuste
visual dentro da unidade; nenhuma mudança em navegação ou sessão.
ItemMenu recebe className opcional para aplicar distribuição apenas a Entrar.

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
