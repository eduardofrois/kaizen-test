import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const url = caminho => new URL('../src/' + caminho, import.meta.url).href;
function verificar(cenario) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'kaizen-senha-'));
  const script = `
    import assert from 'node:assert/strict';
    import { once } from 'node:events';
    const cenario = ${JSON.stringify(cenario)};
    const validacao = await import(${JSON.stringify(url('lib/validacao.js'))});
    const { gerarHash, conferirSenha } = await import(${JSON.stringify(url('lib/senha.js'))});
    if (cenario === 'validador') {
      assert.equal(typeof validacao.senhaDeAutenticacao, 'function', 'export de autenticacao existe');
      for (const campo of ['senha', 'senha_atual']) {
        for (const valor of [' senha123 ', 'senha123', 'sen ha123', 'x', '1', 'a'.repeat(200)]) {
          const erros = new validacao.ColetorDeErros();
          assert.ok(validacao.senhaDeAutenticacao(valor, campo, erros) === valor, 'entrada preservada');
          assert.equal(erros.itens.length, 0);
        }
        for (const valor of [undefined, null, 42, {}, [], '', '   ', '\\t\\n', 'a'.repeat(201), ' '+'a'.repeat(199)+' ']) {
          const erros = new validacao.ColetorDeErros();
          assert.equal(validacao.senhaDeAutenticacao(valor, campo, erros), null);
          assert.ok(erros.itens.some(erro => erro.campo === campo));
        }
      }
    } else if (cenario === 'controles') {
      let erros = new validacao.ColetorDeErros();
      assert.equal(validacao.textoObrigatorio(' Nome ', 'nome', erros), 'Nome');
      assert.ok(validacao.senha(' senha123 ', 'senha', erros) === ' senha123 ');
      for (const valor of ['abc', '12345678', 'abcdefgh']) {
        erros = new validacao.ColetorDeErros();
        assert.equal(validacao.senha(valor, 'senha', erros), null);
        assert.ok(erros.temErros);
      }
      const hash = await gerarHash('senhaＡ123');
      assert.ok(await conferirSenha('senhaA123', hash), 'NFKC preservado');
    } else {
      const { obterBanco, aplicarSchema, fecharBanco } = await import(${JSON.stringify(url('db/index.js'))});
      const { cadastrarUsuario } = await import(${JSON.stringify(url('services/usuarioService.js'))});
      const { assinarToken } = await import(${JSON.stringify(url('middleware/autenticacao.js'))});
      const { config } = await import(${JSON.stringify(url('config.js'))});
      const { criarApp } = await import(${JSON.stringify(url('app.js'))});
      const db = obterBanco();
      aplicarSchema(db);
      let servidor;
      try {
        servidor = criarApp().listen(0, '127.0.0.1');
        await once(servidor, 'listening');
        const origem = 'http://127.0.0.1:' + servidor.address().port;
        const fetchLocal = globalThis.fetch;
        globalThis.fetch = (entrada, opcoes) => {
          assert.equal(new URL(entrada).origin, origem, 'rede restrita ao teste local');
          return fetchLocal(entrada, opcoes);
        };
        async function request(method, rota, corpo, cookie) {
          const headers = { 'Content-Type': 'application/json' };
          if (cookie) headers.Cookie = cookie;
          const resposta = await fetch(origem + '/api' + rota, { method, headers,
            ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }) });
          const json = await resposta.json();
          assert.ok(!JSON.stringify(json).includes('senha_hash'), 'resposta sem hash');
          assert.ok(!Object.hasOwn(json, 'token'), 'resposta sem token');
          return { status: resposta.status, json,
            cookie: resposta.headers.get('set-cookie')?.split(';')[0] };
        }
        const dados = { nome: 'Usuario teste', email: 'teste@example.invalid', documento: '00000000000' };
        const login = senha => request('POST', '/auth/login', { email: dados.email, senha });
        if (cenario === 'cadastro') {
          const criado = await request('POST', '/auth/cadastro', { ...dados, senha: ' senha123 ' });
          assert.equal(criado.status, 201);
          assert.ok(criado.cookie, 'cookie presente');
          assert.equal((await request('POST', '/auth/logout', {})).status, 200);
          const entrou = await login(' senha123 ');
          assert.equal(entrou.status, 200, 'original com bordas autentica');
          assert.ok(entrou.cookie);
          const eu = await request('GET', '/auth/eu', undefined, entrou.cookie);
          assert.equal(eu.status, 200);
          assert.equal(eu.json.dados.id, criado.json.dados.id);
          const semEspacos = await login('senha123');
          assert.equal(semEspacos.status, 401, 'trim nao autentica');
          const errada = await login('senhaErrada9');
          const inexistente = await request('POST', '/auth/login', { email: 'naoexiste@example.invalid', senha: 'senhaErrada9' });
          assert.equal(errada.status, 401);
          assert.equal(inexistente.status, 401);
          assert.equal(errada.json.erro.codigo, 'CREDENCIAIS_INVALIDAS');
          assert.equal(errada.json.erro.mensagem, inexistente.json.erro.mensagem);
          assert.equal(errada.json.erro.codigo, inexistente.json.erro.codigo);
        } else {
          const original = cenario === 'troca' ? ' senha123 ' : cenario === 'internos' ? 'sen ha123' : 'senha123';
          const usuario = await cadastrarUsuario({ ...dados, senha: original, telefone: null }, db);
          const outro = await cadastrarUsuario({ ...dados, email: 'outro@example.invalid', senha: 'outraSenha123', telefone: null }, db);
          const cookie = config.jwt.nomeCookie + '=' + assinarToken(usuario.id);
          const ler = id => db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
          const outroAntes = ler(outro.id);
          const hashAntes = ler(usuario.id).senha_hash;
          if (cenario === 'validacao') {
            for (const valor of [undefined, null, 42, '', '   ', 'a'.repeat(201), ' '+'a'.repeat(199)+' ']) {
              for (const [rota, corpo, campo, sessao] of [
                ['/auth/login', { email: dados.email, senha: valor }, 'senha', undefined],
                ['/perfil/senha', { senha_atual: valor, nova_senha: 'novaSenha123' }, 'senha_atual', cookie],
              ]) {
                const resposta = await request(rota === '/auth/login' ? 'POST' : 'PATCH', rota, corpo, sessao);
                assert.equal(resposta.status, 422);
                assert.ok(resposta.json.erro.detalhes.some(erro => erro.campo === campo));
              }
            }
            assert.equal((await login('a'.repeat(200))).status, 401);
            for (const nova of ['abc', '12345678', 'abcdefgh']) {
              const resposta = await request('PATCH', '/perfil/senha', { senha_atual: original, nova_senha: nova }, cookie);
              assert.equal(resposta.status, 422);
              assert.ok(resposta.json.erro.detalhes.some(erro => erro.campo === 'nova_senha'));
              const cadastro = await request('POST', '/auth/cadastro', { ...dados, email: 'novo@example.invalid', senha: nova });
              assert.equal(cadastro.status, 422);
              assert.ok(cadastro.json.erro.detalhes.some(erro => erro.campo === 'senha'));
            }
            const antes = ler(usuario.id);
            const incorreta = await request('PATCH', '/perfil/senha', { senha_atual: 'incorreta123', nova_senha: 'novaSenha123' }, cookie);
            assert.equal(incorreta.status, 422);
            assert.ok(incorreta.json.erro.detalhes.some(erro => erro.campo === 'senha_atual'));
            assert.equal((await request('PATCH', '/perfil/senha', { senha_atual: original, nova_senha: 'novaSenha123' })).status, 401);
            assert.ok(ler(usuario.id).senha_hash === hashAntes, 'falhas preservam hash');
            assert.ok(ler(usuario.id).atualizado_em === antes.atualizado_em, 'falhas preservam timestamp');
          } else {
            if (cenario !== 'troca') assert.equal((await login(original)).status, 200);
            if (cenario === 'internos') assert.equal((await login('senha123')).status, 401);
            const nova = cenario === 'troca' ? ' novaSenha456 ' : cenario === 'internos' ? 'nova Senha456' : 'novaSenha456';
            assert.equal((await request('PATCH', '/perfil/senha', { senha_atual: original, nova_senha: nova }, cookie)).status, 200, 'troca aceita original');
            assert.ok(ler(usuario.id).senha_hash !== hashAntes, 'troca substitui hash');
            assert.equal((await login(nova)).status, 200);
            assert.equal((await login(original)).status, 401);
            if (cenario === 'troca') assert.equal((await login(nova.trim())).status, 401);
          }
          const outroDepois = ler(outro.id);
          assert.ok(outroDepois.senha_hash === outroAntes.senha_hash, 'hash alheio preservado');
          const { senha_hash: _antes, ...publicoAntes } = outroAntes;
          const { senha_hash: _depois, ...publicoDepois } = outroDepois;
          assert.deepEqual(publicoDepois, publicoAntes);
        }
      } finally {
        if (servidor?.listening) await new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
        fecharBanco();
      }
    }
  `;
  try {
    const resultado = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd, encoding: 'utf8', timeout: 20000,
      env: { PATH: process.env.PATH, NODE_ENV: 'test', JWT_SEGREDO: 'segredo-sintetico-de-teste-0123456789',
        ERP_URL: 'https://erp.invalid', ERP_TOKEN: 'token-sintetico', DB_PATH: path.join(cwd, 'senha.db') },
    });
    if (resultado.error) throw resultado.error;
    assert.equal(resultado.status, 0, resultado.stderr);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
for (const cenario of ['validador', 'controles', 'cadastro', 'troca', 'sem-espacos', 'internos', 'validacao']) {
  test('FIX-008: ' + cenario, () => verificar(cenario));
}
