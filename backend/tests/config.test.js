import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const moduloConfig = new URL('../src/config.js', import.meta.url).href;
const ambienteValido = {
  JWT_SEGREDO: 'jwt-sintetico-exclusivo-de-teste-0123456789',
  ERP_TOKEN: 'token-sintetico-de-teste',
  ERP_URL: 'https://erp.invalid/base/',
};

function consultar(variaveis) {
  const diretorio = mkdtempSync(path.join(tmpdir(), 'kaizen-config-'));
  const script = `
    try {
      const { config, validarConfig } = await import(${JSON.stringify(moduloConfig)});
      validarConfig();
      console.log(JSON.stringify({
        ok: true,
        jwtPreservado: config.jwt.segredo === process.env.JWT_SEGREDO,
        tokenPreservado: config.erp.token === process.env.ERP_TOKEN,
        url: config.erp.url,
        nomeCookie: config.jwt.nomeCookie,
        porta: config.porta,
        timeoutMs: config.erp.timeoutMs
      }));
    } catch (erro) {
      console.log(JSON.stringify({ ok: false, mensagem: erro.message }));
      process.exitCode = 1;
    }
  `;
  try {
    const execucao = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: diretorio,
      env: { PATH: process.env.PATH, NODE_ENV: 'test', ...variaveis },
      encoding: 'utf8',
      timeout: 10000,
    });
    if (execucao.error) throw execucao.error;
    const ultimaLinha = execucao.stdout.trim().split('\n').at(-1);
    assert.ok(ultimaLinha, 'subprocesso deve devolver resultado da validação');
    return { status: execucao.status, resultado: JSON.parse(ultimaLinha) };
  } finally {
    rmSync(diretorio, { recursive: true, force: true });
  }
}

for (const chave of ['JWT_SEGREDO', 'ERP_TOKEN', 'ERP_URL']) {
  test(`${chave} ausente ou vazio impede configuração`, () => {
    for (const valor of [undefined, '', '   ']) {
      const env = { ...ambienteValido };
      if (valor === undefined) delete env[chave];
      else env[chave] = valor;
      const { status, resultado } = consultar(env);
      assert.equal(status, 1);
      assert.equal(resultado.ok, false);
      assert.ok(resultado.mensagem.includes(chave));
    }
  });
}

test('rejeita placeholders e segredo curto', () => {
  for (const [chave, valor] of [
    ['JWT_SEGREDO', 'troque-por-um-segredo-aleatorio'],
    ['JWT_SEGREDO', 'curto'],
    ['ERP_TOKEN', 'cole-aqui-o-API_TOKEN-do-kaizen-erp'],
  ]) {
    const { status, resultado } = consultar({ ...ambienteValido, [chave]: valor });
    assert.equal(status, 1);
    assert.ok(resultado.mensagem.includes(chave));
  }
});

test('rejeita URL inválida sem ecoar valor', () => {
  for (const valor of ['https://', 'file:///tmp/erp', 'credencial-sintetica-no-endereco']) {
    const { status, resultado } = consultar({ ...ambienteValido, ERP_URL: valor });
    assert.equal(status, 1);
    assert.ok(resultado.mensagem.includes('ERP_URL'));
    assert.equal(resultado.mensagem.includes(valor), false);
  }
});

test('configuração explícita preserva contrato e normaliza URL', () => {
  const { status, resultado } = consultar(ambienteValido);
  assert.equal(status, 0);
  assert.deepEqual(resultado, {
    ok: true,
    jwtPreservado: true,
    tokenPreservado: true,
    url: 'https://erp.invalid/base',
    nomeCookie: 'kaizen_sessao',
    porta: 3001,
    timeoutMs: 8000,
  });
});
