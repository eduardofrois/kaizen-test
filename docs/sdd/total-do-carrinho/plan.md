# Plano de implementação — Total do carrinho

**Versão:** 1
**Estado:** Implementado — testes locais passaram; validação manual e PR pendentes
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** 4261129; 2026-10-11
**Objetivo:** excluir linhas indisponíveis do total sem alterar seus dados.
**Arquitetura:** correção em lerCarrinho; teste do serviço real com SQLite
em memória e fetch simulado em subprocessos isolados.
**Stack:** JavaScript ESM, node:test e better-sqlite3 existentes.
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11;
usuário: “Consegui recriar, perfeito. Docs aprovados.”
**Execução:** nesta sessão, após aprovação; sem delegação automática.

## Restrições globais

REQ-01 a REQ-09 da spec. Implementação autorizada pela aprovação registrada da versão 1.
Não alterar dinheiro.js, frontend, contadores ou schema. Sem dependências
novas, env real, banco local, escrita SIAC, reset ou merge pela IA.

## Mapa de arquivos

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Alterar | backend/src/services/carrinhoService.js | Filtrar agregação em lerCarrinho |
| Criar | backend/tests/carrinho-total.test.js | Regressões reais do serviço e bloqueio checkout |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md, docs/decisoes.md | Evidências e limites |
| Atualizar | docs/sdd/total-do-carrinho/spec.md e plan.md | Estado e resultados observados |

## Tarefa 1 — Regressões e correção central

**Consome:** lerCarrinho(usuarioId, db), finalizarPedido(usuario, enderecoId,
observacao, db), schema.sql e contrato ERP { dados: produto }.
**Produz:** mesmo retorno do serviço com total filtrado, testes descobertos
pelo npm test existente. Sem novo contrato público ou dependência.
**Cobertura:** todos os requisitos e AC-01 a AC-07.

- [x] Registrar aprovação explícita, conferir Git e mudar SDD para Em implementação.
- [x] Preservar .env, banco e servidores locais. Se precisar reinstalar deps,
      utilizar cópia temporária somente dos arquivos versionados e modificados
      desta unidade, como na validação da pipeline; nunca copiar .env/dados.
- [x] Criar backend/tests/carrinho-total.test.js com o conteúdo abaixo:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const moduloCarrinho = new URL('../src/services/carrinhoService.js', import.meta.url).href;
const moduloPedido = new URL('../src/services/pedidoService.js', import.meta.url).href;
const schema = new URL('../src/db/schema.sql', import.meta.url).href;

function item(codigo, opcoes = {}) {
  return { codigo, quantidade: 1, preco: 20, estoque: 10, ativo: true, usuario: 1, ...opcoes };
}

function consultar(cenario) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'kaizen-total-'));
  const script = `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { readFileSync } from 'node:fs';
    const require = createRequire(${JSON.stringify(moduloCarrinho)});
    const Database = require('better-sqlite3');
    const entrada = JSON.parse(process.env.CENARIO_JSON);
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(readFileSync(new URL(${JSON.stringify(schema)}), 'utf8'));
    for (const id of [1, 2]) {
      db.prepare('INSERT INTO usuarios (id,nome,email,senha_hash,documento,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?)')
        .run(id, 'Usuario sintetico', 'teste'+id+'@example.invalid', 'hash-sintetico-sem-autenticacao', '00000000000', '2026-01-01', '2026-01-01');
    }
    db.prepare('INSERT INTO enderecos (id,usuario_id,apelido,cep,logradouro,numero,bairro,cidade,uf,principal,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(1, 1, 'Teste', '00000-000', 'Rua de teste', '1', 'Centro', 'Teste', 'SP', 1, '2026-01-01', '2026-01-01');
    const produtos = new Map();
    for (const linha of entrada.itens) {
      produtos.set(linha.codigo, { ...linha });
      db.prepare('INSERT INTO carrinho_itens (usuario_id,codigo_produto,quantidade,adicionado_em) VALUES (?,?,?,?)')
        .run(linha.usuario, linha.codigo, linha.quantidade, '2026-01-01');
    }
    let posts = 0;
    globalThis.fetch = async (url, opcoes) => {
      const endereco = new URL(url);
      if (opcoes.method !== 'GET') posts++;
      assert.equal(opcoes.method, 'GET', 'teste nao deve criar pedidos');
      assert.equal(endereco.origin, 'https://erp.invalid');
      assert.ok(endereco.pathname.startsWith('/produtos/'));
      const codigo = decodeURIComponent(endereco.pathname.slice('/produtos/'.length));
      const produto = produtos.get(codigo);
      assert.ok(produto, 'codigo deve existir no cenario sintetico');
      const status = produto.statusERP ?? 200;
      const dados = status === 200
        ? { dados: { codigo, descricao: codigo, marca: 'Teste', categoria: 'Teste',
            preco_unitario: produto.preco, estoque: produto.estoque, ativo: produto.ativo } }
        : { erro: { codigo: 'SIMULADO', mensagem: 'Falha sintetica' } };
      return new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } });
    };
    try {
      const { lerCarrinho } = await import(${JSON.stringify(moduloCarrinho)});
      const antes = db.prepare('SELECT * FROM carrinho_itens ORDER BY id').all();
      const carrinho = await lerCarrinho(1, db);
      let checkoutErro = null;
      if (entrada.checkout) {
        const { finalizarPedido } = await import(${JSON.stringify(moduloPedido)});
        try {
          await finalizarPedido({ id: 1, nome: 'Teste', documento: '00000000000' }, 1, '', db);
        } catch (erro) { checkoutErro = erro.codigo; }
      }
      let releitura = null;
      if (entrada.novoEstoque !== undefined) {
        produtos.get(entrada.itens[0].codigo).estoque = entrada.novoEstoque;
        releitura = await lerCarrinho(1, db);
      }
      const depois = db.prepare('SELECT * FROM carrinho_itens ORDER BY id').all();
      console.log(JSON.stringify({ carrinho, antes, depois, checkoutErro, posts, releitura }));
    } finally { db.close(); }
  `;
  try {
    const resultado = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd,
      env: {
        PATH: process.env.PATH, NODE_ENV: 'test',
        JWT_SEGREDO: 'jwt-sintetico-exclusivo-de-teste-0123456789',
        ERP_TOKEN: 'token-sintetico-de-teste', ERP_URL: 'https://erp.invalid',
        DB_PATH: path.join(cwd, 'banco-nao-deve-ser-aberto.db'),
        CENARIO_JSON: JSON.stringify(cenario),
      },
      encoding: 'utf8', timeout: 10000,
    });
    if (resultado.error) throw resultado.error;
    assert.equal(resultado.status, 0, resultado.stderr);
    const dados = JSON.parse(resultado.stdout.trim().split('\n').at(-1));
    assert.deepEqual(dados.depois, dados.antes, 'leitura/bloqueio nao altera itens');
    assert.equal(dados.posts, 0, 'nenhum pedido deve ser criado');
    return dados;
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}

