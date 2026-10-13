# Revisão posterior à validação manual — 2026-10-13

**Estado atual:** REV-01 a REV-04 corrigidos na revisão v2 aprovada e validada
com TDD; resultados no final deste documento. Reproduções iniciais abaixo são
históricas e descrevem o código anterior às correções.

Pedido do usuário: “Validei, não encontrei nada. Gostaria que voce desse mais
uma analisada no codigo que foi feito para ver se voce encontra alguma
brecha/falha”. Validação manual confirmada para o percurso conferido pelo
usuário; não há confirmação específica de criação de pedido no SIAC real.

Na etapa inicial desta revisão, a branch era feat/multiplos-carrinhos e a
implementação ainda não estava commitada. O trecho descreve aquele momento. Revisão
direta das rotas, serviços, migração, cliente ERP, controlador e consumidores
React, com roteiro da skill gitnexus-pr-review. O repositório não consta no
índice GitNexus disponível; nenhuma conclusão depende de grafo desatualizado
ou de outro projeto. Não houve delegação nem alteração de código/testes.

## Achados confirmados

### REV-01 — P2 — Listagem antiga afeta uma seleção nova

Em `frontend/src/lib/carrinhoPorSessao.js:42–58`, a listagem valida somente
ciclo e sequência de listas. Selecionar ou criar carrinho não invalida a lista
pendente. Dois cenários determinísticos no controlador real:

1. Listagem iniciada em Gol fica retida; selecionar Civic termina com sucesso;
   a listagem antiga falha e publica erro/representação vazia sobre o Civic.
2. Listagem anterior à criação fica retida; criar/selecionar carrinho ID 3
   termina; a resposta antiga contém apenas IDs 1/2. Ela interpreta ID 3 como
   excluído, troca para ID 1 e apresenta aviso falso de exclusão em outra aba.

Impacto: seleção/itens exibidos deixam de corresponder à operação mais recente;
o novo carrinho continua no banco, mas some da lista local até uma recarga.
Uma adição posterior usa o carrinho que a resposta antiga tornou ativo.

Correção recomendada: invalidar respostas anteriores a mudanças locais na
coleção e vincular a publicação de erro/conteúdo à seleção de origem. Manter
detecção de exclusão real sem inferi-la de uma lista já superada.

### REV-02 — P2 — Resposta de escrita faz a versão exibida regredir

Em `frontend/src/lib/carrinhoPorSessao.js:80–83`, a resposta de mutação é
publicada sem comparar versão. Reprodução: alteração começa no ID 1 e sua
resposta versão 2 fica retida; outra aba altera o mesmo carrinho, e uma recarga
aceita versão 3/quantidade 7; a resposta retida chega e substitui por versão
2/quantidade 2. `carregar()` tem guarda de versão, mas `mutar()` não a aplica.

Impacto: quantidades/total antigos reaparecem. Uma próxima alteração absoluta
de quantidade baseada na tela pode substituir a edição da outra aba. O backend
ainda rejeita checkout com versão antiga; não foi comprovada compra incorreta.

Correção recomendada: aceitar snapshots de escrita com as mesmas garantias de
identidade/versão das leituras e reconciliar a seleção atual quando necessário.

### REV-03 — P2 — Fila de itens é global à aba

Em `frontend/src/lib/carrinhoPorSessao.js:8,73,93`, todos os carrinhos usam a
mesma promessa `fila`, embora o plano T4 determine serialização por carrinho.
No controlador real: adição do Gol fica retida; selecionar Civic funciona;
a adição no Civic só chama sua API depois que a resposta do Gol é liberada.
Enquanto aguarda a fila, `ocupado` está falso.

Limite da prova: a troca foi chamada diretamente no controlador. Na interface,
o seletor de `GerenciadorCarrinhos.jsx` usa o `ocupado` global e normalmente
impede essa troca enquanto a operação do Gol está pendente; isso também prende
o usuário ao carrinho lento. Não foi realizado novo ensaio de navegador desta
interação. O cliente HTTP não define timeout próprio, logo não há prazo local
garantido para uma requisição pendente liberar a fila.

Correção recomendada: fila e ocupação por ID, preservando serialização dentro
do mesmo carrinho e permitindo selecionar/trabalhar em outro. Manter guardas
que impedem operações ainda não enviadas de mudar de destino.

### REV-04 — P2 — Número ERP conhecido é descartado em resposta parcial

