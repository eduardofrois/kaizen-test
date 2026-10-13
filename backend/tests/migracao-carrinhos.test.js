import test from 'node:test';
import { executarCenario, preparar } from './apoio/multiplos-carrinhos.js';

test('migração preserva legado, conta vazia, endereço e pedido; segunda aplicação não duplica', () => {
  executarCenario(preparar + `
    db.exec(readFileSync(new URL('tests/fixtures/schema-carrinho-legado.sql',raiz),'utf8'));
    usuario(1); usuario(2);
    db.prepare('INSERT INTO enderecos(id,usuario_id,apelido,cep,logradouro,numero,bairro,cidade,uf,principal,criado_em,atualizado_em) VALUES(1,1,?,?,?,?,?,?,?,?,?,?)')
      .run('Oficina','00000-000','Rua sintética','1','Centro','Teste','SP',1,'2026-01-01','2026-01-01');
    db.prepare('INSERT INTO carrinho_itens(id,usuario_id,codigo_produto,quantidade,adicionado_em) VALUES(7,1,?,?,?)').run('A',3,'2026-02-01');
    db.prepare('INSERT INTO pedidos_usuario(usuario_id,numero_erp,endereco_entrega,valor_total_centavos,criado_em) VALUES(1,?,?,?,?)').run('TESTE','{}',1999,'2026-02-01');
    const antes=db.prepare('SELECT * FROM carrinho_itens').all();
    const pedidos=db.prepare('SELECT * FROM pedidos_usuario').all();
    const enderecos=db.prepare('SELECT * FROM enderecos').all();
    aplicarSchema(db); aplicarSchema(db);
    const depois=db.prepare('SELECT i.id,c.usuario_id,i.codigo_produto,i.quantidade,i.adicionado_em FROM carrinho_itens i JOIN carrinhos c ON c.id=i.carrinho_id').all();
    assert.deepEqual(depois,antes);
    assert.deepEqual(db.prepare('SELECT * FROM pedidos_usuario').all(),pedidos);
    assert.deepEqual(db.prepare('SELECT * FROM enderecos').all(),enderecos);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM carrinhos WHERE principal=1').get().n,2);
    assert.deepEqual(db.pragma('foreign_key_check'),[]);
    db.close();
  `);
});

test('migração inválida reverte renomeação e rejeita versão futura', () => {
  executarCenario(preparar + `
    db.exec(readFileSync(new URL('tests/fixtures/schema-carrinho-legado.sql',raiz),'utf8'));
    usuario(1);
    db.pragma('foreign_keys = OFF');
    db.prepare('INSERT INTO carrinho_itens(usuario_id,codigo_produto,quantidade,adicionado_em) VALUES(99,?,?,?)').run('A',1,'2026-01-01');
    db.pragma('foreign_keys = ON');
    assert.throws(()=>aplicarSchema(db));
    assert.ok(db.pragma('table_info(carrinho_itens)').some(c=>c.name==='usuario_id'));
    assert.equal(db.pragma('user_version',{simple:true}),0);
    db.pragma('user_version=99');
    assert.throws(()=>aplicarSchema(db),/versão/i);
    db.close();
  `);
});
