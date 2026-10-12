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

function simular(ler = async () => ({ dados: dados('A') })) {
  const chamadas = [];
  const api = { ler };
  for (const nome of ['adicionar', 'alterar', 'remover', 'limpar']) {
    api[nome] = async (...args) => { chamadas.push([nome, ...args]); return { dados: dados('A') }; };
  }
  return { api, chamadas };
}

test('visitante e ciclo inativo nao fazem requisicoes', async () => {
  let chamadas = 0;
  const api = Object.fromEntries(['ler', 'adicionar', 'alterar', 'remover', 'limpar']
    .map(nome => [nome, () => { chamadas++; throw new Error('nao deve chamar'); }]));
  for (const autenticado of [false, true]) {
    const controle = criarCarrinhoPorSessao(api, autenticado);
    if (!autenticado) controle.ativar();
    for (const nome of ['recarregar', 'adicionar', 'alterar', 'remover', 'limpar']) {
      assert.equal(await controle[nome]('A', 1), false);
    }
  }
  assert.equal(chamadas, 0);
});

test('leitura publica carga e snapshot estavel; unsubscribe funciona', async () => {
  const pendente = adiar();
  const controle = criarCarrinhoPorSessao({ ler: () => pendente.promessa }, true);
  controle.ativar();
  let eventos = 0;
  const sair = controle.assinar(() => eventos++);
  const operacao = controle.recarregar();
  assert.equal(controle.obterSnapshot().carregando, true);
  pendente.resolver({ dados: dados('A') });
  assert.equal(await operacao, true);
  assert.deepEqual(controle.obterSnapshot().carrinho, dados('A'));
  assert.equal(controle.obterSnapshot().erro, null);
  assert.equal(controle.obterSnapshot().carregando, false);
  assert.equal(controle.obterSnapshot(), controle.obterSnapshot());
  assert.ok(eventos > 0);
  sair(); const antes = eventos;
  controle.setCarrinho(dados('B'));
  assert.equal(eventos, antes);
});

for (const falhar of [false, true]) {
  test('cleanup/setup descarta geracao anterior: ' + falhar, async () => {
    const primeira = adiar(), segunda = adiar();
    let chamadas = 0;
    const controle = criarCarrinhoPorSessao({ ler: () => ++chamadas === 1 ? primeira.promessa : segunda.promessa }, true);
    controle.ativar(); const antiga = controle.recarregar();
    controle.invalidar(); controle.ativar(); const nova = controle.recarregar();
    const durante = controle.obterSnapshot();
    if (falhar) primeira.rejeitar(new Error('antiga')); else primeira.resolver({ dados: dados('A') });
    assert.equal(await antiga, false);
    assert.equal(controle.obterSnapshot(), durante);
    assert.equal(controle.obterSnapshot().carregando, true);
    segunda.resolver({ dados: dados('B') });
    await nova;
    assert.deepEqual(controle.obterSnapshot().carrinho, dados('B'));
  });
}

test('X visitante X usa novo ciclo vazio e ignora primeiro X', async () => {
  const pendente = adiar();
  const primeiro = criarCarrinhoPorSessao({ ler: () => pendente.promessa }, true);
  primeiro.ativar(); const operacao = primeiro.recarregar(); primeiro.invalidar();
  const visitante = criarCarrinhoPorSessao({}, false); visitante.ativar(); visitante.invalidar();
  const ultimo = criarCarrinhoPorSessao({}, true); ultimo.ativar();
  const antes = ultimo.obterSnapshot();
  assert.equal(antes.carrinho.itens.length, 0);
  pendente.resolver({ dados: dados('X') });
  assert.equal(await operacao, false);
  assert.equal(ultimo.obterSnapshot(), antes);
});

for (const status of [401, 0, 500]) {
  test('erro atual ' + status + ' bloqueia checkout e retry restaura', async () => {
    const erro = Object.assign(new Error('simulado'), { status });
    let falhar = true;
    const controle = criarCarrinhoPorSessao({ ler: async () => {
      if (falhar) throw erro; return { dados: dados('A') };
    } }, true);
    controle.ativar(); controle.setCarrinho(dados('VELHO'));
    assert.equal(await controle.recarregar(), true);
    assert.equal(controle.obterSnapshot().erro, erro);
    assert.equal(controle.obterSnapshot().carrinho.itens.length, 0);
    assert.equal(controle.obterSnapshot().carrinho.pronto_para_checkout, false);
    assert.equal(controle.obterSnapshot().carregando, false);
    falhar = false; await controle.recarregar();
    assert.equal(controle.obterSnapshot().erro, null);
    assert.deepEqual(controle.obterSnapshot().carrinho, dados('A'));
  });
}

for (const [nome, args] of [['adicionar', ['A', 2]], ['alterar', ['A', 3]], ['remover', ['A']], ['limpar', []]]) {
  test('mutacao atual publica e preserva argumentos: ' + nome, async () => {
    const { api, chamadas } = simular();
    const controle = criarCarrinhoPorSessao(api, true); controle.ativar();
    assert.equal(await controle[nome](...args), true);
    assert.deepEqual(chamadas, [[nome, ...args]]);
    assert.deepEqual(controle.obterSnapshot().carrinho, dados('A'));
  });
  test('mutacao atual propaga erro: ' + nome, async () => {
    const erro = Object.assign(new Error('falha'), { status: 500 });
    const controle = criarCarrinhoPorSessao({ [nome]: async () => { throw erro; } }, true);
    controle.ativar();
    await assert.rejects(controle[nome](...args), e => e === erro);
  });
}

test('setter funcional, erro 401 de mutacao e invalidacao', async () => {
  const erro = Object.assign(new Error('sessao'), { status: 401 });
  const controle = criarCarrinhoPorSessao({ limpar: async () => { throw erro; } }, true);
  controle.ativar(); controle.setCarrinho(dados('A'));
  controle.setCarrinho(anterior => ({ ...anterior, quantidade_pecas: 2 }));
  assert.equal(controle.obterSnapshot().carrinho.quantidade_pecas, 2);
  await assert.rejects(controle.limpar(), e => e === erro);
  assert.equal(controle.obterSnapshot().erro, erro);
  assert.equal(controle.obterSnapshot().carrinho.pronto_para_checkout, false);
  controle.invalidar();
  assert.equal(controle.obterSnapshot().erro, null);
  assert.equal(controle.obterSnapshot().carregando, false);
  assert.equal(controle.setCarrinho(dados('B')), false);
  assert.equal(controle.obterSnapshot().carrinho.itens.length, 0);
});
