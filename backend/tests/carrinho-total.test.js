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
      db.prepare("INSERT INTO carrinhos(id,usuario_id,nome,principal,criado_em,atualizado_em) VALUES(?,?,'Meu carrinho',1,'2026-01-01','2026-01-01')").run(id,id);
    }
    db.prepare('INSERT INTO enderecos (id,usuario_id,apelido,cep,logradouro,numero,bairro,cidade,uf,principal,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(1, 1, 'Teste', '00000-000', 'Rua de teste', '1', 'Centro', 'Teste', 'SP', 1, '2026-01-01', '2026-01-01');
    const produtos = new Map();
    for (const linha of entrada.itens) {
      produtos.set(linha.codigo, { ...linha });
      db.prepare('INSERT INTO carrinho_itens (carrinho_id,codigo_produto,quantidade,adicionado_em) VALUES (?,?,?,?)')
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
      const { lerCarrinho, alterarQuantidade } = await import(${JSON.stringify(moduloCarrinho)});
      const antes = db.prepare('SELECT * FROM carrinho_itens ORDER BY id').all();
      const carrinho = await lerCarrinho(1, 1, db);
      let checkoutErro = null;
      if (entrada.checkout) {
        const { finalizarPedido } = await import(${JSON.stringify(moduloPedido)});
        try {
          await finalizarPedido({ id: 1, nome: 'Teste', documento: '00000000000' }, {carrinho_id:1,versao_carrinho:1,tentativa_id:'teste-pendencia',endereco_id:1,observacao:''}, db);
        } catch (erro) { checkoutErro = erro.codigo; }
      }
      let releitura = null;
      if (entrada.novoEstoque !== undefined) {
        produtos.get(entrada.itens[0].codigo).estoque = entrada.novoEstoque;
        releitura = await lerCarrinho(1, 1, db);
      }
      let alterado = null;
      let alteracaoErro = null;
      if (entrada.alteracao) {
        const { codigo, quantidade, estoqueAntes, usuario = 1 } = entrada.alteracao;
        if (estoqueAntes !== undefined) produtos.get(codigo).estoque = estoqueAntes;
        try { alterado = await alterarQuantidade(usuario, usuario, codigo, quantidade, db); }
        catch (erro) { alteracaoErro = { status: erro.status, codigo: erro.codigo }; }
      }
      const depois = db.prepare('SELECT * FROM carrinho_itens ORDER BY id').all();
      console.log(JSON.stringify({ carrinho, antes, depois, checkoutErro, posts, releitura, alterado, alteracaoErro }));
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
    if (!dados.alterado) assert.deepEqual(dados.depois, dados.antes, 'leitura/bloqueio nao altera itens');
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

for (const [nome, itens, pecas, distintos] of [
  ['3+4 unidades', [item('A', { quantidade: 3 }), item('B', { quantidade: 4 })], 7, 2],
  ['uma linha', [item('A', { quantidade: 5 })], 5, 1],
  ['vazio', [], 0, 0],
  ['acima de 99', [item('A', { quantidade: 99, estoque: 100 }), item('B', { quantidade: 2 })], 101, 2],
  ['outro usuario', [item('A', { quantidade: 3 }), item('B', { usuario: 2, quantidade: 4 })], 3, 1],
]) {
  test('KZN-318: contador com ' + nome, () => {
    const { carrinho } = consultar({ itens });
    assert.equal(carrinho.quantidade_pecas, pecas);
    assert.equal(carrinho.quantidade_itens, distintos);
  });
}

test('KZN-318: pendencia conta unidades sem entrar no total', () => {
  const { carrinho } = consultar({ itens: [
    item('OK', { quantidade: 3 }),
    item('SEM', { quantidade: 4, estoque: 0 }),
  ] });
  assert.equal(carrinho.quantidade_pecas, 7);
  assert.equal(carrinho.quantidade_itens, 2);
  assert.equal(carrinho.valor_total, 60);
  assert.equal(carrinho.pronto_para_checkout, false);
});

test('FIX-003: subtotais e total decimal preservam centavos', () => {
  const { carrinho } = consultar({ itens: [
    item('A', { preco: 1.15, quantidade: 3 }),
    item('B', { preco: 4.10, quantidade: 2 }),
    item('SEM', { preco: 19.99, estoque: 0 }),
  ] });
  assert.deepEqual(carrinho.itens.map(i => i.valor_total), [3.45, 8.20, 19.99]);
  assert.equal(carrinho.valor_total, 11.65);
  assert.equal(carrinho.quantidade_pecas, 6);
  assert.equal(carrinho.quantidade_itens, 3);
  assert.equal(carrinho.pronto_para_checkout, false);
});


for (const [nome, opcoes, esperado] of [
  ['disponivel', {}, true], ['reduzido', { quantidade: 5, estoque: 3 }, true],
  ['inativo', { ativo: false }, false], ['zero', { estoque: 0 }, false],
  ['ausente', { statusERP: 404 }, false], ['falha', { statusERP: 500 }, false],
]) {
  test('FIX-006: capacidade de editar ' + nome, () => {
    const { carrinho } = consultar({ itens: [item('A', opcoes)] });
    assert.equal(carrinho.itens[0].quantidade_editavel, esperado);
  });
}

function itensComEstoqueReduzido() {
  return [item('A', { quantidade: 5, estoque: 3 }), item('B', { usuario: 2, quantidade: 2 })];
}

test('FIX-006: reduzir resolve pendencia e preserva outro usuario', () => {
  const dados = consultar({ itens: itensComEstoqueReduzido(), alteracao: { codigo: 'A', quantidade: 3 } });
  assert.equal(dados.carrinho.itens[0].disponivel, false);
  assert.equal(dados.carrinho.itens[0].quantidade_editavel, true);
  assert.equal(dados.carrinho.valor_total, 0);
  assert.equal(dados.carrinho.pronto_para_checkout, false);
  assert.equal(dados.alteracaoErro, null);
  assert.equal(dados.alterado.itens[0].quantidade, 3);
  assert.equal(dados.alterado.itens[0].valor_total, 60);
  assert.equal(dados.alterado.valor_total, 60);
  assert.equal(dados.alterado.quantidade_pecas, 3);
  assert.equal(dados.alterado.pronto_para_checkout, true);
  assert.deepEqual(dados.depois, dados.antes.map(linha => linha.carrinho_id === 1 ? { ...linha, quantidade: 3 } : linha));
});

test('FIX-006: nova queda rejeita sem alterar linhas', () => {
  const dados = consultar({ itens: itensComEstoqueReduzido(), alteracao: { codigo: 'A', quantidade: 3, estoqueAntes: 2 } });
  assert.deepEqual(dados.alteracaoErro, { status: 409, codigo: 'ESTOQUE_INSUFICIENTE' });
  assert.equal(dados.alterado, null);
  assert.deepEqual(dados.depois, dados.antes);
});

test('FIX-006: usuario nao altera produto alheio', () => {
  const dados = consultar({ itens: itensComEstoqueReduzido(), alteracao: { codigo: 'A', quantidade: 3, usuario: 2 } });
  assert.deepEqual(dados.alteracaoErro, { status: 404, codigo: 'NAO_ENCONTRADO' });
  assert.deepEqual(dados.depois, dados.antes);
});
