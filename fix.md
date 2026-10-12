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
- **Integrada:** aplicação real percorrida; usuário confirmou catálogo,
  login, refresh e logout. Demais fluxos não foram validados.
- **Risco/decisão:** condição possível ou regra ambígua que precisa de definição.

Scripts isolados foram transitórios, não salvos como suíte. Não houve chamadas
de escrita ao SIAC. FIX-001 validado por testes isolados e roteiro manual pelo usuário;
demais correções pendentes.

O preenchimento inicial de RELATORIO.md foi aprovado em 2026-10-11 e registra
estes achados com os graus de evidência e pendências. Essa aprovação não
autoriza outras correções. Configuração por ambiente foi aprovada separadamente
em 2026-10-11 e implementada nesta sessão.

## Visão geral

| ID | Assunto | Evidência | Prioridade proposta |
|---|---|---|---|
| FIX-001 | Credenciais e segredo JWT literais/fallback | Corrigido; seis testes e validação manual local | Concluído no escopo aprovado |
| FIX-002 | CORS com qualquer origem e credenciais | Estática | Alta; impacto depende do ambiente |
| FIX-003 | Perda de centavos na conversão monetária | Validada localmente | Alta |
| FIX-004 | Botão Próxima bloqueia última página | Implementado; manual pendente | Alta |
| FIX-005 | Carrinho não acompanha login/logout/troca de conta | Manual pelo usuário e estática | Alta |
| FIX-006 | Estoque reduzido impede ajuste de quantidade na UI | Implementado; manual pendente | Alta |
| FIX-007 | Telefone opcional não pode ser removido | Implementado; manual pendente | Média |
| FIX-008 | Login/troca de senha removem espaços aceitos no cadastro | Isolada | Alta |
| FIX-009 | Cabeçalho e grade inadequados para telas pequenas | Estática; visual pendente | Média |
| FIX-010 | Inputs de documento/telefone sem limite de entrada | Manual no cadastro; estática no perfil | Média; SDD pendente |

Prioridades são propostas para ordenar trabalho, não decisões aprovadas.

## FIX-001 — Segredos literais e configuração com fallback

**Estado:** validado por seis testes automatizados e roteiro manual local
pelo usuário em 2026-10-11. Spec/plan aprovados em
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
Na etapa posterior, usuário confirmou preenchimento e catálogo/login
funcionando; refresh, logout e fail-fast manual também confirmados.

Arquivos: backend/src/config.js, backend/tests/config.test.js,
backend/.env.example, README.md, guia de ambiente e registros SDD/relatório.
`npm ci` instalou 120 pacotes no backend; auditoria informou zero vulnerabilidades.
`node --test tests/config.test.js`: antes, cinco falhas/um sucesso; depois,
seis sucessos. `node --check backend/src/config.js`: passou. Testes isolam cwd
e ambiente, não leem .env local e não acessam ERP nem banco. Não houve
revogação das credenciais externas nem publicação do histórico original.


### Confirmação manual da configuração — 2026-10-11

Evidência informada pelo usuário: login, catálogo, persistência da sessão
após atualizar a página e logout funcionaram localmente. Ao executar
`JWT_SEGREDO= npm start` em backend/, o processo encerrou com
`Configuracao invalida: JWT_SEGREDO nao definido. Rode: npm run segredo:gerar`.
Fail-fast manual confirmado, sem alterar .env. Os seis testes automatizados
já haviam passado. Não foi executado checkout real; este registro não
comprova os demais fluxos do sistema. Implementação registrada no commit c46e68e. Validação concluída para o
escopo aprovado; resultados consolidados neste commit documental complementar.
Nenhuma nova alteração de aplicação realizada; publicação remota pendente.

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

**Estado:** corrigido e validado localmente; PR #9 aberto. Ver evidências ao final.

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

**Estado:** implementado por SDD aprovado; nove testes focados passaram; manual pendente.

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

**Estado:** implementado por SDD aprovado em 2026-10-11; testes locais passaram, integração manual pendente.

