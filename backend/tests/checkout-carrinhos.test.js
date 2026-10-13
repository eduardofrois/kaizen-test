import test from 'node:test';
import { executarCenario, preparar } from './apoio/multiplos-carrinhos.js';

const inicio = preparar + `
aplicarSchema(db); usuario(1); usuario(2);
const gestao=await import(new URL('src/services/carrinhosService.js',raiz));
const itens=await import(new URL('src/services/carrinhoService.js',raiz));
const {finalizarPedido}=await import(new URL('src/services/pedidoService.js',raiz));
const checkout=await import(new URL('src/services/checkoutService.js',raiz));
const a=gestao.garantirCarrinhoInicial(1,db),b=gestao.criarCarrinho(1,'Civic',db);
db.prepare('INSERT INTO enderecos(id,usuario_id,apelido,cep,logradouro,numero,bairro,cidade,uf,principal,criado_em,atualizado_em) VALUES(1,1,?,?,?,?,?,?,?,?,?,?)')
 .run('Oficina','00000-000','Rua sintética','1','Centro','Teste','SP',1,'2026-01-01','2026-01-01');
const posts=[];
let respostaPost=async()=>Response.json({dados:{numero:'PED-SINTETICO',valor_total:3.45}});
globalThis.fetch=async(url,opcoes)=>{
 assert.equal(new URL(url).origin,'https://erp.invalid');
 if(opcoes.method==='POST'){ posts.push(JSON.parse(opcoes.body)); return respostaPost(); }
 return Response.json({dados:{codigo:'A',descricao:'Peça',preco_unitario:1.15,ativo:true,estoque:50}});
};
await itens.adicionarItem(1,a.id,'A',3,db);
const dados={carrinho_id:a.id,versao_carrinho:gestao.buscarCarrinho(1,a.id,db).versao,
 tentativa_id:'00000000-0000-4000-8000-000000000001',endereco_id:1,observacao:''};
const u={id:1,nome:'Teste',documento:'00000000000'};
`;

test('compra mantém nome, limpa só origem e replay não envia novamente', () => executarCenario(inicio + `
await itens.adicionarItem(1,b.id,'A',1,db);
const resultado=await finalizarPedido(u,dados,db);
assert.equal(resultado.pedido.numero,'PED-SINTETICO');
assert.equal(resultado.repetido,false);
assert.equal((await itens.lerCarrinho(1,a.id,db)).quantidade_pecas,0);
assert.equal((await itens.lerCarrinho(1,b.id,db)).quantidade_pecas,1);
assert.equal(gestao.buscarCarrinho(1,a.id,db).nome,'Meu carrinho');
assert.equal((await finalizarPedido(u,dados,db)).repetido,true);
assert.equal(posts.length,1);
assert.equal(db.prepare('SELECT valor_total_centavos FROM pedidos_usuario').get().valor_total_centavos,345);
db.close();
`));

test('checkout retido bloqueia mutações e segunda tentativa; outro carrinho livre', () => executarCenario(inicio + `
let liberar,recebeu; const recebido=new Promise(r=>recebeu=r);
respostaPost=()=>{recebeu();return new Promise(r=>liberar=r);};
const pedido=finalizarPedido(u,dados,db); await recebido;
await assert.rejects(itens.adicionarItem(1,a.id,'A',1,db),e=>e.codigo==='CARRINHO_EM_CHECKOUT');
assert.throws(()=>gestao.excluirCarrinho(1,a.id,true,db),e=>e.codigo==='CARRINHO_EM_CHECKOUT');
await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CARRINHO_EM_CHECKOUT');
await itens.adicionarItem(1,b.id,'A',1,db);
liberar(Response.json({dados:{numero:'PED-SINTETICO',valor_total:3.45}})); await pedido;
assert.equal(posts.length,1); db.close();
`));

for (const modo of ['timeout','5xx','invalida','falha-local']) {
  test('resultado incerto preserva itens e bloqueio: '+modo, () => executarCenario(inicio + `
    const modo=${JSON.stringify(modo)};
    if(modo==='timeout')respostaPost=async()=>{throw new Error('falha sintética');};
    if(modo==='5xx')respostaPost=async()=>Response.json({erro:{}},{status:500});
    if(modo==='invalida')respostaPost=async()=>Response.json({dados:{}});
    if(modo==='falha-local')db.exec("CREATE TRIGGER falha BEFORE INSERT ON pedidos_usuario BEGIN SELECT RAISE(ABORT,'sintético'); END");
    await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CHECKOUT_INCERTO');
    assert.equal(checkout.lerEstadoCheckout(1,a.id,db).estado,'incerto');
    assert.equal((await itens.lerCarrinho(1,a.id,db)).quantidade_pecas,3);
    await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CHECKOUT_INCERTO');
    assert.equal(posts.length,1); db.close();
  `));
}

