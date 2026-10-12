# Plano de implementação — Carrinho por sessão

**Versão:** 1
**Estado:** Implementado — troca manual e CI confirmadas; integração visual complementar pendente
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** 1d30bcc; 2026-10-11
**Objetivo:** isolar conteúdo e resultados assíncronos por ciclo autenticado.
**Arquitetura:** controlador sem React por identidade; provider assina snapshot
com useSyncExternalStore, ativa/invalida no ciclo de layout e publica somente
controlador da identidade atual. Sem remontar App.
**Stack:** JavaScript ESM, React existente, node:test; sem dependências novas.
**Aprovação do desenho:** usuário “aprovado”, em 2026-10-11.
**Aprovação para implementar este plano:** versão 1 aprovada em 2026-10-11; usuário: “aprovado”, após apresentação do plan.md.
**Execução:** na sessão autorizada, sequencial, sem delegação automática.

## Restrições globais

REQ-01 a REQ-09. Backend/schema/auth/cookies permanecem intactos; nenhuma
mutação real de banco ou SIAC nos testes. Concorrência dentro da mesma sessão,
logout em outra aba e cancelamento de escrita no servidor ficam fora.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Criar | frontend/src/lib/carrinhoPorSessao.js | Snapshot, ciclo e aplicação de resultados |
| Criar | frontend/tests/carrinho-por-sessao.test.js | Promessas controladas/API fake |
| Alterar | frontend/src/contextos/CarrinhoContext.jsx | Integração auth/controlador/assinatura |
| Alterar | frontend/src/paginas/Carrinho.jsx | Erro de leitura e tentativa novamente |
| Alterar | frontend/src/paginas/Checkout.jsx | Erro de leitura e guarda de continuação |
| Alterar | frontend/src/paginas/Catalogo.jsx e Produto.jsx | Não avisar sucesso de operação invalidada |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Resultados e limites |
| Atualizar | docs/sdd/carrinho-por-sessao/spec.md e plan.md | Aprovação, critérios e evidências |

## Contrato do controlador

criarCarrinhoPorSessao(apiCarrinho, autenticado) cria unidade inativa e sem I/O.
Cada instância tem ciclo próprio; nenhuma instância é compartilhada ou cacheada
por ID. Snapshot estável: { carrinho, carregando, erro }. Carrinho vazio tem os
mesmos campos e zeros da baseline, pronto_para_checkout=false.

Métodos: obterSnapshot(), assinar(listener)→unsubscribe, ativar(), invalidar(),
recarregar(), adicionar(codigo, quantidade=1), alterar(codigo, quantidade),
remover(codigo), limpar(), setCarrinho(valorOuAtualizador).

Operações retornam Promise<boolean>: false significa ciclo inativo/invalidado,
true conclusão no ciclo atual. Leitura falha publica erro e retorna true;
mutação atual falha lança ErroApi. Falha tardia resolve false, sem publicar erro.
Setter síncrono retorna false quando inativo, true quando aplicado; suporta
valor e função do valor anterior, como useState. Nenhum consumidor externo usa
setter hoje, mas ele permanece vinculado à instância da sessão.

## Tarefa 1 — Controlador e regressões determinísticas

**Cobertura:** AC-01 a AC-05; parte de AC-06. Consome api.carrinho injetada.
Produz módulo real importado tanto pelo provider quanto pelos testes.

- [x] Registrar aprovação de spec/plano, conferir Git e marcar Em implementação.
- [x] Criar testes antes da implementação usando node:test/assert e esta base:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { criarCarrinhoPorSessao } from '../src/lib/carrinhoPorSessao.js';

function adiar() {
  let resolver, rejeitar;
  const promessa = new Promise((ok, falha) => { resolver = ok; rejeitar = falha; });
  return { promessa, resolver, rejeitar };
}
const dados = (codigo) => ({ itens: [{ codigo_produto: codigo, quantidade: 1 }],
  quantidade_itens: 1, quantidade_pecas: 1, valor_total: 20, pronto_para_checkout: true });