**Confirmação manual:** após sair da conta X e entrar em Y no mesmo navegador,
o carrinho de X permaneceu visível até F5. Evidência fornecida pelo usuário;
não foi demonstrado vazamento pela API. Respostas antigas em andamento ainda
precisam de reprodução controlada. Correção separada, sem SDD aprovado.

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

**Estado:** implementado por SDD aprovado; regressões locais passaram; validação manual da correção pendente.

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

**Estado:** implementado por SDD aprovado; serviço e HTTP isolados passaram; manual pendente.

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

### KZN-312 — Preparação SDD em 2026-10-11

Estado: especificado, aguardando aprovação. Documentos versão 1 em
[spec.md](docs/sdd/total-do-carrinho/spec.md) e
[plan.md](docs/sdd/total-do-carrinho/plan.md); branch fix/total-do-carrinho.
Proposta: excluir do resumo toda linha indisponível, inclusive estoque
inferior à quantidade solicitada, preservando a linha e checkout bloqueado.
Subtotal da linha continua referencial; não mudar quantidade automaticamente.
Correção central no redutor de lerCarrinho, sem frontend/contador/migração.
FIX-003 continua pendente; testes desta unidade usam valores inteiros em reais
para isolar a causa KZN-312. Não afirmar precisão monetária integral resolvida.
Onze novas regressões previstas com SQLite em memória e fetch simulado;
RED/GREEN ainda não executados, nenhum arquivo de aplicação alterado.

### KZN-312 — Implementação e provas em 2026-10-11

Spec/plan versão 1 aprovados após reprodução manual pelo usuário. Serviço
corrigido com item.disponivel na agregação. Dados/linhas/subtotais referenciais
e bloqueio checkout preservados. Arquivos: carrinhoService.js e
backend/tests/carrinho-total.test.js, além dos registros documentais.
RED: onze testes, seis falhas/cinco sucessos, total 704 em vez de 20.
GREEN: npm test com 17 sucessos; sintaxe e diff passaram. Testes isolam cwd,
env, SQLite :memory: com schema real e fetch fake. Zero pedidos reais criados.
FIX-003 e KZN-318 não corrigidos. Estado Implementado; validação manual
pós-correção e checks do PR pendentes. Aguardar comando do usuário para
abrir PR, conforme solicitação explícita desta sessão.

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
- README corrigido para ERP_URL na unidade de configuração.
- Original não possui .gitignore e versiona SQLite/dist; estrutura documental
  adiciona ignore. Novo histórico deve evitar artefatos e segredos.
- Ainda não há migrações versionadas; existe suíte isolada de configuração.
- Decisões de limite, seleção, exclusão e pós-checkout de múltiplos carrinhos
  continuam propostas em docs/ai/arch.md, não aprovação de implementação.

## FIX-010 — Cadastro aceita entrada acima dos limites da API

**Estado:** identificado; correção não aprovada nem implementada.
**Evidência:** reprodução manual pelo usuário em 2026-10-11, com capturas
mostrando documento e telefone longos aceitos durante digitação e mensagens
após enviar; confirmada por leitura do código. Prioridade proposta: média.

**Onde:** frontend/src/paginas/Cadastro.jsx, campos documento e telefone e
handler mudar(). O mesmo padrão sem maxLength aparece em Perfil.jsx, ainda
sem reprodução manual nessa tela. Campo em componentes/ui.jsx repassa props
ao input; a omissão está nos consumidores, não em bloqueio do componente.

**Causa e contrato:** não há maxLength nem restrição no handler; type=tel
não limita tamanho ou caracteres. O backend valida documento com máximo de
18 caracteres e 11/14 dígitos; telefone opcional com máximo de 20 caracteres
e 10/11 dígitos. Portanto, os exemplos enviados foram rejeitados pela API,
conforme capturas: não há evidência de persistência desses valores excessivos.

**Impacto:** feedback tardio e retrabalho no formulário. Falta de limite de
entrada é distinta de falta de validação no servidor. Máscara, caracteres
permitidos e validação de dígitos verificadores são decisões separadas;
ausência de verificação matemática de CPF/CNPJ já é limitação documentada.

