# Plano de implementação — Busca e paginação

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Spec:** [spec.md](spec.md), versão 1
**Baseline/data:** 27217ff; 2026-10-11
**Objetivo:** reiniciar página ao pesquisar/filtrar e conservar navegação explícita.
**Arquitetura:** função pura compartilhada pelos handlers; React Router mantém URL.
**Stack:** JavaScript ESM, URLSearchParams, node:test, React/Vite existentes.
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11; usuário: “entao aprovo os docs”.
**Execução:** nesta sessão após aprovação, sem delegação automática.


**Validação manual atual — 2026-10-12:** concluída pelo usuário. Referência:
“Agora eu preciso que voce revise os arquivos e mude aonde fala que eu nao fiz
a validação manual, pois eu fiz.” A confirmação complementa as evidências
anteriores; não acrescenta execução pela IA, capturas por variante, exploração
de segurança ou pedido real no SIAC. Requisitos e aprovações de implementação
permanecem os já registrados. Esta revisão documental não autoriza publicação.

> Leitura atualizada em 2026-10-13, referência main 76eca4d. O problema e
> os exemplos de execução abaixo descrevem a baseline e o escopo original
> da unidade. Relatos datados preservam o estado conhecido naquela etapa.
> Contratos evoluídos e pendências atuais: [índice SDD](../README.md).

## Restrições globais

REQ-01 a REQ-07 da spec. Sem dependência, lockfile, backend, banco, env ou SIAC
alterados. FIX-004/INV-005 separados. Preservar nota KZN-5D1E, visual e checks.

## Mapa de arquivos

| Ação | Caminho | Responsabilidade |
|---|---|---|
| Criar | frontend/src/lib/parametrosCatalogo.js | Transição de filtros/página |
| Criar | frontend/tests/parametros-catalogo.test.js | Regressões da função real |
| Alterar | frontend/src/componentes/Cabecalho.jsx | Pesquisa utiliza regra comum |
| Alterar | frontend/src/paginas/Catalogo.jsx | Filtros/paginação usam mesma regra |
| Alterar | frontend/package.json | Script test nativo, sem dependências |
| Alterar | .github/workflows/validacao.yml | npm test antes do build frontend |
| Atualizar | docs/ambiente.md | Comando dos testes frontend e alcance da CI |
| Atualizar | fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Estado e provas |
| Atualizar | docs/sdd/busca-e-paginacao/spec.md e plan.md | Aprovação e aceite |

## Tarefa 1 — Regra e regressões

**Cobertura:** AC-01 a AC-03; REQ-01 a REQ-04 e REQ-07.
**Interface:** atualizarParametroCatalogo(parametros, chave, valor) → URLSearchParams.

- [x] Registrar aprovação explícita e marcar Em implementação; conferir Git.
- [x] Criar módulo inicialmente com o comportamento atual, sem reset:

```js
export function atualizarParametroCatalogo(parametros, chave, valor) {
  const proximos = new URLSearchParams(parametros);
  if (valor === null || valor === '' || valor === false) proximos.delete(chave);
  else proximos.set(chave, String(valor));
  return proximos;
}
```

- [x] Criar frontend/tests/parametros-catalogo.test.js:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { atualizarParametroCatalogo } from '../src/lib/parametrosCatalogo.js';

for (const [nome, chave, valor] of [
  ['nova busca', 'busca', 'amortecedor'],
  ['busca repetida', 'busca', 'pastilha'],
  ['busca vazia', 'busca', ''],
  ['categoria', 'categoria', 'MOTOR'],
  ['Todas', 'categoria', ''],
  ['estoque ligado', 'somente_disponiveis', true],
  ['estoque desligado', 'somente_disponiveis', false],
  ['remover com null', 'categoria', null],
]) {
  test('reinicia pagina: ' + nome, () => {
    const origem = new URLSearchParams('pagina=3&busca=pastilha&categoria=FREIOS&somente_disponiveis=true&extra=ok');
    const antes = origem.toString();
    const resultado = atualizarParametroCatalogo(origem, chave, valor);
    assert.equal(resultado.has('pagina'), false);
    assert.equal(Number(resultado.get('pagina') ?? '1'), 1);
    assert.equal(resultado.get(chave), valor === '' || valor === false || valor === null ? null : String(valor));
    for (const outra of ['busca', 'categoria', 'somente_disponiveis', 'extra']) {
      if (outra !== chave) assert.equal(resultado.get(outra), origem.get(outra));
    }
    assert.equal(origem.toString(), antes);
  });
}

