# Spec — Remoção de telefone do perfil

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Baseline/data:** 2026-10-12
**Origem:** FIX-007
**Branch:** fix/remocao-de-telefone-do-perfil
**Aprovação da spec:** 2026-10-12; usuário “spec aprovada”.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação do plano versão 1.


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

atualizarPerfil em usuarioService.js usa telefone || atual.telefone. A rota
PATCH /api/perfil sempre chama telefone(corpo.telefone), mesmo quando omitido;
o validador retorna null para ausência/vazio. Limpeza intencional acaba mantendo
o número anterior. Registro anterior de execução isolada confirmou UPDATE com
telefone antigo ao enviar null. Inspeção atual confirma causa em rota e serviço.
O usuário pediu reprodução/correção; não há nesta etapa nova execução própria
em navegador ou confirmação inequívoca de teste manual da correção.

## Objetivo e comportamento esperado

Permitir apagar telefone opcional e manter remoção após releitura e F5.
Definir telefone omitido como preservar; enviado vazio/espaços/null como remover;
telefone válido enviado como substituir. Não alterar demais campos por essa regra.

## Escopo e invariantes

- REQ-01: rota diferencia propriedade telefone ausente de presente. Ausente não
  é incluída nos dados de atualização; presente usa validador existente.
- REQ-02: serviço preserva telefone apenas quando telefone === undefined;
  null explícito grava NULL. Strings válidas já normalizadas pela rota são salvas.
- REQ-03: vazio, espaços e null explícitos passam pela normalização existente
  para null. Telefone inválido mantém erro422 por campo, sem salvar parcialmente.
- REQ-04: nome e documento continuam obrigatórios/validados na rota; não converter
  todo o endpoint em PATCH parcial. E-mail e senha permanecem fora desta unidade.
- REQ-05: autenticação identifica proprietário; não aceitar usuario_id do corpo.
  Atualização de um usuário não modifica outro. Serialização não expõe senha_hash.
- REQ-06: sem schema, dependência, frontend, env, banco real ou ERP alterados.

## Contratos, dados e interface

PATCH /api/perfil mantém corpo nome/documento exigidos; telefone é opcional.
Com propriedade omitida: preserva número. Com telefone:null, telefone:'' ou
telefone:'   ': remove. Valor válido mantém regras atuais (máximo20 caracteres,
10/11 dígitos), sem nova política de máscara ou formato. GET retorna telefone:null
após remoção; formulário já converte null para ''.
Sem migração: coluna usuarios.telefone já aceita NULL. Sem alteração do SIAC.
Serviço consome telefone normalizado; vazio cru no serviço não ganha contrato
novo, pois normalização pertence à rota. Outros consumidores devem ser inspecionados.

## Decisões e alternativas

Recomendação: condicional de presença na rota e fallback somente para undefined
no serviço. Distingue omissão de limpeza explícita nas duas camadas.
Alternativa: trocar || por ??. Não resolve, pois null significa remover.
Alternativa: tratar sempre ausência como remoção. Apagaria dado quando cliente
não envia telefone; incompatível com a semântica escolhida de preservação.

## Critérios de aceite

- [x] AC-01: apagar telefone com vazio/espaços/null persiste NULL e permanece
  removido em nova leitura; serialização não contém hash.
- [x] AC-02: telefone omitido mantém número atual; válido substitui; usuário
  que já não tem telefone permanece sem ele ao omitir/limpar.
- [x] AC-03: telefone inválido retorna422 com detalhe telefone e nenhuma
  atualização parcial; nome/documento continuam exigidos e validados.
- [x] AC-04: atualização afeta somente autenticado; payload com usuario_id
  alheio não troca proprietário; operação sem sessão não altera dados.
- [x] AC-05: regressões backend/frontend/build passam; manual confirma apagar,
  salvar e atualizar página quando informado pelo usuário.

## Riscos e estratégia de validação