**Direção para SDD:** alinhar limites de entrada ao contrato existente em
cadastro e perfil, preservando telefone opcional e validação do servidor.
Definir separadamente se haverá máscara/normalização, sem inferir que basta
aceitar só números ou usar input numérico (documentos podem ter zeros iniciais).

**Aceite a especificar:** digitação e colagem acima do limite, valores
formatados e sem formatação, edição de valores existentes, telefone vazio,
mensagens acessíveis e rejeição do excesso quando a API é chamada diretamente.
Não atribuir correção deste achado à unidade configuracao-por-ambiente.

## Como atualizar ao trabalhar em um item

Acrescentar data, spec/plan, referência da aprovação, arquivos efetivamente
alterados, comando/roteiro de validação, resultado e limitações remanescentes.
Estados recomendados: identificado → especificado → aprovado → implementado →
validado. Não marcar validado apenas por inspeção do diff. Se uma hipótese não
se confirmar, manter registro do descarte e da evidência.

## Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “funcionando, pode abrir o PR”. Validação manual
pós-correção confirmada pelo usuário; autorização anterior para aguardar
foi revogada por esta mensagem. Abrir PR para main e acompanhar os checks,
sem realizar merge. Testes locais já passaram; evidência remota ainda pendente.

## Validação remota concluída — PR #3

PR: https://github.com/eduardofrois/kaizen-test/pull/3
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38175551404
Checks testes-backend e build-frontend passaram no commit ac2231f.
Com reprodução prévia, aprovação SDD, RED/GREEN, confirmação manual do
usuário e checks do PR concluídos, KZN-312 está Validado. Todos os critérios
da versão 1 cumpridos; merge continua pendente de ação manual do usuário.
Nenhum merge/deploy realizado pela IA. As pendências de validação e instruções
de aguardar abertura descritas anteriormente são registros históricos superados.
FIX-003, FIX-005 e KZN-318 permanecem fora desta correção.

## Preparação de contador-do-carrinho — 2026-10-11

KZN-318 reproduzido manualmente pelo usuário, conforme informou nesta sessão.
Inspeção confirmou quantidade_pecas = itens.length em lerCarrinho; cabeçalho e
resumo já consomem esse campo. Spec e plano versão 1 preparados em
`docs/sdd/contador-do-carrinho/`, estado Proposta. Regra proposta: somar unidades
incluindo linhas com pendências, mantendo quantidade_itens como produtos distintos
e preservando o total filtrado do KZN-312. Implementação e testes aguardam aprovação;
nenhum código, teste, dependência ou banco alterado nesta preparação.

## Implementação de contador-do-carrinho — 2026-10-11

Versão 1 aprovada pela mensagem “aprovado os documentos”. Implementação
limitada à soma de item.quantidade em quantidade_pecas. quantidade_itens,
total filtrado do KZN-312, nota KZN-7F3A e checkout preservados.
Seis regressões acrescentadas ao harness isolado existente, sem dependências.

RED: node --test tests/carrinho-total.test.js antes da correção — 17 testes,
12 passaram e cinco falharam no contador; exemplo 3+4 retornou 2 em vez de 7.
GREEN: npm test após a correção — 23 testes passaram (17 de carrinho e seis
configuração). SQLite em memória, fetch simulado e subprocesso com ambiente
sintético; sem .env, banco local ou ERP real. Snapshots preservados e zero POST.
node --check backend/src/services/carrinhoService.js e build frontend passaram;
build transformou 58 módulos. Inspeção confirmou badge 99+, aria-label exato
e resumo consumindo quantidade_pecas. Isso não substitui validação visual.

Estado Implementado: validação automatizada local concluída; roteiro manual
7→5→3→0 e persistência após F5 aguardam confirmação do usuário.
PR não aberto; checks remotos não executados. FIX-003/FIX-005 não corrigidos.
Também atendida a solicitação de usar “usuário” nas referências documentais.

## Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “validado, pode subir o pr” após o roteiro de validação
local. Validação manual pós-correção confirmada pelo usuário; não executada
pela IA. Publicação da branch e abertura de PR autorizadas nesta mensagem.
Testes locais: 23 passaram; build passou. Checks remotos ainda pendentes.
Merge permanece manual pelo usuário. Pendências manuais descritas anteriormente
são registros históricos superados por esta confirmação.

## Validação remota de KZN-318 — 2026-10-11

PR #5: https://github.com/eduardofrois/kaizen-test/pull/5
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38177680580
Checks testes-backend e build-frontend passaram no commit ea3bc6a.
Estado Validado: critérios da versão 1 concluídos com regressões isoladas,
build local, confirmação manual do usuário e CI do PR. Merge manual pendente.
Registros anteriores de espera por validação/abertura/CI são históricos.
FIX-003 e FIX-005 continuam fora do escopo; nenhum merge ou deploy realizado.

## Preparação de busca-e-paginacao — 2026-10-11

KZN-325 reproduzido pelo usuário (“Erro encontrado”). Pull realizado antes do
trabalho; nova branch fix/busca-e-paginacao baseada na main 27217ff, com PR #5
integrado. Spec/plano versão 1 em docs/sdd/busca-e-paginacao/, estado Proposta.
Proposta: remover pagina ao pesquisar, limpar termo ou alterar categoria/estoque;
preservar paginação explícita e demais filtros. Prevê função compartilhada,
dez testes nativos sem dependências novas e npm test no job frontend da CI.
FIX-004 e INV-005 ficam separados. Nenhum código, teste, workflow ou dependência
alterado; implementação aguarda aprovação explícita.

## Implementação de busca-e-paginacao — 2026-10-11

Versão 1 aprovada pelo usuário: “entao aprovo os docs”. Função compartilhada
atualizarParametroCatalogo integrada em pesquisar e trocarParametro. Busca,
categoria e estoque removem pagina; paginação explícita preserva filtros.
Consulta continua no backend/ERP com tamanho 24; nenhum filtro local de lista.
Nota KZN-5D1E preservada. FIX-004 e INV-005 não corrigidos nesta unidade.

RED: node --test tests/parametros-catalogo.test.js no comportamento original
extraído para o módulo — oito falhas nos resets e dois controles passaram.
GREEN: npm test em frontend — dez testes passaram. npm test em backend —
23 testes passaram. Build frontend passou com 59 módulos; git diff --check
passou. Testes frontend importam função real, sem rede, env ou banco; suíte
backend mantém SQLite isolado e ERP simulado. Não houve validação React/E2E.

Script test frontend criado sem dependências. Workflow atualizado para executar
npm test no job build-frontend antes do build, preservando nomes dos checks.
Execução remota ainda pendente; mudança de workflow não equivale a CI validada.
Estado Implementado: roteiro manual pós-correção, confirmação do usuário e
checks remotos pendentes. Nenhum PR, merge ou deploy realizado nesta unidade.

## Autorização do PR — 2026-10-11

Usuário autorizou “pode abrir o pr”. Publicação da branch e abertura do PR
autorizadas; merge permanece manual. Validação automatizada local concluída
(10 testes frontend, 23 backend e build). Validação manual pós-correção não
confirmada; não atribuir essa confirmação à autorização de abertura do PR.
Checks remotos pendentes nesta etapa.

## CI e publicação de KZN-325 — 2026-10-11

PR #6: https://github.com/eduardofrois/kaizen-test/pull/6
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38179901454
Checks testes-backend e build-frontend passaram no commit c51b6ba. Workflow
do PR inclui npm test frontend antes do build. Branch publicada em origin.
Estado Implementado: validação automatizada local/remota concluída; falta
confirmação manual pós-correção (AC-04 e parte integrada de AC-01/AC-02).
Não marcar a unidade como Validada apenas pela CI. Merge manual pelo usuário.
Pendências remotas descritas antes desta execução são históricas.

## Preparação de endereco-selecionado-no-checkout — 2026-10-11