test('recusa conclusiva libera; versão antiga e posse rejeitam sem enviar', () => executarCenario(inicio + `
await assert.rejects(finalizarPedido({...u,id:2},dados,db),e=>e.status===404);
await assert.rejects(finalizarPedido(u,{...dados,versao_carrinho:1},db),e=>e.codigo==='CARRINHO_ALTERADO');
respostaPost=async()=>Response.json({erro:{codigo:'ESTOQUE_INSUFICIENTE',mensagem:'Recusado'}},{status:409});
await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='ESTOQUE_INSUFICIENTE');
await itens.adicionarItem(1,a.id,'A',1,db);
assert.equal(posts.length,1); db.close();
`));

test('mutação iniciada antes do checkout não grava depois do bloqueio', () => executarCenario(inicio + `
const buscarOriginal=globalThis.fetch;let liberarGet,recebeuGet;
const getRecebido=new Promise(r=>recebeuGet=r);
globalThis.fetch=(url,opcoes)=>{
 if(opcoes.method==='GET'&&new URL(url).pathname==='/produtos/B'){
  recebeuGet();return new Promise(r=>liberarGet=()=>r(Response.json({dados:{codigo:'B',descricao:'B',preco_unitario:1,ativo:true,estoque:20}})));
 }return buscarOriginal(url,opcoes);
};
const mutacao=itens.adicionarItem(1,a.id,'B',1,db);await getRecebido;
let liberarPost,recebeuPost;const postRecebido=new Promise(r=>recebeuPost=r);
respostaPost=()=>{recebeuPost();return new Promise(r=>liberarPost=r);};
const pedido=finalizarPedido(u,dados,db);await postRecebido;liberarGet();
await assert.rejects(mutacao,e=>e.codigo==='CARRINHO_EM_CHECKOUT');
liberarPost(Response.json({dados:{numero:'PED-SINTETICO',valor_total:3.45}}));await pedido;
assert.deepEqual(posts[0].itens,[{codigo_produto:'A',quantidade:3}]);db.close();
`));

test('bloqueio/replay sobrevivem a outra conexão e reabertura do SQLite', () => executarCenario(
  inicio.replace("const db = new Database(':memory:');", "const db=new Database(process.env.DB_PATH);") + `
const db2=new Database(process.env.DB_PATH);db2.pragma('foreign_keys=ON');
let liberar,recebeu;const recebido=new Promise(r=>recebeu=r);
respostaPost=()=>{recebeu();return new Promise(r=>liberar=r);};
const pedido=finalizarPedido(u,dados,db);await recebido;
assert.throws(()=>gestao.renomearCarrinho(1,a.id,'Mudança',db2),e=>e.codigo==='CARRINHO_EM_CHECKOUT');
await assert.rejects(finalizarPedido(u,{...dados,tentativa_id:'outra'},db2),e=>e.codigo==='CARRINHO_EM_CHECKOUT');
liberar(Response.json({dados:{numero:'PED-SINTETICO',valor_total:3.45}}));await pedido;
db.close();db2.close();const db3=new Database(process.env.DB_PATH);
assert.equal((await finalizarPedido(u,dados,db3)).repetido,true);assert.equal(posts.length,1);
await assert.rejects(finalizarPedido(u,{...dados,observacao:'diferente'},db3),e=>e.codigo==='TENTATIVA_INCOMPATIVEL');
gestao.excluirCarrinho(1,a.id,false,db3);
await assert.rejects(finalizarPedido(u,dados,db3),e=>e.status===404);
assert.equal(db3.prepare('SELECT COUNT(*) n FROM checkout_tentativas').get().n,1);db3.close();
`));

