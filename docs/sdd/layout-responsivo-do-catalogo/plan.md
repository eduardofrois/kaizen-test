# Plano de implementação — Layout responsivo do catálogo

**Versão:** 1
**Estado:** Validado pelo usuário — publicação autorizada
**Spec:** [spec.md](spec.md), versão 1 aprovada em 2026-10-12.
**Objetivo:** eliminar cortes no cabeçalho e nos cards em telas pequenas.
**Arquitetura:** classes responsivas nos componentes existentes, sem novo estado.
**Stack:** React/JSX, Tailwind 4, Vite e node:test existentes.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação deste plano versão 1.
**Execução:** sequencial nesta sessão, sem subagentes.

## Restrições globais

REQ-01 a REQ-06 da spec: navegação visível; marca/busca/ações em linhas próprias
abaixo de1024px; busca sem mínimo fixo; grade1/2/4 colunas nos limites640/1024;
preservar URL, sessão, eventos, contador, paleta e foco. Não esconder overflow
da página. Sem backend, contratos, schema, dependências ou múltiplos carrinhos.
Não corrigir INV-005 incidentalmente. Preservar a nota KZN-5D1E.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Alterar | frontend/src/componentes/Cabecalho.jsx | Distribuição de marca, busca e navegação |
| Alterar | frontend/src/paginas/Catalogo.jsx | Colunas responsivas |
| Condicional | frontend/src/componentes/CardProduto.jsx | Quebra de texto se houver corte após corrigir grade |
| Condicional | frontend/src/componentes/ui.jsx | Paginação se houver overflow na matriz |
| Atualizar | spec.md, plan.md, fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Evidências, status e pendências |

## Tarefa 1 — Cabeçalho e catálogo adaptáveis

**Aceites:** AC-01 a AC-05. Interfaces consumidas/produzidas permanecem iguais:
Cabecalho(), Catalogo(), CardProduto({produto,aoAdicionar,adicionando}) e
Paginacao({paginacao,aoMudar}). Nenhuma mudança nos handlers ou nos dados.

- [x] Conferir Git e aprovação do plano. Registrar reprodução inicial já
  observada: área útil341px, página702px e busca380px; screenshot do usuário
  também mostra cortes de preços e botões. Capturar evidência antes da mudança
  em largura útil medida, evitando informações pessoais.
- [x] No contêiner de Cabecalho, usar composição equivalente a:

```jsx
className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-4"
```

- [x] Marca mantém conteúdo/cores; adicionar shrink-0 e largura própria para
  evitar compressão. Formulário remove min-w-[380px] e usa:

```jsx
className="w-full min-w-0 lg:flex-1"
```

- [x] Navegação mantém posição DOM depois da busca, todos os links/botões e
  contador. Substituir alinhamento global ml-auto por composição equivalente:

```jsx
className="flex flex-wrap items-center gap-1 lg:ml-auto lg:shrink-0"
```

Não introduzir reordenação CSS que diverge do teclado ou menu recolhível.
- [x] Em Catalogo, substituir grade fixa por:

```jsx
className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
```

Manter filtros, requisições, paginação e eventos. Não alterar tamanho de página24.
- [x] Medir cards depois da correção. Se nome/marca sem espaços ainda exceder
  a largura, aplicar min-w-0 e [overflow-wrap:anywhere] apenas ao texto afetado
  em CardProduto. Não truncar descrição/preço/ação para esconder o defeito.
  Manter clamp existente na aplicação do veículo. Não mudar card se já couber.
- [x] Conferir Paginacao em320px. Se necessário, permitir flex-wrap no grupo
  de botões, preservando handlers, rótulos e regras de desabilitação.

## Tarefa 2 — Evidência visual, regressão e documentação

**Aceites:** AC-01 a AC-06. CSS exige navegador; não adicionar testes que apenas
comparam strings de classes. Não adicionar dependência de testes nesta unidade.

- [ ] Usar navegador local em larguras úteis320,375,390,640,768,1024,1280px,
  visitante e autenticado. Registrar solicitado versus efetivo, ajustando
  override até a largura útil alvo; se ferramenta não permitir, documentar
  limitação e solicitar conferência manual da largura faltante. Não contar
  largura solicitada como medida real.
- [ ] Medir DOM somente leitura, usando a API de navegador disponível:

```js
({
  largura: window.innerWidth,
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  busca: document.querySelector('#busca-topo').getBoundingClientRect().width
})
```

Exigir scrollWidth <= clientWidth+1, busca dentro da tela, navegação completa,
colunas previstas e nenhum texto/botão cortado. Conferir estados disponível,
indisponível e adicionando, nomes longos e contador preenchido.
- [ ] Capturar screenshots antes/depois em celular e desktop, com evidência
  sintética/pública. Para estado autenticado, usar sessão de teste autorizada
  ou pedir conferência manual; não ler/copiar cookies ou cadastrar contas reais.
  Não adicionar harness permanente nem expor dados pessoais no relatório.
- [ ] Navegar por Tab: marca, busca, ações, filtros, cards e paginação; conferir
  foco visível, ordem e ausência de controles cobertos pelo cabeçalho sticky.
  Rolar catálogo no celular e verificar espaço utilizável. Conferir cabeçalho
  nas rotas /entrar e /perfil (esta última exige sessão).
- [ ] Pesquisar amortecedor, aplicar categoria e Só com estoque, navegar por
  página e abrir produto. Conferir URL e controles mantidos, sem criar pedidos
  nem alterar estoque. Adição real ao carrinho fica na validação do usuário;
  não confundir observação visual de botão com prova do evento.
- [x] Executar `npm test` em frontend/ e backend/; `npm run build` em frontend/;
  `git diff --check` na raiz. Registrar resultados reais e arquivos condicionais.
- [x] Revisar os componentes editados conforme checklist React disponível,
  sem ampliar o escopo para refatoração de estado ou correção de outros bugs.
- [x] Atualizar documentos com medidas/screenshots, KZN-5D1E, regressões e
  pendências. Marcar Implementado enquanto houver aceite manual pendente.
- [x] Usuário valida em seu navegador; registrar confirmação antes de Validado.
- [ ] Após comando específico, revisar conteúdo/histórico/segredos, commitar
  `fix: adapta cabecalho e catalogo para telas pequenas`, publicar branch e
  abrir PR para main. Acompanhar checks. Merge manual pelo usuário.

## Matriz de validação

| Aceite | Prova | Resultado esperado | Observado |
|---|---|---|---|
| AC-01 | Medidas em7 larguras úteis,2 estados | Sem overflow horizontal | Pendente |
| AC-02 | Screenshot e inspeção de cabeçalho | Busca/ações/contador acessíveis | Pendente |
| AC-03 | Grade e conteúdo dos cards | 1/2/4 colunas sem cortes | Pendente |
| AC-04 | Teclado e navegação de catálogo | Foco/URL/eventos preservados | Pendente |
| AC-05 | Antes/depois, suítes e build | Desktop preservado e regressões passando | Pendente |
| AC-06 | Confirmação do usuário | Validação manual registrada | Pendente |

## Recuperação e autorrevisão

Sem migração: alteração visual não toca dados. Recuperação por reversão do
commit quando autorizado, sem reset ou remoção de dados. Cobertura: tarefa1
implementa REQ-01 a06; tarefa2 verifica todos os aceites. Arquivos condicionais
limitados aos cortes observados. Aprovação da spec não autoriza executar plano.

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