Pull confirmado; main 6fab792 inclui merge do PR #6. KZN-331: inspeção do
Checkout.jsx confirma finalizar() buscando principal e ignorando enderecoId.
Backend já verifica posse e utiliza o ID recebido para observação/snapshot.
Spec/plano versão 1 em docs/sdd/endereco-selecionado-no-checkout/, Proposta.
Correção proposta só no payload frontend; validação por POST interceptado sem
criar pedido real. Mensagem “pronto” não detalha reprodução, então não foi
registrada confirmação manual específica. Implementação aguarda aprovação.

## Implementação de KZN-331 — 2026-10-11

Versão 1 aprovada pelo usuário: “aprovado”. Checkout.jsx/finalizar passou a
enviar { endereco_id: enderecoId, observacao }, removendo a busca pelo principal
no envio. Seleção inicial, radios, enderecoSalvo, guarda do botão e fluxo de
erro/navegação preservados. Backend, contrato, schema e dependências intactos.

Validação local: npm test frontend — dez testes passaram; npm test backend —
23 passaram; build frontend — passou com 59 módulos; git diff --check passou.
Essas suítes são regressões existentes, não teste específico do payload KZN-331.
Inspeção do diff confirma uso do estado selecionado e preservação do restante.
Inventário da automação não apresentou aba local conectada para executar o
roteiro de interceptação. Validação do payload no navegador permanece pendente;
nenhum pedido real criado e nenhum cadastro/endereço/banco local alterado.
Estado Implementado, não Validado. PR e checks remotos aguardam autorização.

## Validação do payload pelo usuário — 2026-10-11

Usuário confirmou “validado” e apresentou o payload
`{ "endereco_id": 2, "observacao": "" }`. Evidência informada pelo usuário
confirma envio do ID selecionado 2 e observação vazia. Não comprova por si
só criação de pedido, integração ERP, uso de endereço recém-cadastrado ou
observação preenchida. Esses cenários não foram declarados executados.
AC-01 confirmado; AC-02, AC-03 e verificação manual de AC-04 permanecem
sem evidência específica. Regressões locais/build já passaram. PR ainda
não autorizado; merge manual pelo usuário.

## Autorização de publicação — 2026-10-11

Usuário solicitou “faca o pr”, autorizando commit, publicação da branch e
abertura do PR desta unidade. Merge permanece manual. Payload endereco_id=2
confirmado pelo usuário; demais cenários manuais seguem registrados como
pendentes. Checks remotos ainda não executados nesta etapa.

## Publicação e CI do KZN-331 — 2026-10-11

PR #7: https://github.com/eduardofrois/kaizen-test/pull/7
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38181718715
Checks testes-backend e build-frontend passaram no commit 37ed34b. Branch
publicada; merge manual pelo usuário. CI comprova regressões existentes/build,
sem substituir os cenários específicos de checkout ainda não confirmados.
Estado Implementado: AC-01 confirmado por payload informado; AC-05 concluído;
AC-02/AC-03 e validação manual de AC-04 pendentes. Sem pedido real pela IA.
Pendências de autorização/abertura/CI anteriores são registros históricos.

## Investigação de carrinho-por-sessao — 2026-10-11

Pull confirmado; main 1d30bcc inclui PR #7. Branch fix/carrinho-por-sessao.
FIX-005: provider não observa autenticação; respostas de todas as operações
podem publicar estado após mudança de conta. Reprodução normal X→Y já foi
confirmada pelo usuário; concorrência ainda depende de teste controlado.
Desenho versão 1 em docs/sdd/carrinho-por-sessao/spec.md, Proposta para revisão.
Inclui identidade/ciclo da sessão, descarte de respostas antigas e erro de
leitura visível com checkout bloqueado. Plano será detalhado após revisão do
desenho. Nenhum código/teste/dependência alterado; implementação não aprovada.

## Desenho aprovado e plano do FIX-005 — 2026-10-11

