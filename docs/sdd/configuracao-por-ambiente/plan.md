# Plano de implementação — Configuração por ambiente

**Versão:** 1
**Estado:** Proposta
**Spec:** [spec.md](spec.md), versão 1
**Objetivo:** remover segredos/fallbacks e validar env antes de publicar aplicação.
**Arquitetura:** manter config.js como fronteira única de configuração; testar
em processos isolados, sem importar serviços/banco. Preservar bootstrap fail-fast.
**Stack:** JavaScript ESM, Node existente, dotenv existente e node:test nativo.
**Aprovação para implementar:** Pendente.
**Execução:** nesta sessão, passo a passo, sem delegação automática.

## Restrições globais

- Não editar código antes de aprovação explícita desta spec e deste plano.
- Sem nova dependência, rede ERP, banco real ou leitura do .env nos testes.
- Não publicar nem comitar a configuração original com segredos.
- Sem mudança de contrato HTTP/schema/CORS/expiração/porta/timeout.
- Manter defaults operacionais e estrutura exportada de config.
- RELATORIO.md só será editado quando houver autorização para seu conteúdo.

## Mapa de arquivos

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Alterar | backend/src/config.js | Remover PADRAO sensível e exigir valores explícitos |
| Criar | backend/tests/config.test.js | Regressão de ausência, placeholder, formato e não exposição |
| Alterar | README.md | Corrigir SIAC_URL para ERP_URL e explicar configuração obrigatória |
| Alterar | backend/.env.example | Explicar rejeição dos placeholders e proibir credencial rastreada |
| Atualizar | fix.md, docs/ambiente.md, docs/investigacao.md, docs/decisoes.md | Resultados e situação de publicação |

## Tarefa 1 — Configuração fail-fast e primeiro código seguro

**Requisitos:** REQ-01 a REQ-09; AC-01 a AC-07.
**Consome:** process.env, dotenv/config; shape atual de config e validarConfig().
**Produz:** mesmo shape; strings vazias indicam campos obrigatórios ausentes;
validarConfig() lança erro agregado sem valores sensíveis.

- [ ] Confirmar aprovação, conferir baseline e criar branch codex/configuracao-por-ambiente.
- [ ] Instalar dependências existentes: a partir de backend/, executar `npm ci`.
      Não iniciar servidor, consultar ERP nem criar .env durante os testes.
- [ ] Criar backend/tests/config.test.js com o conteúdo abaixo.

```js
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
```

- [ ] Executar `node --test tests/config.test.js` em backend/ antes da alteração.
      Esperado: casos de ausência/default e URL incompleta falham; registrar
      os resultados reais. Não comitar o código original para guardar esse RED.
- [ ] Em config.js, apagar o bloco PADRAO e os comentários que defendem subir
      sem configuração. Preservar a nota KZN-2B9C e seus imports.
      Trocar somente os valores das propriedades abaixo:

```js
segredo: process.env.JWT_SEGREDO?.trim() || '',
// dentro de config.erp:
url: (process.env.ERP_URL?.trim() || '').replace(/\/+$/, ''),
token: process.env.ERP_TOKEN?.trim() || '',
```

- [ ] Substituir o corpo de validarConfig() por:

```js
const problemas = [];
if (!config.jwt.segredo) {
  problemas.push('JWT_SEGREDO nao definido. Rode: npm run segredo:gerar');
} else if (config.jwt.segredo === 'troque-por-um-segredo-aleatorio') {
  problemas.push('JWT_SEGREDO ainda esta com o valor de exemplo.');
} else if (config.jwt.segredo.length < 32) {
  problemas.push('JWT_SEGREDO muito curto (minimo 32 caracteres).');
}
if (!config.erp.token) {
  problemas.push('ERP_TOKEN nao definido. Use o API_TOKEN do kaizen-erp.');
} else if (config.erp.token === 'cole-aqui-o-API_TOKEN-do-kaizen-erp') {
  problemas.push('ERP_TOKEN ainda esta com o valor de exemplo.');
}
if (!config.erp.url) {
  problemas.push('ERP_URL nao definida. Informe a base HTTP(S) do SIAC.');
} else {
  try {
    const url = new URL(config.erp.url);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      throw new Error('protocolo ou host invalido');
    }
  } catch {
    problemas.push('ERP_URL invalida. Informe uma URL absoluta HTTP(S).');
  }
}
if (problemas.length > 0) {
  throw new Error(`Configuracao invalida:\n  - ${problemas.join('\n  - ')}`);
}
```

- [ ] Corrigir nome SIAC_URL→ERP_URL no README e acrescentar:
      "JWT_SEGREDO, ERP_URL e ERP_TOKEN são obrigatórios no ambiente do backend.
      Os placeholders de backend/.env.example precisam ser substituídos
      localmente; não versione .env nem credenciais reais."
- [ ] Acrescentar comentário equivalente em backend/.env.example; manter
      placeholders seguros e demais campos. Não adicionar env com valores reais.
- [ ] Rodar `node --test tests/config.test.js` e `node --check src/config.js`
      em backend/. Esperado: todos os testes e sintaxe passam. Sem ERP/rede/banco.
- [ ] Revisar diff contra baseline em backup e os arquivos a versionar.
      Confirmar ausência de literais originais, artefatos, .env e dados locais.
      Não imprimir credenciais para mostrar que foram removidas.
- [ ] Atualizar FIX-001 e documentos com comandos/resultados reais. Aprovação
      de implementação não autoriza afirmar que token externo foi revogado.
- [ ] Criar commit `fix: exige configuracao explicita sem segredos no codigo`
      com código sanitizado, teste e documentação. Na importação inicial,
      revisar todos os arquivos de aplicação por allowlist, pois estarão
      inicialmente não rastreados. Não usar git add . sem essa revisão.
- [ ] Enviar branch/aplicação ao repositório do candidato apenas dentro da
      autorização vigente; verificar refs remotas e integridade do histórico.

## Migração e recuperação

Não altera schema nem dados. Manter valores reais somente no ambiente local.
Se configuração falhar, corrigir variável ausente; não reintroduzir fallback
secreto. Backup do Git original fica local e não deve ser publicado.

## Matriz de validação

| Aceite | Prova | Resultado esperado | Observado |
|---|---|---|---|
| AC-01/02 | node --test tests/config.test.js | Ausência/vazio/placeholder/curto rejeitados | Não executado |
| AC-03 | Casos de URL no mesmo teste | Rejeição sem eco do valor | Não executado |
| AC-04/05 | Caso válido e harness isolado | Contrato preservado, sem efeitos externos | Não executado |
| AC-06 | Revisão de arquivos, staged diff e histórico próprio | Segredos originais e gerados ausentes | Não executado |
| AC-07 | Diff README/exemplo/guia | ERP_URL coerente e env obrigatória | Não executado |

## Autorrevisão documental

Todos os requisitos possuem passos correspondentes. Testes usam strings
sintéticas e diretório temporário, sem herdar o ambiente completo do usuário.
Sem dependências novas, alteração do SIAC ou migração. A execução aguarda
aprovação humana; nenhum checkbox de implementação foi iniciado.
