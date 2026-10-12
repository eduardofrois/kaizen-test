import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const modulo = new URL('../src/config.js', import.meta.url).href;
function consultar(ambiente, origem) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'kaizen-cors-config-'));
  try {
    const resultado = spawnSync(process.execPath, ['--input-type=module', '-e', `
      try {
        const { config, validarConfig } = await import(${JSON.stringify(modulo)});
        validarConfig(); console.log(JSON.stringify({ origem: config.corsOrigem }));
      } catch (erro) { console.log(JSON.stringify({ erro: erro.message })); process.exitCode = 1; }
    `], { cwd, encoding: 'utf8', timeout: 10000, env: {
      PATH: process.env.PATH, NODE_ENV: ambiente,
      JWT_SEGREDO: 'segredo-sintetico-cors-0123456789012345',
      ERP_URL: 'https://erp.invalid', ERP_TOKEN: 'token-sintetico',
      ...(origem === undefined ? {} : { CORS_ORIGEM: origem }),
    } });
    if (resultado.error) throw resultado.error;
    assert.ok(resultado.stdout.trim(), 'config devolve resultado');
    return { status: resultado.status, ...JSON.parse(resultado.stdout.trim().split('\n').at(-1)) };
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
for (const ambiente of ['development', 'test', 'production']) {
  test('CORS defaults: ' + ambiente, () => {
    for (const valor of [undefined, '', '   ']) {
      assert.deepEqual(consultar(ambiente, valor), { status: 0,
        origem: ambiente === 'production' ? '' : 'http://localhost:5173' });
    }
  });
  test('CORS origem explicita: ' + ambiente, () => {
    for (const valor of ['https://loja.example', 'http://localhost:5173', 'https://loja.example:8443']) {
      assert.deepEqual(consultar(ambiente, ' ' + valor + ' '), { status: 0, origem: valor });
    }
  });
}
for (const valor of ['*', 'null', 'https://', 'ftp://loja.example', 'https://loja.example/',
  '/caminho', 'https://loja.example/app', 'https://loja.example?x=1',
  'https://loja.example#fragmento', 'https://usuario:senha@loja.example',
  'https://loja.example,https://outra.example', 'https://loja.example:443', 'https://LOJA.example']) {
  test('CORS rejeita origem nao canonica: ' + valor, () => {
    const resultado = consultar('test', valor);
    assert.equal(resultado.status, 1);
    assert.ok(resultado.erro.includes('CORS_ORIGEM'));
    assert.ok(!resultado.erro.includes(valor), 'erro nao ecoa entrada');
  });
}