Usuário aprovou o desenho versão 1 com “aprovado”. Plan.md de carrinho-por-sessao
preparado para revisão: controlador por ciclo, snapshot próprio, descarte de
respostas e callbacks antigos, retorno false para operação invalidada e guardas
nos chamadores. Erros de leitura expostos em Carrinho/Checkout com recarga.
Testes determinísticos do módulo real e integração manual separados. Nenhum
código/teste alterado. Implementação do plano ainda aguarda aprovação.

## Implementação de carrinho-por-sessao — 2026-10-11

Spec/plano versão 1 aprovados: usuário “aprovado” após apresentação do plano.
Controlador por instância/ciclo integrado ao AuthContext via provider; novo
render de identidade usa snapshot novo, vazio, e invalida resultados anteriores.
Visitante não chama API de carrinho. Geração invalida promises de cleanup/setup.
Leitura com falha expõe erro em Carrinho/Checkout antes de vazio/resumo, com
recarga. Sucesso tardio de adição não mostra recado; operações antigas retornam
false, e Checkout interrompe continuação de recarga invalidada.

Validação local: 27 testes novos do controlador real passaram; npm test frontend
totalizou 37 sucessos; npm test backend totalizou 23 sucessos. Build passou com
60 módulos, git diff --check passou. Sem rede, env ou banco real nos testes.
A execução inicial falhou por módulo ausente: isso é RED estrutural, não prova
comportamental do defeito na baseline. Não houve alegação de RED comportamental.
Testes controlados cobrem dez respostas tardias de leitura/mutação, callbacks
antigos, carga/assinatura, cleanup/setup, X→visitante→X, 401/0/500, retry,
argumentos, erros de mutação e setter. Não são testes React/hooks/E2E.

Estado Implementado: testes locais e revisão estática concluídos; integração
manual X/Y sem F5, boot/StrictMode no navegador e simulação visual de rede ainda
pendentes. Sem novo pedido, cadastro, alteração de estoque ou dependências.
PR não aberto; aguardará comando do usuário. Concorrência dentro da mesma
sessão e checkout já enviado ao servidor continuam fora desta correção.

## Confirmação manual de troca de conta — 2026-10-11

Usuário informou “conferido” após o roteiro X→logout→Y→logout→X sem F5,
conferindo itens, contador e total. Validação manual normal de troca de conta
confirmada pelo usuário, não executada pela IA. Não extrapolar para inspeção
Network do boot, testes visuais de falha/401 ou resposta atrasada no navegador.
Esses cenários têm testes determinísticos no controlador, mas integração visual
específica ainda não confirmada. Suítes locais e build já passaram.
PR ainda não autorizado; merge permanece manual pelo usuário.

## Autorização de publicação do FIX-005 — 2026-10-11

Usuário solicitou “otimo, crie o PR”, autorizando commit, publicação da branch
e abertura do PR. Troca X/Y/X sem F5 confirmada pelo usuário; testes locais
frontend 37/backend 23 e build concluídos. Checks remotos ainda pendentes
nesta etapa. Merge permanece manual; cenários visuais complementares não
foram promovidos a validação concluída.

## Publicação e CI do FIX-005 — 2026-10-11

PR #8: https://github.com/eduardofrois/kaizen-test/pull/8
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38186410197
Checks testes-backend e build-frontend passaram no commit 6ffa315. Branch
fix/carrinho-por-sessao publicada. Troca X/Y/X sem F5 já confirmada pelo usuário;
regressões controladas locais e CI concluídas. Integração visual específica
de boot/StrictMode, falhas e resposta atrasada segue pendente; estado geral
Implementado até completar os critérios restantes. Merge manual pelo usuário.
Registros anteriores de autorização/abertura/CI pendentes são históricos.

## Investigação de precisao-monetaria — 2026-10-11

