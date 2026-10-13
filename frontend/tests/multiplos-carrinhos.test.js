import test from 'node:test';
import assert from 'node:assert/strict';
import { criarCarrinhoPorSessao } from '../src/lib/carrinhoPorSessao.js';
function adiar(){let resolver,rejeitar;const promessa=new Promise((ok,falha)=>{resolver=ok;rejeitar=falha;});return {promessa,resolver,rejeitar};}
const dados=(id,versao=1)=>({id,nome:'Carrinho '+id,versao,itens:[],pronto_para_checkout:false});
function montar(){const chamadas=[];const api={listar:async()=>({dados:{carrinhos:[{id:1},{id:2}],principal_id:1}}),ler:async(id)=>({dados:dados(id)}),adicionar:async(...args)=>{chamadas.push(args);return {dados:dados(args[0],2)};},definirPrincipal:async()=>({dados:{}})};const c=criarCarrinhoPorSessao(api,true);c.ativar();return {c,api,chamadas};}
test('boot usa principal, escolha vira ativo, principal não troca seleção',async()=>{
 const {c,api,chamadas}=montar();await c.recarregar();assert.equal(c.obterSnapshot().ativoId,1);await c.adicionar('A',3,2);assert.equal(c.obterSnapshot().ativoId,2);assert.deepEqual(chamadas,[[2,'A',3]]);
 await c.definirPrincipal(1);assert.equal(c.obterSnapshot().ativoId,2);c.invalidar();c.ativar();await c.recarregar();assert.equal(c.obterSnapshot().ativoId,1);
 api.listar=async()=>({dados:{carrinhos:[{id:2}],principal_id:2}});await c.recarregar();assert.equal(c.obterSnapshot().ativoId,2);assert.ok(c.obterSnapshot().aviso);
});
test('A→B→A descarta primeira leitura A mesmo se versão maior',async()=>{
 const {c,api}=montar();await c.recarregar();const p=adiar();let n=0;api.ler=id=>++n===1?p.promessa:Promise.resolve({dados:dados(id)});
 const antiga=c.selecionar(1);await c.selecionar(2);await c.selecionar(1);p.resolver({dados:dados(1,9)});assert.equal(await antiga,false);assert.equal(c.obterSnapshot().carrinho.versao,1);
});
test('leitura fora de ordem na mesma seleção não regride estado',async()=>{
 const {c,api}=montar();await c.recarregar();const p=adiar();let n=0;api.ler=id=>++n===1?p.promessa:Promise.resolve({dados:dados(id,3)});
 const antiga=c.recarregar();await Promise.resolve();await c.recarregar();p.resolver({dados:dados(1,2)});assert.equal(await antiga,false);assert.equal(c.obterSnapshot().carrinho.versao,3);
});
test('destino excluído não repete adição no substituto',async()=>{
 const {c,api,chamadas}=montar();await c.recarregar();api.listar=async()=>({dados:{carrinhos:[{id:2}],principal_id:2}});assert.equal(await c.adicionar('A',1),false);assert.deepEqual(chamadas,[]);assert.equal(c.obterSnapshot().ativoId,2);
});
test('duas instâncias mantêm seleções independentes',async()=>{
 const a=montar(),b=montar();await a.c.recarregar();await b.c.recarregar();await a.c.selecionar(2);assert.equal(b.c.obterSnapshot().ativoId,1);
});

test('REV-01: erro de lista anterior não apaga o carrinho recém-selecionado', async () => {
 const {c,api}=montar();await c.recarregar();const p=adiar();api.listar=()=>p.promessa;
 const antiga=c.recarregar();await c.selecionar(2);
 p.rejeitar(new Error('Lista anterior falhou'));await antiga;
 assert.equal(c.obterSnapshot().ativoId,2);
 assert.equal(c.obterSnapshot().carrinho.id,2);
 assert.equal(c.obterSnapshot().erro,null);
});

test('REV-01: lista anterior à criação não remove o novo carrinho nem troca o ativo', async () => {
 const {c,api}=montar();await c.recarregar();const p=adiar();api.listar=()=>p.promessa;
 api.criar=async()=>({dados:{id:3,nome:'Novo'}});
 const antiga=c.recarregar();await c.criar('Novo');
 p.resolver({dados:{carrinhos:[{id:1},{id:2}],principal_id:1}});await antiga;
 assert.equal(c.obterSnapshot().ativoId,3);
 assert.ok(c.obterSnapshot().carrinhos.some(i=>i.id===3));
 assert.equal(c.obterSnapshot().aviso,null);
});

