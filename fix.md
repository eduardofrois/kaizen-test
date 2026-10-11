# Inventário de correções e investigação — Kaizen

Atualizado em **2026-10-11**. Baseline lida: commit original **81897d5**.
Este arquivo é o contexto detalhado para retomar o trabalho em outra sessão.
Distingue correções executadas de propostas ainda sem aprovação.

## Como usar este arquivo

1. Leia AGENTS.md, README.md e as fronteiras em docs/ai/.
2. Escolha uma unidade, prepare `docs/sdd/<nome-descritivo>/spec.md` e `plan.md`.
3. Obtenha aprovação explícita para implementar antes de editar aplicação,
   testes, schema, dependências ou contratos.
4. Após executar, registre arquivos alterados e evidência de validação real.
5. Atualize o RELATORIO.md quando sua edição estiver autorizada.

As linhas referidas abaixo correspondem à baseline; podem mudar. Procure
também pelo símbolo indicado. Não há compromisso de existir exatamente sete
bugs extras. Os nove IDs FIX são o agrupamento desta investigação, não IDs da
empresa. Pontos INV estão separados por dependerem de confirmação ou decisão.

### Grau de evidência

- **Estática:** comportamento identificado por leitura do código; sem teste
  integrado que percorra navegador/API/ERP.
- **Isolada:** função/expressão original executada em memória com entradas
  controladas e, quando necessário, stubs de banco/ERP.
- **Integrada:** aplicação real percorrida; ainda não executada nesta etapa.
- **Risco/decisão:** condição possível ou regra ambígua que precisa de definição.

Scripts isolados foram transitórios, não salvos como suíte. Não houve chamadas
de escrita ao SIAC. FIX-001 foi corrigido e validado isoladamente; demais correções pendentes.

O preenchimento inicial de RELATORIO.md foi aprovado em 2026-10-11 e registra
estes achados com os graus de evidência e pendências. Essa aprovação não
autoriza outras correções. Configuração por ambiente foi aprovada separadamente
em 2026-10-11 e implementada nesta sessão.

## Visão geral

| ID | Assunto | Evidência | Prioridade proposta |
|---|---|---|---|
| FIX-001 | Credenciais e segredo JWT literais/fallback | Estática | Crítica se defaults forem usados; tratar antes da publicação |
| FIX-002 | CORS com qualquer origem e credenciais | Estática | Alta; impacto depende do ambiente |
| FIX-003 | Perda de centavos na conversão monetária | Isolada | Alta |
| FIX-004 | Botão Próxima bloqueia última página | Isolada | Alta |
| FIX-005 | Carrinho não acompanha login/logout/troca de conta | Estática | Alta |
| FIX-006 | Estoque reduzido impede ajuste de quantidade na UI | Estática | Alta |
| FIX-007 | Telefone opcional não pode ser removido | Isolada | Média |
| FIX-008 | Login/troca de senha removem espaços aceitos no cadastro | Isolada | Alta |
| FIX-009 | Cabeçalho e grade inadequados para telas pequenas | Estática; visual pendente | Média |

Prioridades são propostas para ordenar trabalho, não decisões aprovadas.

## FIX-001 — Segredos literais e configuração com fallback

**Estado:** corrigido e validado isoladamente em 2026-10-11. Spec/plan aprovados em
docs/sdd/configuracao-por-ambiente/. O ID FIX-001 é referência do inventário;
o trabalho é nomeado pelo que faz.

**Onde:** backend/src/config.js, bloco PADRAO (linhas 16–20), montagem de
config.jwt/config.erp (35–44), validarConfig() (54 em diante).
Nota de leitura associada: **KZN-2B9C**.

**O que foi encontrado:** o código contém um segredo de assinatura JWT e um
token ERP literais. Quando JWT_SEGREDO ou ERP_TOKEN estão ausentes/vazios,
`?.trim() || PADRAO...` seleciona esses valores. A URL ERP também recebe padrão.
Consequentemente, validarConfig() não detecta ausência dos segredos: vê os
fallbacks preenchidos. A aplicação pode subir com credenciais compartilhadas.