Em `backend/src/erp/cliente.js:128–131`, uma resposta com número válido, mas
total ausente/inválido, lança erro sem preservar o número. O catch em
`pedidoService.js:45–48` marca a tentativa incerta; `registrarNumeroErp()` só
é chamado no caminho de sucesso completo.

Reprodução com serviços reais, SQLite em memória e ERP simulado: POST retorna
`{dados:{numero:'PED-REVISAO-SINTETICO',valor_total:null}}`. Resultado observado:
um POST, `CHECKOUT_INCERTO`, itens preservados, estado `incerto` e
`numero_erp=null`. Contraria a decisão da spec de persistir o número assim
que disponível. O bloqueio contra reenvio funciona; o problema é perder a
referência necessária para recuperar um pedido possivelmente criado.

Correção recomendada: transportar e persistir a referência válida mesmo quando
outros campos impedem conclusão; manter bloqueio e não confiar no total inválido.

## Evidência e limites

- `node /private/tmp/kaizen-revisao-concorrencia.mjs`: quatro cenários passaram
  nas asserções que demonstram REV-01 (duas variantes), REV-02 e REV-03.
- `node /private/tmp/kaizen-revisao-checkout.mjs`: confirmou REV-04 com helper
  isolado existente; sem acesso ao ERP ou banco reais.
- `npm test` em backend: 114/114; em frontend: 81/81, reexecutados nesta revisão.
  As suítes atuais não cobrem os intercalamentos/resposta parcial acima.
- Scripts transitórios fora do repositório; ordem de eventos, resultados e
  causas ficam descritos aqui. Regressões versionadas devem acompanhar as
  correções depois da aprovação SDD correspondente.
- Inspeção de posse: rotas privadas autenticam e serviços verificam proprietário
  por ID; não foi identificado acesso cruzado entre contas nos fluxos revisados.
  Isso não equivale a auditoria exaustiva de segurança ou teste de produção.
- Sem build novo, navegador novo, commit, publicação ou deploy nesta revisão.

## Estado e próxima ação na revisão inicial

Validação manual do usuário registrada; quatro achados abertos. Reabertos AC-06
e AC-11 quanto às lacunas acima; as provas anteriores permanecem históricas.
Recomenda-se corrigir antes da publicação. Revisar spec/plano e obter aprovação
explícita para essas correções conforme AGENTS.md. Este pedido de análise não
foi convertido em autorização para modificar implementação ou testes.

Em seguida, usuário solicitou “arrume o que voce encontrou usando TDD”.
[Spec v2](spec.md) e [plano v2](plan.md) preparados para correção dos quatro
achados. Apresentação/aprovação da revisão escrita pendentes conforme AGENTS.md;
nenhum código/teste alterado ou RED/GREEN executado nesta preparação.

## Correções da v2 concluídas — 2026-10-13

Usuário aprovou explicitamente spec/plano v2 com “aprovado” após apresentação
dos links e pergunta para implementar. Os quatro achados foram corrigidos:

- REV-01: seleção/gestão invalidam listagens anteriores; duas regressões RED
  passaram após correção; exclusão externa e erros atuais continuam cobertos.
- REV-02: leitura/escrita validam ID e versão; mutação não invalida recarga
  mais nova. RED 1/4→GREEN 4/4 nos novos casos.
- REV-03: filas/ocupação por ID e ciclo, gerindo separado; mesma origem ordenada,
  cancelamento/logout protegidos. RED 3/7→GREEN 7/7. Seletor conferido no
  navegador desktop/mobile com Gol retido e Civic concluindo antes dele.
- REV-04: erro interno transporta número conhecido, serviço persiste antes
  de marcar incerta; falha local continua protegida. RED 5/9→GREEN 9/9,
  incluindo número inválido e reabertura SQLite.

Novos testes versionados: 13 frontend e nove backend. Suítes completas:
backend 123/123; frontend 94/94; build 67 módulos; sintaxe/diff passaram.
Detalhes de comandos e resultados em [plan.md](plan.md). AC-06/11 revalidados.
Navegador usou somente ERP fake/SQLite temporário, zero pedidos; a referência
conhecida continua exigindo verificação, não autoriza reenviar/concluir sozinha.
Sem nova dependência, schema, commit, publicação, CI remoto ou deploy.

## Situação da entrega — 2026-10-13

Os quatro achados foram corrigidos na v2 e integrados no PR #17, merge
76eca4d. A suíte atual passou com 123 testes backend e 94 frontend; build
67 módulos. Registros anteriores de achados abertos e publicação pendente
são históricos. A revisão documental atual não altera os resultados TDD.
