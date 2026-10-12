import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const url = caminho => new URL('../src/' + caminho, import.meta.url).href;
for (const cenario of [
  { ambiente: 'test', configurada: 'https://loja.example', permitida: 'https://loja.example' },
  { ambiente: 'development', permitida: 'http://localhost:5173' },
  { ambiente: 'test', permitida: 'http://localhost:5173' },
  { ambiente: 'production', permitida: null },
  { ambiente: 'production', configurada: 'https://loja.example', permitida: 'https://loja.example' },
]) test('CORS HTTP: ' + cenario.ambiente + (cenario.configurada ? ' explicita' : ' padrao'), () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'kaizen-cors-'));
  const script = `
    import assert from 'node:assert/strict';
    import { once } from 'node:events';
    const cenario = ${JSON.stringify(cenario)};
    const { config, validarConfig } = await import(${JSON.stringify(url('config.js'))});
    validarConfig();
    const { obterBanco, aplicarSchema, fecharBanco } = await import(${JSON.stringify(url('db/index.js'))});
    const { assinarToken } = await import(${JSON.stringify(url('middleware/autenticacao.js'))});
    const { criarApp } = await import(${JSON.stringify(url('app.js'))});
    const db = obterBanco(); aplicarSchema(db);
    for (const id of [1, 2]) db.prepare('INSERT INTO usuarios (id,nome,email,senha_hash,documento,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?)')
      .run(id, 'Usuario teste', 'teste'+id+'@example.invalid', 'hash-sintetico', '00000000000', '2026-01-01', '2026-01-01');
    let servidor;
    try {
      servidor = criarApp().listen(0, '127.0.0.1'); await once(servidor, 'listening');
      const local = 'http://127.0.0.1:' + servidor.address().port;
      const nativo = globalThis.fetch;
      globalThis.fetch = (entrada, opcoes) => {
        assert.equal(new URL(entrada).origin, local, 'sem acesso ERP'); return nativo(entrada, opcoes);
      };
      const cookie = config.jwt.nomeCookie + '=' + assinarToken(1);
      async function request(origem, method = 'GET', sessao = false) {
        const headers = {};
        if (origem !== undefined) headers.Origin = origem;
        if (sessao) headers.Cookie = cookie;
        if (method === 'OPTIONS') {
          headers['Access-Control-Request-Method'] = 'PATCH';
          headers['Access-Control-Request-Headers'] = 'content-type';
        }
        return fetch(local + '/api/perfil', { method, headers });
      }
      function conferir(resposta, permitida, preflight) {
        for (const [nome, esperado] of [
          ['access-control-allow-origin', permitida],
          ['access-control-allow-credentials', permitida ? 'true' : null],
        ]) assert.equal(resposta.headers.get(nome), esperado);
        if (permitida) assert.ok(resposta.headers.get('vary').toLowerCase().includes('origin'));
        if (preflight && permitida) {
          assert.equal(resposta.status, 204);
          assert.ok(resposta.headers.get('access-control-allow-methods').includes('PATCH'));
          assert.ok(resposta.headers.get('access-control-allow-headers').includes('content-type'));
        } else if (preflight) {
          assert.equal(resposta.headers.get('access-control-allow-methods'), null);
          assert.equal(resposta.headers.get('access-control-allow-headers'), null);
        }
      }
      if (cenario.permitida) {
        const resposta = await request(cenario.permitida); conferir(resposta, cenario.permitida, false);
        assert.equal(resposta.status, 401, 'CORS nao autentica');
        conferir(await request(cenario.permitida, 'OPTIONS'), cenario.permitida, true);
      }
      for (const origem of ['https://outra.example', 'https://loja.example:8443',
        'https://loja.example.atacante.invalid', 'https://prefixo.loja.example', 'null', undefined,
        ...(cenario.permitida === 'http://localhost:5173' ? ['http://localhost:5174'] : ['http://localhost:5173'])]) {
        const resposta = await request(origem); conferir(resposta, null, false);
        assert.equal(resposta.status, 401);
        conferir(await request(origem, 'OPTIONS'), null, true);
      }
      for (const origem of [cenario.permitida ?? undefined, 'https://outra.example', undefined]) {
        const resposta = await request(origem, 'GET', true);
        assert.equal(resposta.status, 200, 'HTTP segue autenticacao mesmo sem CORS');
        conferir(resposta, origem && origem === cenario.permitida ? origem : null, false);
        const json = await resposta.json(); assert.equal(json.dados.id, 1);
        assert.ok(!Object.hasOwn(json.dados, 'senha_hash'));
      }
      assert.equal(db.prepare('SELECT COUNT(*) AS total FROM usuarios').get().total, 2);
    } finally {
      if (servidor?.listening) await new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
      fecharBanco();
    }
  `;
  try {
    const resultado = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd, encoding: 'utf8', timeout: 20000, env: {
        PATH: process.env.PATH, NODE_ENV: cenario.ambiente,
        JWT_SEGREDO: 'segredo-sintetico-cors-0123456789012345', ERP_URL: 'https://erp.invalid',
        ERP_TOKEN: 'token-sintetico', DB_PATH: path.join(cwd, 'cors.db'),
        ...(cenario.configurada ? { CORS_ORIGEM: cenario.configurada } : {}),
      },
    });
    if (resultado.error) throw resultado.error;
    assert.equal(resultado.status, 0, resultado.stderr);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