**Como cheguei:** comparação entre config.js, .env.example e a afirmação de
validação fail-fast em ARQUITETURA.md. Leitura direta comprova os valores; não
foi tentada autenticação com token publicado ou falsificação de sessão.

**Impacto:** quem conhece o segredo JWT usado consegue fabricar assinaturas
compatíveis com o middleware; ainda precisa apontar para um usuário existente.
O token ERP dá acesso ao contrato autorizado por essa credencial. Não sabemos
se os valores ainda são válidos no serviço externo, nem se um deploy os usa.
O problema da publicação independe dessa confirmação: os literais existem.

**Confirmação planejada e segura:** executar config em processo isolado, sem
.env e com ambiente controlado; verificar que ausência/vazio atualmente passa
via fallback. Usar somente credenciais sintéticas nos testes. Não tentar
explorar contas ou pedidos reais.

**Direção proposta:** remover valores sensíveis/defaults e exigir env explícita
para JWT_SEGREDO, ERP_TOKEN e ERP_URL; manter defaults operacionais não secretos.
Mensagens de validação indicam nome da variável, sem imprimir valor. O usuário
configura seus valores apenas em ambiente local. Rotação/revogação dos valores
expostos exige ação do responsável pelo SIAC; apagar código não revoga token.

**Critérios para a spec:**
- Ausência, vazio e placeholders de credenciais impedem a subida.
- JWT curto continua rejeitado; valores válidos sintéticos são aceitos.
- A configuração funciona em ambiente explícito sem fallback secreto.
- Nem código novo, docs, diff publicado ou histórico de entrega contém os
  valores originais; revisão não deve imprimir esses valores.
- README/.env.example/guia passam a usar ERP_URL de maneira coerente.

**Cuidado no Git:** repositório de entrega é público. Iniciar novo histórico
com documentação segura evita carregar o histórico original com credenciais.
Não publicar a aplicação até essa mudança ser aprovada e executada.

### Execução aprovada — 2026-10-11

Os trechos e linhas acima descrevem a baseline original. No código atual,
PADRAO foi removido; JWT_SEGREDO, ERP_URL e ERP_TOKEN são obrigatórios.
JWT curto, placeholders e URL não absoluta HTTP(S) são rejeitados sem valores
nos erros. Formato exportado, cookie e defaults operacionais foram preservados.
Nota KZN-2B9C mantida. CORS não foi alterado.

Aprovação: usuário aprovou a correção/configuração inicial e pediu atualização
do relatório e criação de .env. Criado `backend/.env` com permissão 0600,
ignorado pelo Git, campos obrigatórios vazios e demais padrões preenchidos.
Preenchimento dos valores reais e integração com SIAC continuam pendentes.

Arquivos: backend/src/config.js, backend/tests/config.test.js,
backend/.env.example, README.md, guia de ambiente e registros SDD/relatório.
`npm ci` instalou 120 pacotes no backend; auditoria informou zero vulnerabilidades.
`node --test tests/config.test.js`: antes, cinco falhas/um sucesso; depois,
seis sucessos. `node --check backend/src/config.js`: passou. Testes isolam cwd
e ambiente, não leem .env local e não acessam ERP nem banco. Não houve
revogação das credenciais externas nem publicação do histórico original.

## FIX-002 — CORS aceita qualquer origem com credenciais

**Estado:** não corrigido; reprodução em navegador pendente.

**Onde:** backend/src/app.js, criarApp(), linha 28:
`cors({ origin: true, credentials: true })`.
backend/src/config.js define corsOrigem na linha 47, sem consumo correspondente.

**O que foi encontrado:** o middleware reflete a origem enviada pela requisição
e permite credenciais; não aplica a origem definida no ambiente. Comentário
apresenta isso como solução para preflight, mas o desenho previsto já usa
proxy/mesma origem em desenvolvimento e produção.