Pull realizado; main d040365 inclui merge do PR #8. Branch fix/precisao-monetaria.
Execução isolada de paraCentavos confirmou 0.29→28 e 1.15→114 pela aproximação
binária seguida de floor. Desenho versão 1 em docs/sdd/precisao-monetaria/spec.md,
Proposta: arredondamento para valores com até duas casas, mantendo centavos
inteiros e contratos atuais; sem reparo histórico. Precisão extra fica fora
e requer política própria. Nenhum código/teste/dependência alterado.
Aguardar revisão do domínio/desenho antes de detalhar plano e implementar.

## Desenho aprovado e plano de precisao-monetaria — 2026-10-11

Usuário aprovou desenho versão 1 com “aprovado”. Plan.md preparado para revisão:
conversão compartilhada round, nove casos unitários e ida/volta representativa,
serviço real do carrinho e pedido simulado com coluna de centavos inspecionada.
Backend/SIAC e dados históricos preservados; nenhum código/teste alterado.
Aprovação do plano de implementação ainda pendente.

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

## Próxima unidade: última página — 2026-10-11

PR #9 confirmado como integrado à main em a1c60d6; pull concluído.
Branch fix/ultima-pagina criada. FIX-004: expressão atual bloqueia Próxima
em 1/2 e 2/3, confirmado por execução isolada; componente compartilhado por
catálogo e pedidos. Spec versão 1 proposta em docs/sdd/ultima-pagina/spec.md.
Sem alteração de código/testes; revisão do desenho e plano ainda pendentes.

## Desenho de última página aprovado — 2026-10-11

Usuário aprovou spec versão 1 com “aprovado”. Plano versão 1 preparado em
docs/sdd/ultima-pagina/plan.md: correção compartilhada, nove casos do componente
real com Vite/React existentes, regressões/build e roteiro manual nas duas telas.
Plano aguarda revisão; nenhum código, teste ou dependência alterado.

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

## Investigação de ajuste de quantidade — 2026-10-11

PR #10 confirmado integrado na main (0845692); pull concluído. Branch
fix/ajuste-de-quantidade-com-estoque-reduzido. Usuário confirmou reprodução
do FIX-006 no frontend. Causa: input bloqueado por disponivel=false mesmo
quando produto ativo permite reduzir a quantidade para o estoque disponível.
Spec proposta: campo derivado quantidade_editavel, bloqueio para zero/inativo/
ausente, limite inteiro 1..min(99,estoque), revalidação e conflito no backend.
Nota KZN-7F3A relida em carrinhoService; registro de leitura, não diagnóstico.
Spec em docs/sdd/ajuste-de-quantidade-com-estoque-reduzido/spec.md. Revisão do
desenho e plano pendentes. Nenhum código/teste/dependência alterado.

## Desenho FIX-006 aprovado e plano preparado — 2026-10-11

Usuário aprovou spec versão 1 com “aprovado”. Plano versão 1 documenta
quantidade_editavel, extração restrita da linha para teste real, limites no
input e regressões SQLite/ERP fake para redução, conflito e posse.
Arquivo: docs/sdd/ajuste-de-quantidade-com-estoque-reduzido/plan.md.
Implementação pendente de aprovação do plano; código/testes intactos.

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

## Investigação de remoção de telefone — 2026-10-12

PR #11 integrado na main c7e98cd, pull concluído. Branch
fix/remocao-de-telefone-do-perfil criada. FIX-007 confirmado por inspeção atual
e evidência isolada anterior: || mantém número diante de null; rota também
normaliza telefone omitido como null. Proposta diferencia ausência (preservar)
de vazio/espaços/null (remover), preservando validação e demais campos.
Spec: docs/sdd/remocao-de-telefone-do-perfil/spec.md. Desenho/plano pendentes
de aprovação; nenhuma alteração de código/testes, env, banco ou ERP.

## Spec FIX-007 aprovada — 2026-10-12

Usuário: “spec aprovada”, versão1. Plano preparado em
docs/sdd/remocao-de-telefone-do-perfil/plan.md: distinção de presença na rota,
fallback somente undefined no serviço, testes diretos com SQLite em memória
e HTTP autenticado com banco descartável, sem .env/DB real ou ERP. Plano em
revisão; código/testes/dependências permanecem intactos nesta unidade.

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
