import test from 'node:test';
import { executarCenario, preparar } from './apoio/multiplos-carrinhos.js';

const inicio = preparar + `
aplicarSchema(db); usuario(1); usuario(2);
const gestao=await import(new URL('src/services/carrinhosService.js',raiz));
const itens=await import(new URL('src/services/carrinhoService.js',raiz));
gestao.garantirCarrinhoInicial(1,db); gestao.garantirCarrinhoInicial(2,db);
globalThis.fetch=async(url,opcoes)=>{
  assert.equal(new URL(url).origin,'https://erp.invalid');
  assert.equal(opcoes.method,'GET');
  return Response.json({dados:{codigo:decodeURIComponent(new URL(url).pathname.split('/').at(-1)),
    descricao:'Peça',preco_unitario:1.15,ativo:true,estoque:100}});
};
`;

test('mesma peça em carrinhos independentes; posse e limites por carrinho', () => executarCenario(inicio + `
const a=gestao.criarCarrinho(1,'Gol',db),b=gestao.criarCarrinho(1,'Civic',db);
await itens.adicionarItem(1,a.id,'A',3,db);
await itens.adicionarItem(1,b.id,'A',4,db);
await itens.alterarQuantidade(1,a.id,'A',2,db);
assert.equal((await itens.lerCarrinho(1,b.id,db)).quantidade_pecas,4);
assert.equal((await itens.lerCarrinho(1,a.id,db)).valor_total,2.30);
await assert.rejects(itens.adicionarItem(2,a.id,'A',1,db),e=>e.status===404);
await itens.removerItem(1,a.id,'A',db);
assert.equal((await itens.lerCarrinho(1,b.id,db)).quantidade_pecas,4);
for(let n=0;n<7;n++)gestao.criarCarrinho(1,'Orçamento',db);
assert.equal(gestao.listarCarrinhos(1,db).carrinhos.length,10);
assert.throws(()=>gestao.criarCarrinho(1,'Excesso',db),e=>e.codigo==='LIMITE_DE_CARRINHOS');
db.close();
`));

test('exclusão confirma conteúdo, promove mais antigo e repõe último', () => executarCenario(inicio + `
const inicial=gestao.listarCarrinhos(1,db).carrinhos[0];
const a=gestao.criarCarrinho(1,'Gol',db);
gestao.definirPrincipal(1,a.id,db);
await itens.adicionarItem(1,a.id,'A',1,db);
assert.throws(()=>gestao.excluirCarrinho(1,a.id,false,db),e=>e.codigo==='CONFIRMACAO_NECESSARIA');
const lista=gestao.excluirCarrinho(1,a.id,true,db);
assert.equal(lista.principal_id,inicial.id);
const ultima=gestao.excluirCarrinho(1,inicial.id,false,db);
assert.equal(ultima.carrinhos.length,1);
assert.equal(ultima.carrinhos[0].nome,'Meu carrinho');
assert.notEqual(ultima.principal_id,inicial.id);
assert.equal(gestao.listarCarrinhos(2,db).carrinhos.length,1);
db.close();
`));

test('capacidade de produtos e unidades é independente por carrinho', () => executarCenario(inicio + `
const a=gestao.listarCarrinhos(1,db).carrinhos[0],b=gestao.criarCarrinho(1,'Outro',db);
await itens.adicionarItem(1,a.id,'P0',99,db);await itens.adicionarItem(1,a.id,'P0',1,db);
for(let n=1;n<50;n++)await itens.adicionarItem(1,a.id,'P'+n,1,db);
await assert.rejects(itens.adicionarItem(1,a.id,'EXCESSO',1,db),e=>e.codigo==='CARRINHO_CHEIO');
await itens.adicionarItem(1,b.id,'EXCESSO',1,db);
assert.equal((await itens.lerCarrinho(1,a.id,db)).itens[0].quantidade,99);
assert.equal((await itens.lerCarrinho(1,b.id,db)).quantidade_pecas,1);
itens.limparCarrinho(1,a.id,db);assert.equal((await itens.lerCarrinho(1,b.id,db)).quantidade_pecas,1);db.close();
`));

test('cadastro cria carrinho na mesma operação e rejeita nome inválido', () => executarCenario(inicio + `
const {cadastrarUsuario}=await import(new URL('src/services/usuarioService.js',raiz));
const u=await cadastrarUsuario({nome:'Teste',email:'novo@example.invalid',senha:'Sintetica123',documento:'00000000000'},db);
assert.equal(gestao.listarCarrinhos(u.id,db).carrinhos[0].principal,true);
for(const nome of ['', ' ', 'A'.repeat(61), null])assert.throws(()=>gestao.criarCarrinho(1,nome,db),e=>e.status===422);
db.close();
`));