**Como cheguei:** segui CORS_ORIGEM desde .env.example/config até app.js e
comparei com frontend/vite.config.js e o fetch com credentials: include.

**Impacto:** enfraquece a fronteira entre origens. A possibilidade de leitura
autenticada depende de SameSite=Lax, regras de cookies, origem/site e topologia.
Não afirmar que qualquer site consegue ler qualquer sessão automaticamente.
CORS também não substitui autorização nem proteção contra CSRF.

**Reprodução planejada:** com app isolado, enviar Origin permitido e não
permitido; conferir Access-Control-Allow-Origin/Credentials e preflight. Testar
sessão no navegador no ambiente escolhido, incluindo origem same-site quando
pertinente. Não usar credenciais reais nessa avaliação.

**Direção proposta:** decidir se CORS é necessário. Caso seja, usar origem
explícita/configurada; rejeitar/refrear origens desconhecidas e validar a
configuração. Caso mesma origem seja suficiente, remover exposição cruzada
sem quebrar proxy, cookies ou o deploy aprovado.

**Aceite esperado:** origem arbitrária não ganha permissão de leitura com
credenciais; desenvolvimento previsto e produção continuam funcionando;
requisição sem Origin e política de preflight têm comportamento documentado.

## FIX-003 — Conversão de reais para centavos perde dinheiro

**Estado:** confirmado em função isolada; não corrigido.

**Onde:** backend/src/lib/dinheiro.js, paraCentavos(), linha 7:
`Math.floor(Number(reais) * 100)`.
Consumidores: carrinhoService.js e pedidoService.js.

**Causa:** números decimais são aproximados em ponto flutuante. Multiplicar
por 100 pode produzir valor ligeiramente abaixo do inteiro esperado. Floor
trunca o centavo. O carrinho reconverte valores totais em reais para centavos
ao somar, introduzindo outra oportunidade de perda.

**Evidência executada com a função original:**

| Entrada | Obtido | Esperado para preço com duas casas |
|---|---|---|
| 1.15 | 114 | 115 |
| 4.10 | 409 | 410 |
| 19.99 | 1998 | 1999 |

**Impacto:** subtotais e total do carrinho e valor_total_centavos do vínculo
local podem divergir do ERP. Este defeito é distinto de KZN-312, cujo total
inclui itens indisponíveis, embora ambos afetem o mesmo fluxo.

**Direção proposta:** definir política para a precisão monetária do contrato,
converter na fronteira e manter soma/multiplicação em inteiros. Para valores
com duas casas, remover truncamento indevido; não tratar uma troca isolada por
Math.round como prova universal para qualquer precisão de entrada.

**Aceite esperado:** exemplos acima corretos; zero, quantidades e somas
consistentes; API continua em reais quando previsto; persistência em centavos;
comparação com pedido ERP em cenários controlados. Definir tratamento de
entrada inválida e precisão extra na spec, sem ampliar escopo por suposição.

## FIX-004 — Última página inacessível pelo botão Próxima

**Estado:** confirmado por execução da expressão original; não corrigido.

**Onde:** frontend/src/componentes/ui.jsx, Paginacao(), linha 206:
`disabled={pagina >= totalPaginas - 1}`.
Consumidores: Catalogo.jsx e Pedidos.jsx.

**Causa:** condição antecipa o bloqueio em uma página. A página atual já é
indexada a partir de 1; não deveria descontar 1 do total para esse limite.

**Evidência isolada:** página 1 de 2 → Próxima desabilitada; página 2 de 3 →
Próxima desabilitada. A última página existe, mas a navegação pela UI não chega
até ela. URLs manuais não corrigem o comportamento do componente.

**Impacto:** parte do catálogo e do histórico fica inacessível pelo caminho
normal. Não confundir com KZN-325: esse outro defeito preserva página antiga
ao mudar uma busca/filtro.

**Direção proposta:** corrigir limite do componente compartilhado e conferir
Anterior/Próxima nos dois consumidores.