for (const metodo of ['recarregar', 'adicionar', 'alterar', 'remover', 'limpar']) {
  for (const falhar of [false, true]) {
    test('descarta resultado tardio: ' + metodo + '/' + falhar, async () => {
      const pendente = adiar();
      let chamadas = 0;
      const api = Object.fromEntries(['ler', 'adicionar', 'alterar', 'remover', 'limpar']
        .map(nome => [nome, () => { chamadas++; return pendente.promessa; }]));
      const antigo = criarCarrinhoPorSessao(api, true);
      antigo.ativar();
      const operacao = antigo[metodo]('A', 1);
      antigo.invalidar();
      const atual = criarCarrinhoPorSessao(api, true);
      atual.ativar();
      atual.setCarrinho(dados('B'));
      const antes = atual.obterSnapshot();
      if (falhar) pendente.rejeitar(Object.assign(new Error('simulado'), { status: 500 }));
      else pendente.resolver({ dados: dados('A') });
      assert.equal(await operacao, false);
      assert.equal(atual.obterSnapshot(), antes);
      assert.equal(await antigo[metodo]('A', 1), false);
      assert.equal(chamadas, 1);
    });
  }
}
```

- [x] Acrescentar testes concretos das seguintes transições com a mesma API fake:
  visitante ativo → recarregar/adicionar/alterar/remover/limpar retornam false e
  contagem de chamadas=0; instância ainda inativa também não chama API.
- [x] Testar leitura atual resolvida: carrinho=dados('A'), erro=null,
  carregando=false; durante promessa carregando=true. Assinante recebe alterações,
  obterSnapshot retorna mesma referência quando não há mudança; unsubscribe funciona.
- [x] Testar ciclo StrictMode: ativar→recarregar pendente→invalidar→ativar→
  segunda leitura; resolver segunda com B e primeira com A; manter B e primeira
  retornar false. Cobrir também rejeição tardia sem mudar erro/carregando atuais.
- [x] Testar X→visitante→X com três instâncias, mesmo ID conceitual: primeira
  resposta X nunca publica no último ciclo X; snapshot inicial do último é vazio.
- [x] Testar leitura 401: carrinho vazio, erro preservado com status=401,
  carregando=false. Rede/status=0 e 500: erro visível, snapshot sem carrinho
  elegível para checkout. Recarga bem-sucedida limpa erro e restaura dados.
- [x] Testar mutação atual com sucesso publica retorno; com erro lança a mesma
  instância do erro. Parametrizar quatro métodos, verificando argumentos.
- [x] Testar setter valor/função, bloqueio depois de invalidar, limpeza de erro
  e flags no invalidar; assinantes não recebem publicações de respostas tardias.
- [x] Rodar `node --test tests/carrinho-por-sessao.test.js` em frontend/ e
  registrar RED. Se módulo ainda não existe, distinguir falha de importação
  de prova comportamental; não alegar reprodução da baseline por esse erro.
- [x] Implementar controlador conforme algoritmo abaixo, reexecutando testes:

```text
Inicial: ativo=false, geracao=0, listeners=Set; snapshot vazio (carregando=autenticado).
publicar: novo snapshot só quando muda; notificar listeners.
ativar: incrementar geracao, ativo=true, resetar snapshot da instância.
invalidar: ativo=false, incrementar geracao, resetar conteúdo/erro/carga.
executar: se !ativo ou !autenticado retornar false sem chamar API;
          capturar geracao; marcar carga/limpar erro somente para leitura;
          await chamada API executada imediatamente, sem fila/retry automático;
          se !ativo ou geracao mudou retornar false;
          sucesso: publicar resposta.dados e limpar erro, retornar true;
          falha de leitura: publicar vazio + erro, retornar true;
          falha de mutação: se status=401 publicar vazio + erro; lançar erro;
          finally de leitura: só desligar carga se ativo e geracao é a capturada.
