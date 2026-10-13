# Spec — Busca e paginação do catálogo

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Baseline/data:** 2026-10-11
**Origem:** KZN-325 — Busca diz que não encontrou peça que existe
**Branch:** fix/busca-e-paginacao
**Aprovação para implementar:** versão 1 aprovada em 2026-10-11; usuário: “entao aprovo os docs”.


**Validação manual atual — 2026-10-12:** concluída pelo usuário. Referência:
“Agora eu preciso que voce revise os arquivos e mude aonde fala que eu nao fiz
a validação manual, pois eu fiz.” A confirmação complementa as evidências
anteriores; não acrescenta execução pela IA, capturas por variante, exploração
de segurança ou pedido real no SIAC. Requisitos e aprovações de implementação
permanecem os já registrados. Esta revisão documental não autoriza publicação.

> Leitura atualizada em 2026-10-13, referência main. O problema e
> os exemplos de execução abaixo descrevem a baseline e o escopo original
> da unidade. Relatos datados preservam o estado conhecido naquela etapa.
> Contratos evoluídos e pendências atuais: [índice SDD](../README.md).

## Problema e evidência na baseline

Cabecalho.jsx/pesquisar copia window.location.search e muda busca sem retirar
pagina. Catalogo.jsx/trocarParametro também mantém a página ao mudar categoria,
somente_disponiveis e ao limpar a busca. Uma página válida para o catálogo
anterior pode não existir nos novos resultados, causando falso vazio.

Inspeção estática confirmou os dois caminhos. A investigação anterior extraiu
pesquisar e obteve /?pagina=2&busca=amortecedor. Nesta sessão o usuário informou
“Erro encontrado”, confirmando reprodução pela interface. Não houve nova
execução automatizada nem validação pós-correção nesta preparação.
Git pull --ff-only realizado antes do trabalho; origin/main inclui PR #5
nessa publicação. Arquivos locais gerados foram preservados.

## Objetivo e comportamento esperado

Submeter uma pesquisa, limpar seu termo, selecionar/remover categoria e ligar
ou desligar Só com estoque deve iniciar a consulta na primeira página.
Mudar apenas a página deve preservar busca e filtros. URL permanece a fonte
da consulta; F5 e voltar/avançar devem restaurar a URL acessada, sem reset
por efeito de montagem ou por resposta do ERP.

## Escopo

Incluído: regra comum de atualização de query string, uso nos dois componentes,
regressões isoladas sem dependências novas e execução dessas regressões na CI.
Fora: FIX-004 (Próxima desabilitado cedo), INV-005 (input não sincroniza com URL),
normalização de URLs inválidas, busca automática ao digitar, fallback de página
por redução posterior do estoque, backend/SIAC, carrinho e checkout.

## Requisitos e invariantes

- REQ-01: toda submissão de busca, inclusive termo vazio ou repetido, remove
  pagina da URL; o catálogo já interpreta ausência como página 1.
- REQ-02: atualizar categoria, somente_disponiveis ou limpar busca também
  remove pagina; remover filtro usa a ausência da chave, como hoje.
- REQ-03: atualização explícita de pagina conserva o valor solicitado e
  demais parâmetros. Não reiniciar página em F5, montagem ou histórico.
- REQ-04: conservar os demais filtros e parâmetros já presentes. Copiar
  URLSearchParams sem mutar a entrada. Preservar encoding de espaços/acentos.
- REQ-05: trim do termo continua em pesquisar; formulário navega para /.
  Não alterar identidade visual, quantidade por página (24), estados de erro,
  vazio/carregamento ou cancelamento lógico de respostas antigas.
- REQ-06: preservar nota KZN-5D1E e contratos HTTP. Sem schema, migração,
  dependências ou mudanças de dados/credenciais.
- REQ-07: testes usam função real importada pelo frontend, node:test e
  URLSearchParams; não extrair funções por texto nem testar só cópia da regra.
  Executar na CI sem alterar nomes dos checks existentes.

## Contratos, dados e interface

Nova função interna atualizarParametroCatalogo(parametros, chave, valor)
retorna novo URLSearchParams. Entradas atuais: busca/categoria string,
somente_disponiveis booleano, pagina número; null, vazio e false removem chave.
Contrato externo de /api/catalogo e formato da resposta permanecem iguais.
Sem persistência além da URL. Sem mudança visual ou migração.

## Decisões e alternativas

Escolha aprovada: função pequena compartilhada pelos dois pontos de atualização,
com testes nativos do Node; evita duplicar reset e permite regressão sem novo
framework. Remover pagina usa o default existente; setar pagina=1 também
funcionaria, mas acrescenta parâmetro desnecessário. Reset em useEffect foi
rejeitado por interferir no histórico e provocar consulta intermediária errada.

A extensão de CI é restrita a npm test no job build-frontend, antes do build;
não introduz job, permissões, action ou dependência nova. Essas escolhas fazem
parte da versão 1 aprovada pelo usuário.

## Critérios de aceite

- [x] AC-01: busca enviada da página 3 produz consulta na página 1, preservando
  categoria e disponibilidade; termo vazio remove busca e pagina.
- [x] AC-02: categoria, Todas, ligar/desligar estoque e limpar busca reiniciam
  página, preservando os demais parâmetros.
- [x] AC-03: paginação explícita conserva busca/filtros; função não muta entrada
  e suporta termo com acentos e caracteres especiais.
- [x] AC-04: teste manual confirma resultados ao pesquisar após avançar páginas;
  F5 e histórico conservam URL/consulta. Não exigir sincronização do input (INV-005).
- [x] AC-05: testes frontend, suíte backend e build passam. CI inclui testes
  frontend; checks remotos após autorização de PR. Documentar limites reais.

## Riscos e validação

FIX-004 pode impedir avançar até a última página; usar uma página intermediária
ou URL com pagina=3 para reproduzir. Termo pode ter zero resultados legítimos;
comparar com a mesma consulta feita a partir da primeira página. INV-005 pode
manter texto antigo no campo após voltar; verificar URL e lista, sem atribuir
à unidade uma correção que não faz parte dela.
Testes puros provam transição de parâmetros; integração dos handlers será
conferida no diff e manualmente no navegador. Não alegar teste React/E2E.
Sem pedidos, alterações de estoque ou escritas automatizadas no ERP.

## Entrega e histórico

Atualizar spec/plano, fix.md, relatório e investigação após cada etapa.
Versão 1 preparada por “pode criar os documentos de correcao” e aprovada
por “entao aprovo os docs”. Testes locais, CI da implementação e confirmação manual registrados; ver histórico e consolidação atual.

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
Checks testes-backend e build-frontend passaram nessa publicação. Workflow
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