**Aceite esperado:** com 2 páginas, ir de 1 para 2 e voltar; com 3, percorrer
todas; Próxima bloqueada somente na última; Anterior somente na primeira;
com 0/1 página respeitar o comportamento de ocultação existente.

## FIX-005 — Estado do carrinho desconectado da autenticação

**Estado:** evidência estática; reprodução integrada pendente; não corrigido.

**Onde:** frontend/src/contextos/CarrinhoContext.jsx, ProvedorCarrinho(),
linhas 19–39; AuthContext.jsx, entrar/cadastrar/sair; main.jsx, linhas 9–18.

**Causa:** provider do carrinho está dentro do provider de autenticação, mas
não consome useAuth, usuário ou estado de carregamento da sessão. Seu efeito
chama recarregar() apenas ao montar. Entrar/sair não recriam o provider.
O comentário de main.jsx afirma uma dependência que não existe na prática.

**Cenários para reproduzir:**
1. Conta A possui itens. Abrir loja como visitante: consulta do carrinho dá
   401 e estado vira vazio. Entrar em A: nada dispara nova leitura.
2. Abrir logado em A, carregar itens, sair: estado do carrinho não é limpo.
3. Entrar em B sem recarregar a página: pode continuar o estado de A até outra
   operação retornar o carrinho correto de B.
4. Atrasar resposta de A e trocar sessão: resposta antiga pode repor dados
   após troca se não houver invalidação.

**Impacto:** contador, conteúdo e checkout exibem estado incoerente. Pode
ocorrer exposição visual residual entre contas no mesmo navegador; não é
prova de acesso a dados de outro usuário pela API, que filtra usuario_id.
recarregar() também converte qualquer erro em vazio, escondendo falha técnica.

**Direção proposta:** observar conclusão da sessão e identidade do usuário;
limpar ao sair/trocar conta; recarregar ao autenticar; invalidar respostas
anteriores; diferenciar 401 de falha de rede/servidor. O futuro carrinho ativo
deve ampliar essa identidade com carrinho_id.

**Aceite esperado:** login restaura carrinho; logout remove estado; B nunca
vê conteúdo residual de A; visitante não dispara carga privada prematura;
resposta atrasada não sobrescreve a nova identidade; erro técnico é visível.

## FIX-006 — Item com estoque reduzido não pode ser ajustado

**Estado:** evidência estática; reprodução visual pendente; não corrigido.

**Onde:** frontend/src/paginas/Carrinho.jsx, LinhaItem(), linha 45:
`disabled={ocupado || !item.disponivel}`.
backend/src/services/carrinhoService.js, enriquecerItens(), linhas 47–64.

**Causa:** disponivel=false representa diferentes situações: produto inativo,
sem estoque e estoque menor que a quantidade pedida. A UI bloqueia quantidade
para todas elas, incluindo a situação em que reduzir resolveria o problema.

**Reprodução planejada:** carrinho com 5 unidades; ERP simulado passa a
informar estoque 3; ler carrinho e abrir tela. Backend retorna pendência
"Restam apenas 3...", UI manda ajustar, mas o input fica desabilitado.

**Impacto:** usuário precisa remover e adicionar de novo, em vez de ajustar.
Checkout permanece bloqueado. Estoque do SIAC pode mudar; o cenário é parte
natural do fluxo, não apenas erro raro de formulário.

**Direção proposta:** permitir redução quando produto ativo ainda tem estoque;
manter regras para removido/inativo/zero e mensagens claras; backend revalida
a quantidade final. Evitar sobrecarregar um único booleano se a UI precisar
de distinguir motivos; alteração de contrato deve constar na spec.

**Aceite esperado:** reduzir 5→3 desbloqueia checkout; não aumentar além do
estoque/99; remoção continua disponível; novo componente na vitrine preserva
o mesmo comportamento; mudança subsequente de estoque ainda recebe conflito.

## FIX-007 — Telefone opcional não pode ser removido

**Estado:** confirmado em serviço com banco simulado; não corrigido.