test('REV-02: mutação atrasada não sobrescreve versão mais recente já publicada', async () => {
 const {c,api}=montar();await c.recarregar();const p=adiar(),entrou=adiar();
 api.alterar=()=>{entrou.resolver();return p.promessa;};
 const mutacao=c.alterar('A',2);await entrou.promessa;
 api.ler=async id=>({dados:{...dados(id,3),itens:[{codigo_produto:'A',quantidade:7}]}});
 await c.recarregar();p.resolver({dados:{...dados(1,2),itens:[{codigo_produto:'A',quantidade:2}]}});
 assert.equal(await mutacao,true);
 assert.equal(c.obterSnapshot().carrinho.versao,3);
 assert.equal(c.obterSnapshot().carrinho.itens[0].quantidade,7);
});

test('REV-02: mutação não invalida leitura mais nova ainda em andamento', async () => {
 const {c,api}=montar();await c.recarregar();const escrita=adiar(),entrouEscrita=adiar(),leitura=adiar(),entrouLeitura=adiar();
 api.alterar=()=>{entrouEscrita.resolver();return escrita.promessa;};
 const mutacao=c.alterar('A',2);await entrouEscrita.promessa;
 api.ler=()=>{entrouLeitura.resolver();return leitura.promessa;};
 const recarga=c.recarregar();await entrouLeitura.promessa;
 escrita.resolver({dados:dados(1,2)});await mutacao;
 leitura.resolver({dados:dados(1,3)});await recarga;
 assert.equal(c.obterSnapshot().carrinho.versao,3);
 assert.equal(c.obterSnapshot().carregando,false);
});

test('REV-02: mutação rejeita resposta com ID diferente sem publicar seu conteúdo', async () => {
 const {c,api}=montar();await c.recarregar();api.alterar=async()=>({dados:dados(2,9)});
 await assert.rejects(c.alterar('A',2),/Resposta de carrinho inválida/);
 assert.equal(c.obterSnapshot().carrinho.id,1);
 assert.equal(c.obterSnapshot().carrinho.versao,1);
});

test('REV-02: resposta válida da mutação atual é publicada', async () => {
 const {c,api}=montar();await c.recarregar();api.alterar=async()=>({dados:dados(1,2)});
 assert.equal(await c.alterar('A',2),true);
 assert.equal(c.obterSnapshot().carrinho.versao,2);
});

test('REV-03: B termina antes de A e voltar a A mantém sua ocupação', async () => {
 const {c,api}=montar();await c.recarregar();const a=adiar(),b=adiar(),entrouA=adiar(),chamadas=[];
 api.adicionar=id=>{chamadas.push(id);if(id===1){entrouA.resolver();return a.promessa;}return b.promessa;};
 const primeira=c.adicionar('A');await entrouA.promessa;await c.selecionar(2);
 const segunda=c.adicionar('B');
 try {
  await new Promise(setImmediate);
  assert.deepEqual(chamadas,[1,2]);
  assert.equal(c.obterSnapshot().ocupado,true);
  b.resolver({dados:dados(2,2)});await segunda;
  assert.equal(c.obterSnapshot().ocupado,false);
  await c.selecionar(1);
  assert.equal(c.obterSnapshot().ocupado,true);
 } finally {a.resolver({dados:dados(1,2)});b.resolver({dados:dados(2,2)});await Promise.all([primeira,segunda]);}
 assert.equal(c.obterSnapshot().ocupado,false);
});

test('REV-03: finally de A não libera B que continua pendente', async () => {
 const {c,api}=montar();await c.recarregar();const a=adiar(),b=adiar(),entrouA=adiar(),chamadas=[];
 api.adicionar=id=>{chamadas.push(id);if(id===1){entrouA.resolver();return a.promessa;}return b.promessa;};
 const primeira=c.adicionar('A');await entrouA.promessa;await c.selecionar(2);const segunda=c.adicionar('B');
 try {
  await new Promise(setImmediate);assert.deepEqual(chamadas,[1,2]);
  a.resolver({dados:dados(1,2)});await primeira;
  assert.equal(c.obterSnapshot().ativoId,2);assert.equal(c.obterSnapshot().ocupado,true);
 } finally {a.resolver({dados:dados(1,2)});b.resolver({dados:dados(2,2)});await Promise.all([primeira,segunda]);}
 assert.equal(c.obterSnapshot().ocupado,false);
});

