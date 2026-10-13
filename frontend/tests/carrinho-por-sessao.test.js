import test from 'node:test';
import assert from 'node:assert/strict';
import { criarCarrinhoPorSessao } from '../src/lib/carrinhoPorSessao.js';
function adiar() { let resolver,rejeitar; const promessa=new Promise((ok,falha)=>{resolver=ok;rejeitar=falha;});return {promessa,resolver,rejeitar}; }
const dados = (id=1,versao=1) => ({id,nome:'Teste',versao,itens:[{codigo_produto:'A',quantidade:1}],quantidade_pecas:1,quantidade_itens:1,valor_total:20,pronto_para_checkout:true});
function simular() {
 const chamadas=[];const api={listar:async()=>({dados:{carrinhos:[{id:1},{id:2}],principal_id:1}}),ler:async(id)=>({dados:dados(id)})};
 for(const nome of ['adicionar','alterar','remover','limpar'])api[nome]=async(...args)=>{chamadas.push([nome,...args]);return {dados:dados(args[0],2)};};return {api,chamadas};
}
async function montar(api){const c=criarCarrinhoPorSessao(api,true);c.ativar();await c.recarregar();return c;}
for(const metodo of ['recarregar','adicionar','alterar','remover','limpar'])for(const falhar of [false,true]) {
 test(`sessão descarta resultado tardio: ${metodo}/${falhar}`,async()=>{
  const {api}=simular(),c=await montar(api),p=adiar();let iniciou;const iniciouP=new Promise(r=>iniciou=r);
  api[metodo==='recarregar'?'ler':metodo]=()=>{iniciou();return p.promessa;};
  const op=c[metodo]('A',1);await iniciouP;c.invalidar();c.ativar();const antes=c.obterSnapshot();
  if(falhar)p.rejeitar(new Error('antigo'));else p.resolver({dados:dados(1,3)});
  assert.equal(await op,false);assert.equal(c.obterSnapshot(),antes);c.invalidar();assert.equal(await c[metodo]('A',1),false);
 });
}
test('visitante/inativo não chama API e setter não é exposto',async()=>{
 let chamadas=0;const api=new Proxy({}, {get:()=>()=>{chamadas++;throw new Error('proibido');}});
 for(const autenticado of [false,true]){const c=criarCarrinhoPorSessao(api,autenticado);if(!autenticado)c.ativar();
  for(const nome of ['recarregar','adicionar','alterar','remover','limpar','criar'])assert.equal(await c[nome]('A',1),false);assert.equal(c.setCarrinho,undefined);
 }assert.equal(chamadas,0);
});
for(const status of [401,0,500])test(`erro atual ${status} bloqueia e retry recupera`,async()=>{
 const {api}=simular(),c=await montar(api),erro=Object.assign(new Error('simulado'),{status});const original=api.ler;
 api.ler=async()=>{throw erro;};await c.recarregar();assert.equal(c.obterSnapshot().erro,erro);assert.equal(c.obterSnapshot().carrinho.pronto_para_checkout,false);
 api.ler=original;await c.recarregar();assert.equal(c.obterSnapshot().erro,null);assert.equal(c.obterSnapshot().carregando,false);
});
for(const [metodo,args] of [['adicionar',['A',2]],['alterar',['A',3]],['remover',['A']],['limpar',[]]]) {
 test(`mutação mantém destino e argumentos: ${metodo}`,async()=>{const {api,chamadas}=simular(),c=await montar(api);assert.equal(await c[metodo](...args),true);assert.deepEqual(chamadas,[[metodo,1,...args]]);assert.equal(c.obterSnapshot().carrinho.versao,2);});
 test(`mutação propaga erro atual: ${metodo}`,async()=>{const {api}=simular(),c=await montar(api);const erro=Object.assign(new Error('erro'),{status:500});api[metodo]=async()=>{throw erro;};await assert.rejects(c[metodo](...args),e=>e===erro);assert.equal(c.obterSnapshot().ocupado,false);});
}
test('snapshot estável, unsubscribe e cleanup/setup StrictMode',async()=>{
 const {api}=simular(),c=await montar(api);let eventos=0;const sair=c.assinar(()=>eventos++);const p=adiar();let iniciou;const iniciado=new Promise(r=>iniciou=r);api.ler=()=>{iniciou();return p.promessa;};
 const antiga=c.recarregar();await iniciado;c.invalidar();c.ativar();const antes=c.obterSnapshot();sair();const n=eventos;
 p.resolver({dados:dados(1)});assert.equal(await antiga,false);assert.equal(c.obterSnapshot(),antes);assert.equal(eventos,n);assert.equal(c.obterSnapshot(),c.obterSnapshot());
});
test('X→visitante→X não reaproveita ciclo e 401 de mutação limpa dados',async()=>{
 const {api}=simular(),c=await montar(api);const erro=Object.assign(new Error('sessão'),{status:401});api.limpar=async()=>{throw erro;};
 await assert.rejects(c.limpar(),e=>e===erro);assert.equal(c.obterSnapshot().carrinho.itens.length,0);c.invalidar();assert.equal(c.obterSnapshot().erro,null);c.ativar();assert.equal(c.obterSnapshot().carrinho.itens.length,0);
});