**Onde:** backend/src/services/usuarioService.js, atualizarPerfil(), linha 87:
`telefone || atual.telefone`.
lib/validacao.js retorna null para telefone vazio; routes/perfil.js utiliza
esse validador ao montar os dados.

**Causa:** fallback por truthiness trata limpeza intencional como ausência e
reaproveita o telefone salvo. Trocar somente por ?? também manteria o antigo
quando o null significa "apagar"; a distinção precisa ser especificada.

**Evidência isolada:** usuário com telefone 11999999999, atualização com
telefone=null, argumento enviado ao UPDATE permaneceu 11999999999.

**Impacto:** perfil pode dizer que salvou, mas o contato removido permanece no
backend. Campo é opcional no cadastro e na interface.

**Direção proposta:** definir semântica de ausente vs vazio/null no PATCH.
Manter valor quando omitido e limpar quando solicitado, se essa for a regra
aprovada. Conferir também montagem dos dados pela rota, não só o serviço.

**Aceite esperado:** limpar persiste após nova leitura; editar salva número
válido; entrada inválida dá erro por campo; omissão segue a regra escolhida;
nome/documento permanecem coerentes.

## FIX-008 — Senhas recebem trim apenas em alguns fluxos

**Estado:** confirmado com funções reais de hash/verificação; não corrigido.

**Onde:** routes/auth.js, cadastro usa senha(), login usa textoObrigatorio()
(linha 52); routes/perfil.js usa textoObrigatorio() para senha_atual (linha 45).
lib/validacao.js: textoObrigatorio() aplica trim; senha() preserva a string.
lib/senha.js normaliza NFKC nos dois caminhos criptográficos.

**Causa:** espaços iniciais/finais participam do hash no cadastro/nova senha,
mas são removidos antes da conferência no login e na senha atual do perfil.

**Evidência isolada:** hash gerado para a string sintética ` senha123 `;
conferência original=true; conferência da versão trim=false. Isso demonstra
a inconsistência; cadastro/login HTTP ainda não foram percorridos juntos.

**Impacto:** conta criada com senha aceita pelo cadastro não consegue entrar
com a mesma entrada; pode também impedir troca de senha atual.

**Direção proposta:** preservar exatamente os espaços em todos os fluxos,
mantendo a normalização NFKC já usada na criptografia e limites existentes.
Não alterar hashes armazenados nem converter senhas de usuários silenciosamente.
Separar validação de presença de transformação de credencial.

**Aceite esperado:** cadastrar/entrar/trocar com espaços; senhas sem espaços
continuam válidas; senha errada não entra; limites/erros preservados; política
para string composta só de espaços documentada (não atende letra+número).

## FIX-009 — Layout sem adaptação suficiente para celular

**Estado:** restrições CSS confirmadas; reprodução visual e medidas pendentes.

**Onde:** componentes/Cabecalho.jsx linha 66, busca com min-w-[380px] numa
linha flex junto com marca e navegação; paginas/Catalogo.jsx linha 183, grade
com grid-cols-4 sem breakpoints. index.html contém viewport apropriado.

**Causa:** larguras mínimas e número de colunas fixos não distribuem conteúdo
conforme a largura disponível. Cabeçalho ainda muda tamanho ao autenticar,
pois surgem mais ações. Não houve inspeção por screenshot nesta fase.

**Reprodução planejada:** abrir visitante e autenticado em larguras 320, 375,
390, 768 e 1280px. Medir scrollWidth/clientWidth, legibilidade de cards,
visibilidade de busca/ações, zoom e navegação por teclado.

**Impacto:** overflow ou conteúdo comprimido/difícil de usar; importante para
o requisito explícito de carrinho na vitrine também no celular.

**Direção proposta:** distribuir/recolher cabeçalho em breakpoints e adaptar
colunas do catálogo preservando tokens e componentes. Não redesenhar a marca.
Coordenar com MULTI-001 para o painel não criar novo overflow ou esconder ações.

**Aceite esperado:** larguras escolhidas sem overflow horizontal da página;
busca e carrinho acessíveis; foco/teclado funcionam; desktop preservado;
identidade visual mantida; registrar evidência visual antes/depois.