test('paginacao explicita preserva filtros e entrada', () => {
  const origem = new URLSearchParams('pagina=1&busca=pastilha&categoria=FREIOS&somente_disponiveis=true');
  const antes = origem.toString();
  const resultado = atualizarParametroCatalogo(origem, 'pagina', 2);
  assert.equal(resultado.get('pagina'), '2');
  for (const chave of ['busca', 'categoria', 'somente_disponiveis']) {
    assert.equal(resultado.get(chave), origem.get(chave));
  }
  assert.equal(origem.toString(), antes);
});

test('primeira busca preserva encoding', () => {
  const resultado = atualizarParametroCatalogo(new URLSearchParams(), 'busca', 'direção & motor');
  assert.equal(new URLSearchParams(resultado.toString()).get('busca'), 'direção & motor');
  assert.equal(resultado.has('pagina'), false);
});
```

- [x] Rodar `node --test tests/parametros-catalogo.test.js` em frontend/.
  Esperado RED: oito casos de reset falham, dois controles passam. Registrar real.
- [x] Antes do return do módulo, inserir:

```js
if (chave !== 'pagina') proximos.delete('pagina');
```

- [x] Reexecutar mesmo comando; esperado dez testes passam sem rede/env/banco.

## Tarefa 2 — Integração e execução contínua

**Cobertura:** REQ-05 a REQ-07, AC-04 e AC-05.
**Consome:** função da tarefa 1; parâmetros atuais de React Router/window.
**Produz:** mesma navegação e consulta com página reiniciada nas ações definidas.

- [x] Importar função de ../lib/parametrosCatalogo.js em Cabecalho.jsx e Catalogo.jsx.
- [x] Em pesquisar, preservar preventDefault e busca.trim; substituir montagem por:

```js
const atuais = atualizarParametroCatalogo(window.location.search, 'busca', termo);
navegar(`/?${atuais.toString()}`);
```

- [x] Em trocarParametro, substituir cópia/set/delete por:

```js
setParametros(atualizarParametroCatalogo(parametros, chave, valor));
```

Preservar dependências do useCallback, efeitos de consulta, handlers e nota.
Limpar todos os filtros já usa URLSearchParams vazio e continua igual.

- [x] Adicionar script frontend/package.json: `"test": "node --test tests/*.test.js"`.
- [x] No job build-frontend, entre npm ci e Compilar frontend, inserir:

```yaml
      - name: Testar parametros do catalogo
        run: npm test
