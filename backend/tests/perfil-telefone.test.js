import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const servico = new URL('../src/services/usuarioService.js', import.meta.url).href;
const banco = new URL('../src/db/index.js', import.meta.url).href;
const app = new URL('../src/app.js', import.meta.url).href;
const auth = new URL('../src/middleware/autenticacao.js', import.meta.url).href;
const config = new URL('../src/config.js', import.meta.url).href;
const schema = new URL('../src/db/schema.sql', import.meta.url).href;

function verificar(cenario) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'kaizen-perfil-'));
  const script = `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { readFileSync } from 'node:fs';
    import { once } from 'node:events';
    const cenario = JSON.parse(process.env.CENARIO_JSON);
    const require = createRequire(${JSON.stringify(servico)});
    const Database = require('better-sqlite3');
    const { atualizarPerfil, serializarUsuario } = await import(${JSON.stringify(servico)});
    const { obterBanco, fecharBanco } = await import(${JSON.stringify(banco)});
    const db = cenario.http ? obterBanco() : new Database(':memory:');
    let servidor;
    try {
      db.exec(readFileSync(new URL(${JSON.stringify(schema)}), 'utf8'));
      for (const id of [1, 2]) {
        db.prepare('INSERT INTO usuarios (id,nome,email,senha_hash,documento,telefone,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?)')
          .run(id, 'Usuario teste', 'teste'+id+'@example.invalid', 'hash-sintetico', '00000000000',
            id === 1 && cenario.semTelefone ? null : '11999999999', '2026-01-01', '2026-01-01');
      }
      const linhas = () => db.prepare('SELECT * FROM usuarios ORDER BY id').all();
      const antes = linhas();
      if (!cenario.http) {
        globalThis.fetch = () => { throw new Error('rede proibida'); };
        const dados = cenario.undefinedExplicito ? { telefone: undefined } : cenario.dados;
        if (cenario.inexistente) {
          assert.throws(() => atualizarPerfil(99, dados, db), erro => erro.status === 404);
          assert.deepEqual(linhas(), antes);
        } else {
          const resultado = atualizarPerfil(1, dados, db);
          assert.equal(resultado.telefone, cenario.esperado);
          assert.equal(linhas()[0].telefone, cenario.esperado);
          for (const campo of ['nome', 'documento', 'email']) assert.equal(resultado[campo], antes[0][campo]);
          assert.deepEqual(linhas()[1], antes[1]);
          assert.equal(Object.hasOwn(serializarUsuario(resultado), 'senha_hash'), false);
        }
      } else {
        const { criarApp } = await import(${JSON.stringify(app)});
        const { assinarToken } = await import(${JSON.stringify(auth)});
        const { config } = await import(${JSON.stringify(config)});
        servidor = criarApp().listen(0, '127.0.0.1');
        await once(servidor, 'listening');
        const origem = 'http://127.0.0.1:' + servidor.address().port;
        const fetchLocal = globalThis.fetch;
        globalThis.fetch = (entrada, opcoes) => {
          assert.equal(new URL(entrada).origin, origem, 'somente servidor local sintetico');
          return fetchLocal(entrada, opcoes);
        };
        const cookie = config.jwt.nomeCookie + '=' + (cenario.sessao === 'invalida' ? 'invalido' : assinarToken(1));
        const headers = { 'Content-Type': 'application/json' };
        if (cenario.sessao !== 'ausente') headers.Cookie = cookie;
        const resposta = await fetch(origem + '/api/perfil', {
          method: 'PATCH', headers, body: JSON.stringify(cenario.corpo),
        });
        assert.equal(resposta.status, cenario.status);
        const json = await resposta.json();
        if (cenario.status === 200) {
          assert.equal(json.dados.telefone, cenario.esperado);
          assert.equal(Object.hasOwn(json.dados, 'senha_hash'), false);
          const releitura = await fetch(origem + '/api/perfil', { headers: { Cookie: cookie } });
          assert.equal(releitura.status, 200);
          const lido = await releitura.json();
          assert.equal(lido.dados.telefone, cenario.esperado);
          assert.equal(Object.hasOwn(lido.dados, 'senha_hash'), false);
          assert.equal(linhas()[0].telefone, cenario.esperado);
          assert.deepEqual(linhas()[1], antes[1]);
          for (const campo of ['nome', 'documento', 'email']) assert.equal(linhas()[0][campo], antes[0][campo]);
        } else {
          if (cenario.campo) assert.ok(json.erro.detalhes.some(detalhe => detalhe.campo === cenario.campo));
          assert.deepEqual(linhas(), antes, 'erro nao persiste alteracao parcial');
        }
      }
    } finally {
      if (servidor?.listening) await new Promise((resolve, reject) => servidor.close(erro => erro ? reject(erro) : resolve()));
      if (cenario.http) fecharBanco(); else db.close();
    }
  `;
  try {
    const resultado = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd, encoding: 'utf8', timeout: 15000,
      env: { PATH: process.env.PATH, NODE_ENV: 'test',
        JWT_SEGREDO: 'segredo-sintetico-de-teste-0123456789', ERP_URL: 'https://erp.invalid',
        ERP_TOKEN: 'token-sintetico', DB_PATH: path.join(cwd, 'perfil.db'), CENARIO_JSON: JSON.stringify(cenario) },
    });
    if (resultado.error) throw resultado.error;
    assert.equal(resultado.status, 0, resultado.stderr);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}