## Pontos registrados separadamente

### INV-001 — Checkout concorrente e repetição após timeout

**Classificação:** caminho local sem proteção comprovado em simulação;
comportamento real do ERP ainda desconhecido.

**Onde:** pedidoService.js, finalizarPedido(), linhas 20–92;
erp/cliente.js, criarPedido()/requisitar().

Duas chamadas simultâneas podem ler o mesmo carrinho antes da primeira
limpeza. Não há trava/idempotência local. Em simulação com ERP aceitando
ambas, executei Promise.all de duas finalizações: 2 chamadas criarPedido,
2 vínculos locais e 2 limpezas; payloads com os mesmos itens.

Timeout é outro cenário: ERP pode ter criado um pedido, mas a loja perder a
resposta; repetir POST pode duplicar. Desabilitar botão só protege uma parte
da UI e não resolve abas, clientes HTTP ou repetição de rede.

**Próximo passo:** ler contrato disponível do SIAC, confirmar suporte a chave
de idempotência/consulta por referência e testar com ERP simulado atrasado.
Especificar operação e estado persistente se necessário. Não afirmar que
mutex local resolve recuperação após crash ou várias instâncias. Não fazer
teste de duplicidade no ERP real sem autorização específica.

**Aceite a definir:** comportamento para mesma tentativa, tentativas distintas,
duas abas, timeout antes/depois do recebimento e retomada. Dependência direta
da definição de checkout de múltiplos carrinhos.

### INV-002 — Limpeza apaga conteúdo alterado durante o checkout

**Classificação:** risco de interleaving identificado no código; reprodução
integrada ainda não feita. Distinto da duplicidade de INV-001.

**Onde:** pedidoService.js lê carrinho na linha 28, aguarda ERP na 51 e chama
limparCarrinho(usuario.id) na 81; carrinhoService.js linha 190 deleta todos os
itens do usuário.

Enquanto a chamada ERP está em andamento, outra aba pode adicionar produto
ou alterar quantidade. O payload já foi formado; a limpeza posterior remove
também conteúdo que não participou do pedido.

**Reprodução planejada:** ERP fake bloqueado após receber payload; adicionar
item por outra requisição; liberar resposta; verificar itens remanescentes.
Cobrir incremento no mesmo produto, não apenas produto novo.

**Direção a decidir:** congelar/versionar checkout ou reconciliar snapshot
comprado com alterações posteriores. Só trocar DELETE global por carrinho_id
não resolve modificações concorrentes dentro do mesmo carrinho.

### INV-003 — Endereço pode ficar sem principal

**Classificação:** comportamento localizado; regra de produto a esclarecer.

**Onde:** enderecoService.js, atualizarEndereco(), linhas 83–108;
routes/enderecos.js linha 35; FormularioEndereco.jsx checkbox principal.

Criação do primeiro e exclusão do principal promovem um endereço. Entretanto,
editar o principal com principal=false desmarca sem promover outro. A rota
também transforma principal omitido em false. Banco garante booleano, não
exatamente um principal por usuário. Checkout faz fallback para o primeiro.

**Dúvida:** deve existir exatamente um principal quando há endereços, ou
nenhum é permitido? Se nenhum for permitido, revisar texto/documentação; se
exatamente um, definir promoção ou rejeição. Não mudar só por preferência.

**Validação futura:** um endereço, vários, edição com false, campo omitido,
exclusão e criação; snapshot dos pedidos antigos não pode mudar.

### INV-004 — Erros persistem após resposta posterior bem-sucedida

**Classificação:** evidência estática; reprodução de navegação pendente.

**Onde:** paginas/Pedidos.jsx e PedidoDetalhe.jsx, efeitos de carregamento.
Eles ativam carregando, mas não limpam erro na nova consulta nem no sucesso.
O render prioriza erro quando carregando termina.

Com um componente ainda montado, provocar falha e depois mudar sua página ou
número para uma requisição bem-sucedida pode manter o alerta e ocultar os
dados novos. Remontar componente pode mascarar esse defeito.