Testar serviço real com SQLite em memória e configuração sintética; testar
rota real autenticada em ambiente isolado para comprovar distinção de presença,
validação e autorização. Nenhuma requisição ao ERP ou leitura de .env real.
Se teste HTTP exigir porta local e sandbox impedir, usar execução autorizada;
falha de infraestrutura não comprova comportamento. Harness detalhado no plano.
Validar manualmente perfil com telefone, apagar/salvar/F5; confirmar troca por
número válido. Não copiar dados pessoais para relatório. Teste isolado não é
confirmação manual. Sem reparo retroativo: telefone só removido quando solicitado.

## Entrega e histórico

PR #11 confirmado integrado à main; pull concluído. Spec versão1 em
proposta. Após aprovação do desenho, preparar plan.md para revisão antes da
implementação. Atualizar fix.md, relatório, investigação e SDD com evidências.
Código/testes intactos nesta unidade; autorização de publicação anterior não
se estende a este trabalho. Merge permanece manual pelo usuário.

## Histórico — FIX-007 implementado — 2026-10-12

Plano versão1 aprovado pelo usuário com “aprovado”, após apresentação nesta
sessão. Rota valida telefone apenas quando Object.hasOwn(corpo,'telefone');
serviço preserva valor anterior somente diante de undefined. Null gravaNULL.
Vazio/espaços seguem normalização existente; nome/documento obrigatórios.
Adicionados21 testes:7 serviço real/SQLite em memória e14 HTTP autenticado
com banco temporário e porta local efêmera. Nenhuma env/DB real ou ERP acessado.
Primeira execução HTTP sob sandbox falhou em infraestrutura; limpeza do
servidor mascarou erro de inicialização, posteriormente guardada por listening.
Essa execução não conta como reprodução do bug. Execução autorizada RED:
21 casos,16 passaram/5 falharam por telefone antigo em vez deNULL (serviço,
vazio,espaços,null e payload com usuario_id alheio). GREEN focado21/21.
Regressão completa backend65/65 e frontend53/53; build61 módulos passou;
sintaxe dos dois módulos e git diff --check passaram. Testes comprovam GET
após PATCH, omissão, edição, conta sem telefone, validação422 sem atualização
parcial,401 sem sessão/token inválido e isolamento entre proprietários.
Nenhum hash/token/cookie real usado; serialização não expõe senha_hash.
Estado Implementado. AC-01 a AC-04 comprovados isoladamente; AC-05 testes/build
passaram, manual pendente. Próximo passo: apagar telefone no perfil, salvar e
F5; depois editar um telefone válido e conferir persistência. Sem registrar
número pessoal nos docs. Nenhuma alteração frontend/schema/dependências.
Commit, publicação e PR aguardam comando explícito; CI não executado nesta
unidade. Registros anteriores descrevem etapas históricas.

## Histórico — Validação manual e publicação autorizada — 2026-10-12

Usuário confirmou “validado, pode abrir o PR”, após roteiro de remoção,
salvamento/F5 e edição de telefone válido. Confirmação manual registrada sem
expor número pessoal. AC-05 concluído com regressões locais e confirmação
do usuário. Estado Validado; commit/publicação da branch e PR para main
autorizados. CI remoto será acompanhado; merge manual pelo usuário.
Registros anteriores de validação/publicação pendente são históricos.

## Histórico — Publicação FIX-007 — 2026-10-12

Implementação publicada na branch fix/remocao-de-telefone-do-perfil.
PR #12: https://github.com/eduardofrois/kaizen-test/pull/12
Checks testes-backend e build-frontend passaram no run38314449233:
https://github.com/eduardofrois/kaizen-test/actions/runs/38314449233
Validação manual confirmada pelo usuário. Estado Validado; merge manual pendente.
Esta atualização documental gera novos checks a acompanhar. Registros anteriores
de publicação/CI/manual pendentes são históricos. Nenhum merge realizado pela IA.