test('KZN-312: total exclui R$684 sem estoque e preserva a linha', () => {
  const { carrinho } = consultar({ itens: [item('OK'), item('SEM', { preco: 228, quantidade: 3, estoque: 0 })] });
  assert.equal(carrinho.valor_total, 20);
  assert.equal(carrinho.itens.length, 2);
  assert.equal(carrinho.itens[1].valor_total, 684);
  assert.equal(carrinho.itens[1].quantidade, 3);
  assert.equal(carrinho.pronto_para_checkout, false);
});

for (const [motivo, opcoes] of [
  ['inativo', { ativo: false }],
  ['sem estoque', { estoque: 0 }],
  ['estoque insuficiente', { quantidade: 3, estoque: 2 }],
  ['fora do catalogo', { statusERP: 404 }],
  ['falha ERP', { statusERP: 500 }],
]) {
  test('total nao inclui linha com ' + motivo, () => {
    const { carrinho } = consultar({ itens: [item('OK'), item('PENDENTE', opcoes)] });
    assert.equal(carrinho.valor_total, 20);
    assert.equal(carrinho.itens[1].disponivel, false);
    assert.ok(carrinho.itens[1].problema);
    assert.equal(carrinho.pronto_para_checkout, false);
  });
}

test('vazio ou so indisponiveis tem total zero e checkout bloqueado', () => {
  for (const itens of [[], [item('SEM', { estoque: 0 })]]) {
    const { carrinho } = consultar({ itens });
    assert.equal(carrinho.valor_total, 0);
    assert.equal(carrinho.pronto_para_checkout, false);
    assert.equal(carrinho.itens.length, itens.length);
  }
});

test('disponiveis mantem subtotal, total e habilitacao do checkout', () => {
  const { carrinho } = consultar({ itens: [item('A'), item('B', { preco: 30, quantidade: 2 })] });
  assert.deepEqual(carrinho.itens.map(i => i.valor_total), [20, 60]);
  assert.equal(carrinho.valor_total, 80);
  assert.equal(carrinho.pronto_para_checkout, true);
});

test('total e linhas nao incluem carrinho de outro usuario', () => {
  const { carrinho } = consultar({ itens: [item('MEU'), item('OUTRO', { usuario: 2, preco: 100 })] });
  assert.deepEqual(carrinho.itens.map(i => i.codigo_produto), ['MEU']);
  assert.equal(carrinho.valor_total, 20);
});

test('checkout com pendencia rejeita antes de criar pedido', () => {
  const dados = consultar({ itens: [item('SEM', { estoque: 0 })], checkout: true });
  assert.equal(dados.checkoutErro, 'CARRINHO_COM_PENDENCIAS');
  assert.equal(dados.posts, 0);
});

