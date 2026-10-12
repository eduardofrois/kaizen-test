# Spec — Restrição de origem CORS

**Versão:** 1
**Estado:** Validado — PR #15 aberto
**Origem:** FIX-002
**Baseline/data:** 14f5163; 2026-10-12
**Branch:** fix/restricao-de-origem-cors
**Aprovação da spec:** 2026-10-12; usuário “aprovado” e “spec aprovada, pode fazer o plan”.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado”, após apresentação do plano versão 1.

## Problema e evidência

app.js usa cors({ origin:true, credentials:true }) globalmente. Isso reflete
qualquer Origin recebido, sem consumir config.corsOrigem. O comentário explica
que a escolha contornou preflight entre portas, mas vite.config.js já encaminha
/api na mesma origem e app.js serve frontend em produção na mesma origem.
Inspeção estática confirma a permissão excessiva; exploração autenticada em
navegador não foi executada. Cookie mantém httpOnly, SameSite=Lax e Secure em
produção: impacto depende de site/origem e regras do navegador. Não afirmar
que qualquer site consegue ler qualquer sessão. Nota KZN-2B9C lida em config.js.

## Objetivo e escopo

Conceder permissão CORS com credenciais apenas à origem configurada, quando
necessária, preservando uso normal na mesma origem. Inclui middleware, validação
de configuração, exemplos/guia e testes isolados. Fora: política CSRF completa,
trust proxy, JWT/cookies, ERP, schema, frontend e dependências.

## Requisitos

- REQ-01: CORS_ORIGEM representa uma única origem HTTP(S) explícita. Comparação
  exata com Origin; sem wildcard, regex, reflexão irrestrita ou lista implícita.
- REQ-02: quando variável ausente/vazia, development/test usam padrão atual
  http://localhost:5173; production desabilita permissões CORS entre origens.
  Mesma origem continua funcionando sem cabeçalhos de autorização CORS.
- REQ-03: valor fornecido deve ser origem canônica: protocolo HTTP(S), host e
  porta opcional, sem credenciais, caminho (inclusive barra final), query ou
  fragmento. Rejeitar *, null e listas; validar fail-fast sem ecoar o valor.
  Exemplo válido: https://loja.example. Configuração existente com origem
  canônica continua compatível. Porta faz parte da origem.
- REQ-04: origem permitida recebe Access-Control-Allow-Origin com seu valor
  e Access-Control-Allow-Credentials:true, inclusive no preflight. Preservar
  métodos/headers padrão do middleware existente e Vary:Origin onde aplicável.
- REQ-05: origem desconhecida, null ou ausente não recebe cabeçalhos de
  permissão CORS (Allow-Origin/Allow-Credentials). Preflight desconhecido não
  deve anunciar métodos/headers permitidos; seguir fluxo normal de rotas.
- REQ-06: requisição sem Origin continua aceita conforme autenticação/rotas.
  Origem recusada para CORS não significa bloquear toda requisição HTTP:
  middleware deixa seguir sem permissão de leitura pelo navegador. Não criar
  um403 genérico, alterar envelope ou alegar proteção contra CSRF.
- REQ-07: preservar autenticação/posse/cookies e proxy Vite. Corrigir comentário
  em app.js para descrever a política real. Não ler nem modificar .env real.

## Contratos e decisões

Não há mudança de payload/rotas/schema. Mudança nos headers CORS e configuração
é intencional. Produção em mesma origem não exige CORS_ORIGEM; implantação com
frontend separado precisa informar sua origem explicitamente.
Proposta preferida: manter capacidade configurável existente e fechar por
padrão em produção. Alternativa remover CORS totalmente: serve à topologia
atual, mas elimina acesso direto autorizado entre origens. Alternativa lista
de várias origens: não há requisito atual, amplia configuração e testes.
Não usar middleware CORS como firewall: clientes fora do navegador não aplicam
sua política, e requisições simples podem chegar mesmo sem permissão de leitura.

## Critérios de aceite

- [x] AC-01: origem configurada recebe headers esperados em GET e OPTIONS;
  preflight permite o método/header solicitado conforme política existente.
- [x] AC-02: outra origem, porta diferente, prefixo/sufixo enganoso e null não
  recebem permissões; ausência de Origin não recebe permissões nem quebra rota.
- [x] AC-03: produção sem origem configurada não concede CORS; development/test
  mantêm padrão localhost5173. Config inválida falha sem imprimir seu conteúdo.
- [x] AC-04: rota privada continua401 sem sessão e respeita proprietário com
  sessão sintética; origem confiável não substitui autenticação. Sem alterar cookie.