```

O 401 é exibido como erro de sessão, permitindo recarga/login; não alterar
usuario do AuthContext pelo controlador. Falhas técnicas limpam a representação
para bloquear compra, mas UI deve mostrar erro antes de qualquer estado vazio.

## Tarefa 2 — Ligação ao React e aos consumidores

**Cobertura:** REQ-02/03/05/08 e AC-02/03/05/06/07.

- [x] No provider, usar useAuth para obter usuario/carregando. Criar controlador
  com useMemo por [usuario?.id, carregandoAuth], sem I/O no render. Auth ainda
  carregando usa instância não autenticada. Não manter registro por ID: retornar
  ao mesmo ID após visitante gera nova instância. Exemplo de integração:

```js
const { usuario, carregando: carregandoAuth } = useAuth();
const usuarioId = usuario?.id ?? null;
const controle = useMemo(
  () => criarCarrinhoPorSessao(api.carrinho, !carregandoAuth && usuarioId !== null),
  [usuarioId, carregandoAuth],
);
const estado = useSyncExternalStore(controle.assinar, controle.obterSnapshot);
useLayoutEffect(() => {
  controle.ativar();
  void controle.recarregar();
  return () => controle.invalidar();
}, [controle]);
```

Métodos assinar/obterSnapshot devem ser funções fechadas, sem dependência de
this. Cada nova instância tem snapshot vazio desde o render; cleanup invalida
callbacks antigos antes dos eventos seguintes. Ciclo interno invalida promises
entre cleanup/setup do StrictMode. Children não recebem key, não são remontados.

- [x] Contexto publica estado e métodos estáveis da instância. carregando inclui
  carregandoAuth; não reutilizar snapshot antigo enquanto novo efeito não rodou.
- [x] Em Catalogo e Produto, usar guarda antes de recado de sucesso:

```js
const aplicado = await adicionar(produto.codigo, 1);
if (aplicado === false) return;
```

Em Produto, preservar os argumentos reais da adição (quantidade escolhida);
substituir apenas captura de retorno/guarda. Erro atual mantém catch existente.

- [x] Em Checkout, as duas chamadas de recarregar após sucesso/erro verificam
  retorno false antes de continuar. Isso impede navegar em resposta a uma
  recarga do ciclo antigo. Criação de pedido em si não é refeita nem cancelada;
  concorrência de checkout/auth e respostas de endereços ficam fora do FIX-005.
- [x] Carrinho e Checkout consomem erro do contexto com alias erroCarrinho.
  Depois da guarda de carregando e antes de vazio/resumo, renderizar:

```jsx
if (erroCarrinho) return (
  <div className="space-y-4">
    <Alerta tipo="erro" titulo="Não foi possível carregar o carrinho">
      {erroCarrinho.message}
    </Alerta>
    <Botao onClick={recarregar}>Tentar novamente</Botao>
  </div>
);
```

Manter erro de mutação local distinto. Erro de sessão não habilita checkout.
Não adicionar mensagens técnicas de geração/identidade aos fluxos de produto.
- [x] Conferir nenhuma importação/ciclo entre Auth e Carrinho; somente Carrinho
  consome Auth. main.jsx mantém árvore; comentário torna-se verdadeiro.

## Tarefa 3 — Verificação e entrega

- [x] Rodar `npm test` em frontend/ e backend/, `npm run build` em frontend/,
  `git diff --check` na raiz. Não impor contagem inventada; registrar real.
- [x] Navegador: carregar X com itens; sair; entrar Y com conteúdo diferente;
  verificar badge/conteúdo/total corretos sem F5. Reentrar X sem F5. Usar contas
  existentes; não cadastrar dados pessoais, criar pedidos ou alterar estoque.
- [ ] Confirmar visitante não consulta /api/carrinho e boot autenticado aguarda
  /auth/eu. Repetir em desenvolvimento StrictMode, sem erro/unhandled rejection.
- [ ] Com API interceptada, segurar leitura X, trocar para Y e responder X por
  último; repetir com falha e com mutação fake, sem escrita real. Rede/500 atuais
  exibem erro/recarga; 401 não preserva dados nem habilita checkout.
- [ ] Conferir URL/filtros após troca; manter testes KZN-312/318 e KZN-325 verdes.
- [x] Registrar limites: testes do controlador não são testes de hooks/React;
  integração exige navegador. Atualizar spec/plano/inventário/relatório.
- [x] Quando autorizado, commit `fix: isola estado do carrinho por sessao` e
  publicação da branch. PR somente sob comando explícito; merge pelo usuário.

## Matriz de validação

| Aceite | Provas | Observado |
|---|---|---|
| AC-01 | Instância visitante/inativa + Network boot | Controlador passou; Network manual pendente |
| AC-02/03 | Instâncias por sessão + manual X/Y | Troca X/Y/X confirmada pelo usuário; transição lenta visual pendente |
| AC-04 | Dez casos parametrizados, ciclo cleanup/setup, retorno X e callback antigo | Passou no controlador real; React manual pendente |
| AC-05 | 401/0/500 e retry + telas | Controlador passou; UI manual pendente |
| AC-06 | Suítes/build/diff e preservação URL | 37 frontend/23 backend/build/diff passaram; URL manual pendente |
| AC-07 | Navegador e evidências separadas de teste puro | Não executado |

## Migração, recuperação e autorrevisão

Sem migração/dados. Reversão pelo fluxo Git, nunca reset de banco. Helpers
somente para ciclo do carrinho, sem troca de stack. Aprovação registrada é do
desenho; implementação aprovada e executada; validação manual/CI pendentes.

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