```

- [x] Rodar `npm test` em frontend/, `npm test` em backend/, `npm run build`
  em frontend/ e `git diff --check` na raiz. Esperado: dez regressões novas,
  23 testes backend preservados, build passa. Sem npm ci no servidor local ativo.
- [ ] Roteiro manual: abrir /?pagina=3, pesquisar peça que aparece na página 1;
  conferir URL sem pagina e resultados corretos. Em página avançada, testar
  categoria/Todas, estoque ligado/desligado e limpar termo; restante preservado.
- [ ] Com filtro cujo resultado tenha várias páginas, avançar para página 2;
  conferir pagina=2 e filtros. Dar F5, voltar e avançar no histórico: URL/lista
  restauradas sem reset automático. Verificar input separadamente (INV-005).
- [x] Registrar quem executou o roteiro, resultados e limitações; atualizar docs.
- [x] Revisar arquivos; quando autorizado, commit sugerido
  `fix: reinicia pagina ao pesquisar e filtrar catalogo` e publicação da branch.
- [x] Aguardar autorização para PR; acompanhar checks e registrar evidências.
  Merge manual pelo usuário; não alterar proteção de main.

## Matriz de validação

A confirmação manual consolidada é do usuário. Passos instrumentados que
continuam sem marcação não têm execução específica registrada; são o roteiro
original, sem atribuir à IA interceptações ou medições que não realizou.

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Casos busca nova/repetida/vazia + manual | Página 1 e filtros preservados | Testes puros passaram; manual confirmado pelo usuário em 2026-10-12; sem detalhamento por variante |
| AC-02 | Cinco casos categoria/estoque/null + manual | Reset sem perder demais parâmetros | Testes puros passaram; manual confirmado pelo usuário em 2026-10-12; sem detalhamento por variante |
| AC-03 | Paginação, encoding e snapshots de entrada | Página explícita e entrada intacta | Passou |
| AC-04 | Navegador, F5, voltar/avançar | URL/lista coerentes | manual confirmado pelo usuário em 2026-10-12; sem detalhamento por variante |
| AC-05 | npm test dos dois projetos, build e CI autorizada | Sucesso | Frontend 10, backend 23 e build locais passaram; checks do PR #6 passaram |

## Migração e recuperação

Sem schema/dados. Reversão por commit no fluxo Git; sem reset de banco ou ERP.

## Autorrevisão e histórico

Regra cobre pesquisa, filtros e paginação explícita. Teste usa módulo real;
validação manual cobre ligação com React Router sem inventar teste de componente.
Implementação executada após aprovação da versão 1; resultados locais abaixo.
Validação manual confirmada pelo usuário em 2026-10-12; checks remotos da implementação registrados no histórico.

## Histórico — Implementação de busca-e-paginacao — 2026-10-11

Versão 1 aprovada pelo usuário: “entao aprovo os docs”. Função compartilhada
atualizarParametroCatalogo integrada em pesquisar e trocarParametro. Busca,
categoria e estoque removem pagina; paginação explícita preserva filtros.
Consulta continua no backend/ERP com tamanho 24; nenhum filtro local de lista.
Nota KZN-5D1E preservada. FIX-004 e INV-005 não corrigidos nesta unidade.

RED: node --test tests/parametros-catalogo.test.js no comportamento original
extraído para o módulo — oito falhas nos resets e dois controles passaram.
GREEN: npm test em frontend — dez testes passaram. npm test em backend —
23 testes passaram. Build frontend passou com 59 módulos; git diff --check
passou. Testes frontend importam função real, sem rede, env ou banco; suíte
backend mantém SQLite isolado e ERP simulado. Não houve validação React/E2E.

Script test frontend criado sem dependências. Workflow atualizado para executar
npm test no job build-frontend antes do build, preservando nomes dos checks.
Execução remota ainda pendente; mudança de workflow não equivale a CI validada.
Estado Implementado: roteiro manual pós-correção, confirmação do usuário e
checks remotos pendentes. Nenhum PR, merge ou deploy realizado nesta unidade.

## Histórico — Autorização do PR — 2026-10-11

Usuário autorizou “pode abrir o pr”. Publicação da branch e abertura do PR
autorizadas; merge permanece manual. Validação automatizada local concluída
(10 testes frontend, 23 backend e build). Validação manual pós-correção não
confirmada; não atribuir essa confirmação à autorização de abertura do PR.
Checks remotos pendentes nesta etapa.

## Histórico — CI e publicação de KZN-325 — 2026-10-11

PR #6: https://github.com/eduardofrois/kaizen-test/pull/6
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38179901454
Checks testes-backend e build-frontend passaram no commit c51b6ba. Workflow
do PR inclui npm test frontend antes do build. Branch publicada em origin.
Estado Implementado: validação automatizada local/remota concluída; falta
confirmação manual pós-correção (AC-04 e parte integrada de AC-01/AC-02).
Não marcar a unidade como Validada apenas pela CI. Merge manual pelo usuário.
Pendências remotas descritas antes desta execução são históricas.

## Consolidação documental — 2026-10-12

Validação manual da correção concluída pelo usuário, conforme confirmação
registrada no início. Evidências automatizadas e CI anteriores preservadas.
Pendências manuais nos relatos históricos descrevem a informação disponível
à época. Cenários sem detalhamento individual continuam identificados como
limite de evidência, não como ausência de validação manual da correção.
Nenhum código, teste, contrato, dependência, banco ou ERP alterado nesta revisão.