test('dois processos disputam a última vaga sem exceder dez carrinhos', () => executarCenario(
 inicio.replace("const db = new Database(':memory:');", "const db=new Database(process.env.DB_PATH);db.pragma('journal_mode=WAL');") + `
 for(let i=0;i<8;i++)gestao.criarCarrinho(1,'Orçamento '+i,db);
 const {spawn}=await import('node:child_process');
 const codigo='import {createRequire} from "node:module";'+
  'const raiz='+JSON.stringify(raiz)+'; const require=createRequire(new URL("package.json",raiz));'+
  'const Database=require("better-sqlite3");const db=new Database(process.env.DB_PATH);db.pragma("busy_timeout=5000");db.pragma("foreign_keys=ON");'+
  'const {criarCarrinho}=await import(new URL("src/services/carrinhosService.js",raiz));'+
  'try{criarCarrinho(1,"Concorrente",db);process.stdout.write("ok");}catch(e){if(e.codigo!=="LIMITE_DE_CARRINHOS")throw e;process.stdout.write("limite");}finally{db.close();}';
 const rodar=(script=codigo)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',script],{env:process.env});let saida='';
 child.stdout.on('data',c=>saida+=c);child.on('error',reject);child.on('close',code=>code===0?resolve(saida):reject(new Error('processo de teste falhou')));});
 const resultados=await Promise.all([rodar(),rodar()]);assert.deepEqual(resultados.sort(),['limite','ok']);
 assert.equal(gestao.listarCarrinhos(1,db).carrinhos.length,10);
 const atuais=gestao.listarCarrinhos(1,db).carrinhos;
 for(const c of atuais.slice(2))gestao.excluirCarrinho(1,c.id,false,db);
 const codigoExcluir=id=>codigo.replace('{criarCarrinho}', '{criarCarrinho,excluirCarrinho}')
  .replace('criarCarrinho(1,"Concorrente",db)', 'excluirCarrinho(1,'+id+',false,db)');
 assert.deepEqual(await Promise.all(atuais.slice(0,2).map(c=>rodar(codigoExcluir(c.id)))),['ok','ok']);
 const final=gestao.listarCarrinhos(1,db);assert.equal(final.carrinhos.length,1);assert.equal(final.carrinhos[0].principal,true);
 assert.equal(gestao.listarCarrinhos(2,db).carrinhos.length,1);db.close();
`));

test('HTTP autentica, valida posse/campos, bloqueia contrato antigo e confirma endereço escolhido', () => executarCenario(
  inicio.replace("const db = new Database(':memory:');", "const {obterBanco,fecharBanco}=await import(new URL('src/db/index.js',raiz)); const db=obterBanco();") + `
const {criarApp}=await import(new URL('src/app.js',raiz));
const {assinarToken}=await import(new URL('src/middleware/autenticacao.js',raiz));
const {config}=await import(new URL('src/config.js',raiz));
const {once}=await import('node:events');
// HTTP usa node:http para manter globalThis.fetch reservado ao ERP fake.
const http=await import('node:http');
const servidor=criarApp().listen(0,'127.0.0.1'); await once(servidor,'listening');
const cookie=id=>config.jwt.nomeCookie+'='+assinarToken(id);
const requisitar=(metodo,caminho,corpo,id=1)=>new Promise((resolve,reject)=>{
 const textoCorpo=corpo===undefined?undefined:JSON.stringify(corpo);
 const req=http.request({hostname:'127.0.0.1',port:servidor.address().port,path:'/api'+caminho,method:metodo,
  headers:{'Content-Type':'application/json','Connection':'close',...(textoCorpo?{'Content-Length':Buffer.byteLength(textoCorpo)}:{}),...(id?{Cookie:cookie(id)}:{})}},res=>{
  let texto='';res.on('data',c=>texto+=c);res.on('end',()=>resolve({status:res.statusCode,json:JSON.parse(texto)}));
 });req.on('error',reject);req.end(textoCorpo);
});
try{
 assert.equal((await requisitar('GET','/carrinhos',undefined,null)).status,401);
 const criada=await requisitar('POST','/carrinhos',{nome:'Gol',usuario_id:2});assert.equal(criada.status,201);
 const id=criada.json.dados.id;
 assert.equal((await requisitar('GET','/carrinhos/'+id,undefined,2)).status,404);
 assert.equal((await requisitar('POST','/carrinhos',{nome:' '})).status,422);
 assert.equal((await requisitar('DELETE','/carrinhos/'+id,{confirmar_com_itens:'true'})).status,422);
 assert.equal((await requisitar('POST','/carrinho/itens',{codigo_produto:'A'})).status,409);
 assert.equal((await requisitar('POST','/pedidos',{endereco_id:1})).status,422);
 await requisitar('POST','/carrinhos/'+id+'/itens',{codigo_produto:'A',quantidade:3,preco:0});
 assert.equal((await requisitar('DELETE','/carrinhos/'+id,{})).status,409);
 for(const n of [1,2])db.prepare('INSERT INTO enderecos(id,usuario_id,apelido,cep,logradouro,numero,bairro,cidade,uf,principal,criado_em,atualizado_em) VALUES(?,1,?,?,?,?,?,?,?,?,?,?)')
 .run(n,'Endereço '+n,'00000-000','Rua '+n,'1','Centro','Teste','SP',n===1?1:0,'2026-01-01','2026-01-01');
 let posts=0;
 const lerProduto=globalThis.fetch;
 globalThis.fetch=async(url,opcoes)=>{if(opcoes.method!=='POST')return lerProduto(url,opcoes);
  posts++;assert.match(JSON.parse(opcoes.body).observacao,/Rua 2/);return Response.json({dados:{numero:'HTTP-SINTETICO',valor_total:3.45}});};
 const carrinho=(await requisitar('GET','/carrinhos/'+id)).json.dados;
 const payload={carrinho_id:id,versao_carrinho:carrinho.versao,endereco_id:2,tentativa_id:'00000000-0000-4000-8000-000000000003'};
 assert.equal((await requisitar('POST','/pedidos',payload)).status,201);
 assert.equal((await requisitar('POST','/pedidos',payload)).status,200);
 assert.equal(posts,1);assert.equal((await requisitar('GET','/carrinhos/'+id+'/checkout')).json.dados.estado,'concluido');
}finally{await new Promise(r=>servidor.close(r));fecharBanco();}
`));