test('REV-03: voltar à origem ainda pendente não libera seus controles', async () => {
 const {c,api}=montar();await c.recarregar();const p=adiar(),entrou=adiar();
 api.adicionar=()=>{entrou.resolver();return p.promessa;};const operacao=c.adicionar('A');await entrou.promessa;
 try {await c.selecionar(2);await c.selecionar(1);assert.equal(c.obterSnapshot().ocupado,true);}
 finally {p.resolver({dados:dados(1,2)});await operacao;}
 assert.equal(c.obterSnapshot().ocupado,false);
});

test('REV-03: mesma origem serializa mutações e mantém ocupado até a última', async () => {
 const {c,api}=montar();await c.recarregar();const a=adiar(),b=adiar(),entrouA=adiar(),entrouB=adiar(),chamadas=[];
 api.adicionar=(id,codigo)=>{chamadas.push([id,codigo]);if(codigo==='A'){entrouA.resolver();return a.promessa;}entrouB.resolver();return b.promessa;};
 const primeira=c.adicionar('A');await entrouA.promessa;const segunda=c.adicionar('B');
 try {
  await new Promise(setImmediate);assert.deepEqual(chamadas,[[1,'A']]);assert.equal(c.obterSnapshot().ocupado,true);
  a.resolver({dados:dados(1,2)});await entrouB.promessa;
  assert.equal(c.obterSnapshot().ocupado,true);assert.deepEqual(chamadas,[[1,'A'],[1,'B']]);
 } finally {a.resolver({dados:dados(1,2)});b.resolver({dados:dados(1,3)});await Promise.all([primeira,segunda]);}
 assert.equal(c.obterSnapshot().ocupado,false);
});

test('REV-03: troca cancela mutação enfileirada sem mudar seu destino', async () => {
 const {c,api}=montar();await c.recarregar();const p=adiar(),entrou=adiar(),chamadas=[];
 api.adicionar=(id,codigo)=>{chamadas.push([id,codigo]);entrou.resolver();return p.promessa;};
 const primeira=c.adicionar('A');await entrou.promessa;const segunda=c.adicionar('B');await c.selecionar(2);
 p.resolver({dados:dados(1,2)});assert.deepEqual(await Promise.all([primeira,segunda]),[false,false]);
 assert.deepEqual(chamadas,[[1,'A']]);assert.equal(c.obterSnapshot().ativoId,2);assert.equal(c.obterSnapshot().ocupado,false);
});

test('REV-03: logout descarta fila e finally antigo não altera ocupação da nova sessão', async () => {
 const {c,api}=montar();await c.recarregar();const antiga=adiar(),nova=adiar(),entrouAntiga=adiar(),entrouNova=adiar();let n=0;
 api.adicionar=()=>{if(++n===1){entrouAntiga.resolver();return antiga.promessa;}entrouNova.resolver();return nova.promessa;};
 const primeira=c.adicionar('A');await entrouAntiga.promessa;const cancelada=c.adicionar('B');
 c.invalidar();c.ativar();await c.recarregar();const atual=c.adicionar('C');await entrouNova.promessa;
 const antes=c.obterSnapshot();antiga.resolver({dados:dados(1,9)});
 assert.equal(await primeira,false);assert.equal(await cancelada,false);
 assert.equal(c.obterSnapshot(),antes);assert.equal(c.obterSnapshot().ocupado,true);
 nova.resolver({dados:dados(1,2)});assert.equal(await atual,true);assert.equal(n,2);assert.equal(c.obterSnapshot().ocupado,false);
});

test('REV-03: gestão continua ocupada até terminar a recarga e não se confunde com itens', async () => {
 const {c,api}=montar();await c.recarregar();const p=adiar(),entrou=adiar();
 api.listar=()=>{entrou.resolver();return p.promessa;};const operacao=c.definirPrincipal(1);await entrou.promessa;
 try {assert.equal(c.obterSnapshot().gerindo,true);assert.equal(c.obterSnapshot().ocupado,true);}
 finally {p.resolver({dados:{carrinhos:[{id:1},{id:2}],principal_id:1}});await operacao;}
 assert.equal(c.obterSnapshot().gerindo,false);assert.equal(c.obterSnapshot().ocupado,false);
});
