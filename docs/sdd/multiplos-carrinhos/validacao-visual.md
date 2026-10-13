# Evidência visual e integrada — múltiplos carrinhos

Data: 2026-10-13. Node 24.14.1. Navegador do Codex, ambiente sintético separado
na porta 3199, API Express real, build React e SQLite temporário. Todo acesso
ERP interceptado pelo simulador com origem .invalid; contas e produtos sintéticos.
Este ensaio não é homologação do SIAC nem confirmação manual do usuário.
Separadamente, o usuário confirmou a v1 em 13/10/2026; a v2 tem ensaio
simulado próprio no plano. PR #17 integrado à main.

## Protótipo

HTML descartável em /private/tmp/kaizen-multi-prototipo.html, servido pelo
ambiente sintético antes da composição dos componentes. Conferidos painel
lateral, botão inferior e distribuição dos cards. Nas larguras solicitadas
320/375/390/768/1024/1280, o zoom do navegador entregou inicialmente larguras
úteis 291/341/354/698/931/1163, sem overflow. A interface final foi medida com
o viewport compensado para as larguras úteis previstas.

## Interface final

| Largura útil | clientWidth | scrollWidth | Painel lateral |
|---|---|---|---|
| 320 | 320 | 320 | Oculto, botão/painel sobreposto |
| 375 | 375 | 375 | Oculto, botão/painel sobreposto |
| 390 | 390 | 390 | Oculto, botão/painel sobreposto |
| 768 | 768 | 768 | Oculto, botão/painel sobreposto |
| 1024 | 1024 | 1024 | Visível |
| 1280 | 1280 | 1280 | Visível |

Uma primeira medição do alvo 390 resultou em 391 por arredondamento; refeita
com largura útil 390. Medidas vieram do DOM renderizado, não das classes CSS.
Viewport restaurado ao final. Dez carrinhos e sete nomes longos conferidos;
botão de criar desabilitado no décimo. Desktop com duas colunas de cards ao
lado do painel, sem compressão de quatro colunas.

Capturas temporárias, não versionadas:

- Painel mobile: `/private/tmp/kaizen-multi-mobile-painel.jpg`, largura útil
  390, dez carrinhos, Civic com duas unidades e total R$39,98 no build final.
- Painel desktop: `/private/tmp/kaizen-multi-desktop.jpg`, largura útil 1280,
  busca/página preservadas e painel ao lado dos produtos sintéticos.

## Percursos observados

- Login sintético; criação de Gol do João/Civic prata; Civic definido como
  principal; adição de produtos diferentes com conteúdos independentes.
- Busca a e página 2 mantidas ao trocar o ativo. Em medição estabilizada,
  scrollY 2968,636 permaneceu igual antes/depois da troca, com painel sticky.
- Quantidade de Gol alterada para três na vitrine; checkout identificado
  pelo nome e total R$59,97. Compra fake confirmada; Gol vazio com nome
  mantido, Civic intacto. Ao carregar novamente, Civic principal selecionado.
- No celular, escolha alternativa pelo card adicionou peça ao Gol e o tornou
  ativo. Painel abriu sem sair do catálogo; edição final do Civic 1→2 resultou
  em duas peças e R$39,98, sem mudar a busca por ação do carrinho.
- Duas abas: primeira ativa em Gol, segunda iniciou no Civic principal.
  A segunda não alterou o destino da primeira.
- Simulação de falha de transporte exibiu Pedido em verificação, manteve item
  do Gol e desabilitou confirmação. F5 voltou ao principal Civic livre;
  selecionar Gol novamente mostrou bloqueio persistido e renomeação indisponível.
- Após corrigir o fixture de cliente, uma nova compra fake percorreu até
  Pedido confirmado e detalhe renderizado. O detalhe do simulador é mínimo;
  a prova dos itens enviados e do total salvo em centavos é feita pelos testes
  de serviço/HTTP, sem atribuir valores ilustrativos do fake ao SIAC real.
- Modal: foco inicial em Fechar carrinho. Detectada saída de foco via
  Shift+Tab na primeira versão nativa; adicionado ciclo explícito. Rechecagem:
  Shift+Tab foi ao último controle, Tab voltou ao primeiro; Escape fechou e
  devolveu foco ao botão inferior. URL preservada ao abrir/fechar.

O simulador inicial tinha detalhe de pedido sem cliente e imagem ausente;
o erro de renderização decorrente era do fixture, corrigido no servidor
temporário, sem alterar PedidoDetalhe ou contrato da loja. O comando de
controle do simulador abriu página bloqueada no navegador, mas alcançou a
rota e ativou a falha, observada no checkout; não foi bloqueio de aprovação.

## Limites de evidência

Respostas atrasadas, 401/rede/500 com recarga, HTTP malicioso, estoque e
recuperação têm provas isoladas descritas na spec/plano. Não foi feita
interceptação de cada falha no navegador, auditoria integral de contraste,
teclado virtual real ou ensaio com SIAC real. Os artefatos visuais são temporários e podem não existir em outro checkout;
os resultados e limites do ensaio ficam registrados aqui. Confirmação humana
da v1 e integração da v2 têm os registros próprios indicados no início.