test('reinício com envio sem conclusão conserva proteção e permite reconciliação sintética', () => executarCenario(
  inicio.replace("const db = new Database(':memory:');", "const db=new Database(process.env.DB_PATH);") + `
const endereco={id:1,apelido:'Oficina',logradouro:'Rua sintética'};
checkout.iniciarTentativa(1,dados,endereco,db);checkout.marcarEnviando(1,dados.tentativa_id,db);db.close();
const db2=new Database(process.env.DB_PATH);db2.pragma('foreign_keys=ON');
await assert.rejects(finalizarPedido(u,dados,db2),e=>e.codigo==='CARRINHO_EM_CHECKOUT');
assert.equal(posts.length,0);assert.equal((await itens.lerCarrinho(1,a.id,db2)).quantidade_pecas,3);
checkout.marcarIncerta(1,dados.tentativa_id,db2);checkout.registrarNumeroErp(1,dados.tentativa_id,'PED-RECONCILIADO',db2);
checkout.concluirTentativa(1,dados.tentativa_id,{numero:'PED-RECONCILIADO',valor_total:3.45},db2);
assert.equal((await itens.lerCarrinho(1,a.id,db2)).quantidade_pecas,0);
assert.equal(posts.length,0);db2.close();
`));

for (const resposta of [
  {numero:'PED-PARCIAL',valor_total:null},
  {numero:17},
  {numero:'PED-NEGATIVO',valor_total:-1},
]) {
  test('REV-04: preserva número conhecido com total inválido '+resposta.numero, () => executarCenario(inicio + `
    const resposta=${JSON.stringify(resposta)};
    respostaPost=async()=>Response.json({dados:resposta});
    await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CHECKOUT_INCERTO');
    const tentativa=checkout.lerEstadoCheckout(1,a.id,db);
    assert.equal(tentativa.numero_erp,String(resposta.numero));
    assert.equal(tentativa.estado,'incerto');
    assert.equal((await itens.lerCarrinho(1,a.id,db)).quantidade_pecas,3);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM pedidos_usuario').get().n,0);
    assert.throws(()=>checkout.lerEstadoCheckout(2,a.id,db),e=>e.status===404);
    await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CHECKOUT_INCERTO');
    assert.equal(posts.length,1);db.close();
  `));
}

for (const numero of ['', '   ', null, {invalido:true}]) {
  test('REV-04: não persiste número inutilizável '+JSON.stringify(numero), () => executarCenario(inicio + `
    respostaPost=async()=>Response.json({dados:{numero:${JSON.stringify(numero)},valor_total:3.45}});
    await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CHECKOUT_INCERTO');
    assert.equal(checkout.lerEstadoCheckout(1,a.id,db).numero_erp,null);
    assert.equal(checkout.lerEstadoCheckout(1,a.id,db).estado,'incerto');
    assert.equal((await itens.lerCarrinho(1,a.id,db)).quantidade_pecas,3);
    assert.equal(posts.length,1);db.close();
  `));
}

test('REV-04: falha ao persistir referência parcial conserva bloqueio e erro incerto', () => executarCenario(inicio + `
db.exec("CREATE TRIGGER falha_referencia BEFORE UPDATE OF numero_erp ON checkout_tentativas BEGIN SELECT RAISE(ABORT,'falha sintética'); END");
respostaPost=async()=>Response.json({dados:{numero:'PED-PARCIAL',valor_total:null}});
await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CHECKOUT_INCERTO');
const tentativa=checkout.lerEstadoCheckout(1,a.id,db);
assert.ok(['incerto','enviando'].includes(tentativa.estado));assert.equal(tentativa.numero_erp,null);
await assert.rejects(itens.adicionarItem(1,a.id,'A',1,db),e=>e.codigo==='CARRINHO_EM_CHECKOUT');
await assert.rejects(finalizarPedido(u,dados,db),e=>['CHECKOUT_INCERTO','CARRINHO_EM_CHECKOUT'].includes(e.codigo));
assert.equal((await itens.lerCarrinho(1,a.id,db)).quantidade_pecas,3);
assert.equal(db.prepare('SELECT COUNT(*) n FROM pedidos_usuario').get().n,0);
assert.equal(posts.length,1);db.close();
`));

test('REV-04: referência parcial e proteção sobrevivem à reabertura do SQLite', () => executarCenario(
  inicio.replace("const db = new Database(':memory:');", "const db=new Database(process.env.DB_PATH);") + `
respostaPost=async()=>Response.json({dados:{numero:'PED-PARCIAL',valor_total:null}});
await assert.rejects(finalizarPedido(u,dados,db),e=>e.codigo==='CHECKOUT_INCERTO');db.close();
const db2=new Database(process.env.DB_PATH);db2.pragma('foreign_keys=ON');
assert.equal(checkout.lerEstadoCheckout(1,a.id,db2).numero_erp,'PED-PARCIAL');
assert.equal(checkout.lerEstadoCheckout(1,a.id,db2).estado,'incerto');
await assert.rejects(finalizarPedido(u,dados,db2),e=>e.codigo==='CHECKOUT_INCERTO');
assert.equal(posts.length,1);db2.close();
`));