**Próximo passo:** controlar primeira resposta falha e segunda sucesso no
mesmo componente; definir estados de carregamento/sucesso/erro e limpar erro
no ponto correto. Conferir que respostas atrasadas continuam descartadas.

### INV-005 — Busca do cabeçalho não acompanha URL posterior

**Classificação:** evidência estática; reprodução com histórico pendente.

**Onde:** componentes/Cabecalho.jsx linha 32, useState(parametros.get('busca')).
Esse valor é usado só na inicialização. Cabeçalho persiste entre rotas.

Limpar termo pelo catálogo ou usar voltar/avançar muda a URL, mas pode manter
texto antigo no input. Reenviar o formulário reaplica um termo já removido.
Esse é um defeito distinto da página não reiniciada em KZN-325.

**Próximo passo:** reproduzir busca A→B→voltar, limpar pelo catálogo e abrir
categoria. Definir sincronização da busca confirmada sem apagar texto que o
usuário ainda está digitando. Cobrir preservação dos outros filtros válidos.

## Contexto dos quatro chamados oficiais

| Chamado | Causa localizada | Evidência isolada |
|---|---|---|
| KZN-312 | lerCarrinho soma valor_total de itens indisponíveis | 20 disponíveis + 3×228 indisponíveis = 704; excesso 684 |
| KZN-318 | quantidade_pecas = itens.length | Duas linhas, cinco unidades → contador 2 |
| KZN-325 | pesquisar e trocarParametro preservam página antiga | Pesquisa partindo de pagina=2 gerou /?pagina=2&busca=amortecedor |
| KZN-331 | finalizar usa endereço principal, ignora enderecoId | Seleção 2 → payload endereco_id=1 |

Locais: backend/src/services/carrinhoService.js (85–95),
frontend/src/componentes/Cabecalho.jsx (34–43), paginas/Catalogo.jsx (70–79),
paginas/Checkout.jsx (48–57). Cada chamado terá spec/plan próprios. KZN-312
precisa definir semântica do total com pendências; checkout continua bloqueado
até ajustes, salvo decisão aprovada diferente.

## Notas de revisão encontradas

| Identificador | Arquivo e linha da baseline |
|---|---|
| KZN-2B9C | backend/src/config.js:8 |
| KZN-7F3A | backend/src/services/carrinhoService.js:73 |
| KZN-5D1E | frontend/src/componentes/Cabecalho.jsx:22 |

Todas pedem citação no resumo de entrega. Busca em arquivos textuais do
checkout encontrou três notas desse padrão. Não foram usadas como prova de
quantidade de bugs ou de intenção do avaliador.

## Limitações conhecidas e pontos de ambiente

- Transação distribuída loja/ERP ausente já está documentada: pedido pode
  existir no ERP se gravação local falhar; log permite reconciliação manual.
- N chamadas ERP na listagem de pedidos, ausência de recuperação/confirmação
  de email, pagamento/frete/nota, ViaCEP e dígitos CPF/CNPJ já são escopo conhecido.
- README fala SIAC_URL, código utiliza ERP_URL. Corrigir coerência na unidade
  de configuração, sem publicar valores.
- Original não possui .gitignore e versiona SQLite/dist; estrutura documental
  adiciona ignore. Novo histórico deve evitar artefatos e segredos.
- Ainda não há migrações versionadas nem suíte automatizada.
- Decisões de limite, seleção, exclusão e pós-checkout de múltiplos carrinhos
  continuam propostas em docs/decisoes.md, não aprovação de implementação.

## Como atualizar ao trabalhar em um item

Acrescentar data, spec/plan, referência da aprovação, arquivos efetivamente
alterados, comando/roteiro de validação, resultado e limitações remanescentes.
Estados recomendados: identificado → especificado → aprovado → implementado →
validado. Não marcar validado apenas por inspeção do diff. Se uma hipótese não
se confirmar, manter registro do descarte e da evidência.