- [x] AC-05: testes backend/frontend e build passam; usuário confirma catálogo,
  login e sessão via proxy normal após reiniciar backend.

## Validação e riscos

Testar configuração em subprocessos sem .env, ambiente sintético e cwd temporário.
HTTP com app real, SQLite temporário, porta local efêmera e ERP simulado/negado;
preferir rotas sem ERP para headers. Não consultar perfil/contas reais nem
criar pedido. Testes HTTP demonstram headers, não exploração no navegador.
Conferência manual distingue funcionamento normal de prova de bloqueio pelo
navegador. Não prometer neutralizar CSRF ou ataques de subdomínio só com CORS.
Possível quebra intencional de clientes que dependiam da reflexão arbitrária;
guia documenta como configurar origem autorizada. Não aceitar caminhos de URL
como se fossem origem. Política de mesma origem não exige cabeçalhos CORS.

## Entrega e aprovação

Atualizar .env.example e docs/ambiente.md na implementação aprovada, além de
spec/plano, fix.md, RELATORIO.md, investigação e índice SDD com evidências reais.
Main sincronizada; PR14 integrado. Spec preparada para revisão; após aprovação,
preparar plan.md detalhado. Nenhum código/teste/config real alterado nesta etapa.
Commit, push e PR dependem de comando específico; merge manual pelo usuário.

## Aprovação — 2026-10-12

Spec versão1 aprovada pelo usuário. Confirmado que CORS_ORIGEM já existe;
nenhuma variável nova nem edição de .env real é necessária nesta preparação.
Plano versão1 preparado para aprovação separada.

## FIX-002 implementado — 2026-10-12

Plano versão1 aprovado pelo usuário com “aprovado” após apresentação.
app.js compara Origin exatamente com config.corsOrigem; desconhecida/null/
ausente não recebe permissões CORS e segue as rotas/autenticação normais.
config.js valida origem canônica HTTP(S), sem ecoar entrada inválida; padrão
localhost5173 em dev/test, vazio em produção sem configuração. .env.example
e guia de ambiente atualizados. Nenhuma variável nova; .env real preservada.
Nota de revisão KZN-2B9C lida e preservada em config.js. Comentário antigo
sobre refletir qualquer origem substituído pela política efetiva.

Adicionados19 testes de configuração (alguns com tabelas internas) e5 cenários
HTTP agrupados. RED24:5 passaram/19 falharam por default produção, ausência de
validação e reflexão indevida. GREEN24/24; com config.test.js30/30. Suíte
backend89/89, frontend53/53 e build61 módulos passaram; sintaxe app/config e
git diff --check passaram. Baseline14f5163 contém65 testes backend anteriores;
a correção FIX-008 permanece em PR separado e não compõe essa contagem.

HTTP usa app real, SQLite/schema temporários, JWT/usuários sintéticos e fetch
restrito à origem local. Comprovados GET/OPTIONS permitido, métodos/headers,
Vary, origens enganadoras/porta/null/ausente, defaults em3 ambientes,401 sem
sessão e perfil do usuário1 sem hash com sessão. Origem negada com sessão
continua200 no cliente HTTP sem permissão CORS, conforme decisão da spec.
Não executada exploração no navegador; não é promessa de proteção CSRF.
Ajuste de roteiro: /auth/eu exige autenticação, diferente do pressuposto no
plano inicial; teste usa /perfil com401 sem sessão, mantendo objetivo aprovado.
Estado Implementado: AC-01 a04 passaram isoladamente; AC-05 regressões/build
passaram, confirmação manual pendente. Reiniciar backend, abrir loja via
localhost5173, conferir catálogo, login, perfil e sessão apósF5. Sem reset
ou alteração de segredo. Commit/push/PR aguardam comando específico.

## FIX-002 validado — 2026-10-12

Usuário confirmou “validado, pode abrir o PR” após roteiro de reinício, catálogo,
login/perfil e sessão apósF5. AC-05 concluído com regressões e confirmação
manual. Estado Validado. Commit, publicação da branch e PR autorizados.
Confirmação de uso normal não equivale a exploração autenticada em navegador.
CI remoto será acompanhado; merge manual pelo usuário. Registros anteriores
de manual/autorização pendentes são históricos.

## Publicação FIX-002 — 2026-10-12

Implementação `b3096f8` publicada em `fix/restricao-de-origem-cors`.
PR #15: https://github.com/eduardofrois/kaizen-test/pull/15
Estado Validado, confirmação manual registrada. Checks remotos em acompanhamento;
merge manual pendente. Nenhum merge realizado pela IA.