for (const [nome, cenario] of [
  ['omitido', { dados: {}, esperado: '11999999999' }],
  ['undefined', { undefinedExplicito: true, esperado: '11999999999' }],
  ['null remove', { dados: { telefone: null }, esperado: null }],
  ['substitui', { dados: { telefone: '21988888888' }, esperado: '21988888888' }],
  ['sem telefone omite', { dados: {}, semTelefone: true, esperado: null }],
  ['sem telefone limpa', { dados: { telefone: null }, semTelefone: true, esperado: null }],
  ['inexistente', { dados: {}, inexistente: true }],
]) test('FIX-007 servico: ' + nome, () => verificar(cenario));

const base = { nome: 'Usuario teste', documento: '00000000000' };
for (const [nome, opcoes] of [
  ['omitido', { corpo: base, esperado: '11999999999' }],
  ['vazio', { corpo: { ...base, telefone: '' }, esperado: null }],
  ['espacos', { corpo: { ...base, telefone: '   ' }, esperado: null }],
  ['null', { corpo: { ...base, telefone: null }, esperado: null }],
  ['valido', { corpo: { ...base, telefone: '21988888888' }, esperado: '21988888888' }],
  ['sem telefone omite', { corpo: base, semTelefone: true, esperado: null }],
  ['sem telefone limpa', { corpo: { ...base, telefone: '' }, semTelefone: true, esperado: null }],
  ['curto sem atualizacao parcial', { corpo: { ...base, nome: 'Outro nome', telefone: '123' }, status: 422, campo: 'telefone' }],
  ['longo', { corpo: { ...base, telefone: '1'.repeat(21) }, status: 422, campo: 'telefone' }],
  ['nome obrigatorio', { corpo: { documento: base.documento, telefone: null }, status: 422, campo: 'nome' }],
  ['documento obrigatorio', { corpo: { nome: base.nome, telefone: null }, status: 422, campo: 'documento' }],
  ['proprietario autenticado', { corpo: { ...base, usuario_id: 2, telefone: null }, esperado: null }],
  ['sem sessao', { corpo: { ...base, telefone: null }, sessao: 'ausente', status: 401 }],
  ['sessao invalida', { corpo: { ...base, telefone: null }, sessao: 'invalida', status: 401 }],
]) test('FIX-007 HTTP: ' + nome, () => verificar({ http: true, status: 200, ...opcoes }));
