import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const raiz = new URL('../../', import.meta.url).href;
export function executarCenario(fonte) {
  const pasta = mkdtempSync(path.join(tmpdir(), 'kaizen-multi-'));
  try {
    const resultado = spawnSync(process.execPath, ['--input-type=module', '-e', fonte], {
      cwd: pasta, encoding: 'utf8', timeout: 30000,
      env: { PATH: process.env.PATH, NODE_ENV: 'test',
        JWT_SEGREDO: 'jwt-sintetico-exclusivo-de-teste-0123456789',
        ERP_TOKEN: 'token-sintetico-de-teste', ERP_URL: 'https://erp.invalid',
        DB_PATH: path.join(pasta, 'isolado.db') },
    });
    assert.ifError(resultado.error);
    assert.equal(resultado.status, 0, resultado.stderr);
  } finally { rmSync(pasta, { recursive: true, force: true }); }
}

export const preparar = `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const raiz = ${JSON.stringify(raiz)};
const require = createRequire(new URL('package.json', raiz));
const Database = require('better-sqlite3');
const { aplicarSchema } = await import(new URL('src/db/index.js', raiz));
const db = new Database(':memory:');
db.pragma('foreign_keys = ON');
globalThis.fetch = () => { throw new Error('rede proibida'); };
const usuario = id => db.prepare('INSERT INTO usuarios(id,nome,email,senha_hash,documento,criado_em,atualizado_em) VALUES(?,?,?,?,?,?,?)')
  .run(id,'Teste','teste'+id+'@example.invalid','sintetico','00000000000','2026-01-01','2026-01-01');
`;
