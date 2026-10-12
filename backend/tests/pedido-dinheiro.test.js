import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const moduloPedido = new URL('../src/services/pedidoService.js', import.meta.url).href;
const schema = new URL('../src/db/schema.sql', import.meta.url).href;

test('FIX-003: pedido conserva total ERP em centavos e isolamento', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'kaizen-pedido-dinheiro-'));
  const script = `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { readFileSync } from 'node:fs';
    const require = createRequire(${JSON.stringify(moduloPedido)});
    const Database = require('better-sqlite3');
    const db = new Database(':memory:');
    try {
      db.pragma('foreign_keys = ON');
      db.exec(readFileSync(new URL(${JSON.stringify(schema)}), 'utf8'));
      for (const id of [1, 2]) {
        db.prepare('INSERT INTO usuarios (id,nome,email,senha_hash,documento,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?)')
          .run(id, 'Teste', 'teste'+id+'@example.invalid', 'hash-sintetico', '00000000000', '2026-01-01', '2026-01-01');
        db.prepare('INSERT INTO enderecos (id,usuario_id,apelido,cep,logradouro,numero,bairro,cidade,uf,principal,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
          .run(id, id, 'Teste', '00000-000', 'Rua sintetica '+id, '1', 'Centro', 'Teste', 'SP', 1, '2026-01-01', '2026-01-01');
        db.prepare('INSERT INTO carrinho_itens (usuario_id,codigo_produto,quantidade,adicionado_em) VALUES (?,?,?,?)')
          .run(id, 'A', 1, '2026-01-01');
      }
      const posts = [];
      globalThis.fetch = async (entrada, opcoes) => {
        const url = new URL(entrada);
        assert.equal(url.origin, 'https://erp.invalid');
        if (url.pathname === '/produtos/A' && opcoes.method === 'GET') {
          return Response.json({ dados: { codigo: 'A', descricao: 'Teste', marca: 'Teste',
            categoria: 'Teste', preco_unitario: 19.99, ativo: true, estoque: 10 } });
        }
        if (url.pathname === '/pedidos' && opcoes.method === 'POST') {
          posts.push(JSON.parse(opcoes.body));
          return Response.json({ dados: { numero: 'PED-SINTETICO-001', valor_total: 19.99 } });
        }
        throw new Error('requisicao fora do cenario');
      };
      const { finalizarPedido } = await import(${JSON.stringify(moduloPedido)});
      const usuario = { id: 1, nome: 'Teste', documento: '00000000000' };
      await assert.rejects(finalizarPedido(usuario, 2, '', db), erro => erro.status === 422);
      assert.equal(posts.length, 0);
      const pedido = await finalizarPedido(usuario, 1, '', db);
      const vinculo = db.prepare('SELECT * FROM pedidos_usuario WHERE usuario_id = ?').get(1);
      assert.equal(vinculo.valor_total_centavos, 1999);
      assert.equal(pedido.valor_total, 19.99);
      assert.equal(vinculo.numero_erp, 'PED-SINTETICO-001');
      assert.equal(JSON.parse(vinculo.endereco_entrega).id, 1);
      assert.equal(posts.length, 1);
      assert.deepEqual(posts[0].itens, [{ codigo_produto: 'A', quantidade: 1 }]);
      assert.match(posts[0].observacao, /Entrega: Rua sintetica 1, 1/);
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM carrinho_itens WHERE usuario_id = ?').get(1).total, 0);
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM carrinho_itens WHERE usuario_id = ?').get(2).total, 1);
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM pedidos_usuario WHERE usuario_id = ?').get(2).total, 0);
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
      },
      encoding: 'utf8', timeout: 10000,
    });
    if (resultado.error) throw resultado.error;
    assert.equal(resultado.status, 0, resultado.stderr);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