test('nova leitura reavalia estoque sem modificar quantidade', () => {
  const dados = consultar({ itens: [item('A', { quantidade: 3, estoque: 4 })], novoEstoque: 2 });
  assert.equal(dados.carrinho.valor_total, 60);
  assert.equal(dados.carrinho.pronto_para_checkout, true);
  assert.equal(dados.releitura.valor_total, 0);
  assert.equal(dados.releitura.itens[0].quantidade, 3);
  assert.equal(dados.releitura.pronto_para_checkout, false);
});
```

- [x] Executar `node --test tests/carrinho-total.test.js` em backend/ na baseline.
      Esperado: falham casos que somam linhas indisponíveis com preço conhecido;
      controles já corretos passam. Registrar contagem RED real, sem inventá-la.
- [x] Alterar somente o redutor do total em lerCarrinho para:

```js
const totalCentavos = itens.reduce(
  (soma, item) => soma + (item.disponivel ? paraCentavos(item.valor_total) : 0),
  0,
);
```

- [x] Não alterar paraCentavos, valores das linhas, quantidade_pecas ou checkout.
      Preservar a nota KZN-7F3A. Não persistir preço/estoque localmente.
- [x] Executar `npm test` em backend/: esperado 17 testes passam (seis de
      configuração e onze novos testes); registrar resultado real. Executar
      `node --check src/services/carrinhoService.js` e `git diff --check`.
- [x] Confirmar que alteração de produto limita-se ao redutor. Não declarar
      FIX-003 ou KZN-318 resolvidos. Atualizar fix/relatório/decisões com
      causa, comportamento, provas RED/GREEN e limites da validação.
- [x] Commit `fix: exclui itens indisponiveis do total do carrinho` e publicação
      em origin/fix/total-do-carrinho, apenas com os arquivos revisados.
- [ ] Preparar PR para main; abertura pelo candidato ou por autorização
      explícita. Aguardar testes-backend e build-frontend; registrar links/SHA.
      Sem merge pela IA. Ajustar docs de status conforme a evidência evoluir.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Caso KZN-312 | Total 20, referência 684, bloqueio | Passou; RED 704, GREEN 20 |
| AC-02 | Cinco cenários parametrizados | Pendências excluídas, linhas preservadas | Cinco cenários passaram |
| AC-03 | Vazio/só indisponíveis/todos disponíveis + snapshot SQLite | Soma correta e dados intactos | Passou; snapshots iguais |
| AC-04 | Dois usuários no schema real em memória | Só dados do usuário 1 | Passou |
| AC-05 | finalizarPedido + releitura de estoque | Zero POSTs; bloqueio e recálculo | Passou; itens preservados |
| AC-06 | npm test + checks do PR | Suíte passa sem env/ERP/DB real; build passa | Local: 17 testes passaram; PR aguardando comando do usuário |
| AC-07 | Diff/histórico/docs | Escopo e limitação FIX-003 explícitos | Conferido; FIX-003 não alterado |

## Migração e recuperação

Não altera schema/dados. Reversão por commit/PR, nunca reset de banco ou
alteração do ERP. Não restaurar a soma indevida para contornar outra falha.

## Autorrevisão

Harness usa cwd temporário, env sintética, schema real em :memory: e fetch
sem chamada à implementação original. Captura somente resultado sintético.
Todos os requisitos têm passos e provas; sem novas dependências ou mudança
nos arquivos de aplicação antes da aprovação. Contadores, precisão monetária
e ajustes de quantidade permanecem unidades separadas.

## Implementação aprovada — 2026-10-11

Usuário confirmou reprodução manual do KZN-312 e aprovou versão 1 com
“Consegui recriar, perfeito. Docs aprovados.” Alteração do serviço limitada
à condição item.disponivel no redutor de valor_total. Linhas, quantidades,
subtotal referencial, contrato, contadores e bloqueio do checkout preservados.
Nota KZN-7F3A mantida. FIX-003 e FIX-005 não foram corrigidos nesta unidade.

RED: node --test tests/carrinho-total.test.js na baseline — onze testes,
seis falhas e cinco sucessos; cenário KZN-312 retornou 704 em vez de 20.
GREEN: npm test após a correção — 17 testes passaram (onze novos e seis
anteriores). Sintaxe de serviço/teste e git diff --check passaram. Harness
usou subprocessos com cwd temporário/env sintética, schema SQLite real em
:memory: e fetch substituído; nenhum .env/banco local/rede ERP utilizado.
Teste de finalizarPedido rejeitou pendências sem POST e preservou os itens.

Estado Implementado: validação automatizada local concluída; validação manual
da correção pelo candidato e checks no PR ainda pendentes. Usuário pediu
explicitamente aguardar seu comando para abrir PR, pois vai validar localmente.
Nenhum PR, merge ou pedido real criado pela IA. Publicação da branch segue
o fluxo autorizado; não equivale à autorização para abrir PR.
