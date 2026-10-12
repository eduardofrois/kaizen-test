# Spec — Acesso à última página

**Versão:** 1
**Estado:** Implementado — validação manual pendente
**Baseline/data:** a1c60d6; 2026-10-11
**Origem:** FIX-004
**Pasta/branch:** ultima-pagina / fix/ultima-pagina
**Aprovação do desenho:** 2026-10-11; usuário “aprovado” após apresentação da spec versão 1.
**Aprovação para implementar:** 2026-10-11; usuário “aprovado”, após apresentação do plano versão 1.

## Problema e evidência

Paginacao em frontend/src/componentes/ui.jsx desabilita Próxima usando
pagina >= totalPaginas - 1. A numeração começa em 1. Execução isolada da
expressão confirmou bloqueio indevido em 1/2 e 2/3. Inspeção dos consumidores
confirmou uso compartilhado no catálogo e histórico de pedidos.
Esta etapa não incluiu reprodução em navegador.

## Objetivo e comportamento esperado

Permitir percorrer todas as páginas existentes, avançar até a última e voltar.
Próxima desabilitada quando pagina >= totalPaginas; Anterior quando pagina <= 1.
Sem paginacao ou com total_paginas <= 1, preservar retorno null atual.

## Escopo e invariantes

- REQ-01: corrigir limite no componente compartilhado, sem duplicar regra nas telas.
- REQ-02: preservar aoMudar(pagina + 1) e aoMudar(pagina - 1).
- REQ-03: preservar busca/filtros na URL do catálogo e estado atual de Pedidos.
- REQ-04: preservar classes, texto, aria-label e comportamento de ocultação.
- REQ-05: sem alteração de API, ERP, banco, dependências ou dados locais.

Fora: normalização de URL inválida, busca/filtros (KZN-325), nova paginação de
backend, carregamento concorrente ou mudança da URL do histórico de pedidos.

## Contratos, dados e interface

Props preservadas: Paginacao({ paginacao, aoMudar }); paginacao contém pagina,
total_paginas e total. Backend já fornece páginas numeradas a partir de 1.
Não se aplica migração: nenhum dado persistido será alterado.

## Decisões e alternativas

Recomendação: corrigir a comparação no componente compartilhado. Resolve
os dois consumidores com alteração mínima e evita regras divergentes.
Alternativa: corrigir separadamente em Catalogo e Pedidos. Duplica lógica
sem benefício. Alternativa: alterar numeração do backend para zero. Quebra
contratos e amplia escopo desnecessariamente.

## Critérios de aceite

- [x] AC-01: 1/2 permite Próxima; ao clicar solicita 2; 2/2 bloqueia Próxima.
- [x] AC-02: 1/3 e 2/3 permitem avançar; 3/3 bloqueia Próxima.
- [x] AC-03: Anterior bloqueada na primeira; nas demais solicita pagina - 1.
- [x] AC-04: sem paginacao e com 0/1 páginas, componente continua oculto.
- [ ] AC-05: catálogo mantém filtros ao navegar; pedidos acessam última página
  quando houver dados suficientes, sem criar pedidos reais para testar.
- [x] AC-06: testes focados, regressões e build passam após implementação.

## Riscos e validação

Testar o componente real e os handlers, evitando teste que apenas replique a
expressão. Avaliar harness com ferramentas já instaladas no plano após revisão
da spec; nenhuma nova dependência aprovada. Validação manual no catálogo com
mais de uma página; pedidos somente se houver histórico suficiente. Se não
houver, registrar limitação e usar prova isolada do componente compartilhado.
Sem escrita no ERP. Valores inválidos/fora do intervalo não recebem política
nova; a comparação >= mantém bloqueio para página acima do total.

## Entrega e histórico

Atualizar fix.md, RELATORIO.md, investigação e SDD com evidências reais.
Main atualizada após merge do PR #9, a1c60d6. Código e testes intactos nesta
unidade. Após revisão do desenho, preparar plan.md para aprovação antes de
implementar. Autorizações da unidade monetária não se estendem a esta correção.

Desenho aprovado em 2026-10-11; plano preparado. Código/testes intactos.

## FIX-004 implementado — 2026-10-11

Usuário aprovou plano versão 1 com “aprovado”, após apresentação nesta sessão.
Branch fix/ultima-pagina. Produção: em Paginacao, comparação passou de
pagina >= totalPaginas - 1 para pagina >= totalPaginas. Nenhuma outra
alteração de produção, contrato, dependência, API, banco ou ERP nesta unidade.
Teste novo frontend/tests/paginacao.test.js carrega o módulo real transformado
pelo Vite existente, confere HTML renderizado e callbacks dos botões.
RED: nove testes, sete passaram e dois falharam (1/2 e 2/3). GREEN focado:
9/9; suíte frontend 46/46; backend 35/35; build passou com 60 módulos;
git diff --check passou. Sem servidor ou pedidos reais nos testes.
AC-01/02/03/04/06 comprovados por verificação isolada/regressões. AC-05 manual
pendente: percorrer catálogo até última página preservando filtros e voltar;
conferir pedidos apenas se histórico existente tiver páginas suficientes.
HTML/callback direto não equivalem a navegação real no navegador.
Estado Implementado. Sem commit, publicação ou PR; aguardar conferência e
comando do usuário. Registros anteriores descrevem etapas passadas.

## Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/ultima-pagina e abertura de PR para main. Checks locais concluídos;
validação manual não foi informada. CI remoto será acompanhado. Merge manual
pelo usuário; os registros anteriores de publicação pendente são históricos.
