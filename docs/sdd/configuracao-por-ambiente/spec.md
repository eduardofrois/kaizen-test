# Spec — Configuração por ambiente, sem segredos no código

**Versão:** 1
**Estado:** Implementado e validado isoladamente
**Data/baseline:** 2026-10-11; original 81897d5
**Origem:** FIX-001 em fix.md; nota KZN-2B9C
**Nome do trabalho:** configuracao-por-ambiente
**Aprovação:** explícita do usuário em 2026-10-11 para esta correção/configuração inicial.

## Problema

config.js tem segredo JWT e token ERP literais usados como fallback. A falta
de ambiente não causa erro porque validarConfig() recebe os defaults. O
repositório de entrega é público; publicar o código ou seu histórico original
replicaria credenciais. A remoção é condição para enviar a aplicação.

## Objetivo

Exigir configuração explícita de integração e sessão, mantendo o projeto
compatível com .env local e variáveis do processo, sem publicar valores reais.

## Escopo

Inclui config.js, testes de configuração isolados, coerência ERP_URL no README
e comentários do exemplo/guia. Inclui revisão do primeiro conjunto de código
que será versionado no histórico próprio.

Não inclui CORS, porta/timeout/expiração novos, exploração da credencial,
alterações do SIAC, deploy ou mudança de produto. Revogação do token antigo
depende do responsável pelo ERP e não é prometida por esta correção.

## Requisitos

- REQ-01: não manter literais secretos nem fallback de JWT_SEGREDO/ERP_TOKEN.
- REQ-02: ERP_URL também deve ser explícita, para não conectar silenciosamente
  ao serviço de um ambiente diferente. Sem valor padrão externo.
- REQ-03: ausente, vazio e placeholders de JWT/ERP impedem subida via
  validarConfig(). Preservar mínimo 32 caracteres para JWT.
- REQ-04: ERP_URL deve ser URL absoluta HTTP(S) com hostname válido para o
  parser URL; remover barras finais como no comportamento atual.
- REQ-05: erros citam nomes de variáveis e instruções, nunca valores.
- REQ-06: preservar formato config, nome do cookie, defaults operacionais e
  funções exportadas. Não mover segredo para frontend ou arquivo rastreado.
- REQ-07: testes não acessam rede, banco da loja nem .env do usuário.
- REQ-08: primeiro histórico publicado da aplicação não contém os literais
  originais. Não fazer commit da baseline insegura antes de sanitizá-la.
- REQ-09: documentação utiliza ERP_URL e registra validações com resultados reais.

## Alternativas

1. **Exigir env para os três campos (proposta):** fail-fast explícito, sem
   ambiguidade de ambiente; precisa de .env local antes de iniciar a loja.
2. Gerar JWT aleatório no boot: evita literal, mas invalida sessões a cada
   reinício e diverge entre instâncias; não resolve token ERP.
3. Manter defaults só em desenvolvimento: ainda publica a credencial e
   mantém configuração implícita; rejeitada nesta proposta.

## Contratos e dados

Sem alteração de API HTTP, schema ou dados existentes. Clientes configurados
com env continuam usando as mesmas propriedades. Execuções que dependiam dos
defaults passam a falhar com mensagem acionável antes de abrir o banco/HTTP.
Não criar .env com valores fictícios como substituto da configuração real.

## Critérios de aceite

- [x] AC-01: cada variável obrigatória ausente/vazia causa erro identificável.
- [x] AC-02: placeholders JWT/token e JWT curto são rejeitados.
- [x] AC-03: URL inválida ou com protocolo não HTTP(S) é rejeitada sem ecoar valor.
- [x] AC-04: env sintética válida passa; propriedades e normalização preservadas.
- [x] AC-05: teste executa em diretório temporário sem .env/rede/banco real.
- [x] AC-06: diff/arquivos/histórico destinados ao GitHub não contêm os segredos
  originais nem .env/SQLite/build/dependências locais.
- [x] AC-07: README, exemplo e guia descrevem ERP_URL e obrigação dos segredos.

## Riscos

- Ambiente local ainda não configurado deixa de subir: comportamento desejado
  com instrução clara; valores reais devem ser fornecidos localmente pelo usuário.
- Credencial já exposta em outro repositório continua exposta até revogação;
  a correção não apaga o histórico da empresa.
- Não generalizar um teste de config para comprovar autenticação real do SIAC.

## Validação e entrega

node:test + subprocessos com env sintética e cwd temporário, após instalar
dependências pelo lockfile. Registrar comandos/resultados. Revisar conteúdo
a publicar sem imprimir credenciais. Atualizar FIX-001, ambiente e decisão de
Git; editar relatório apenas quando o usuário aprovar seu preenchimento.

## Registro da execução — 2026-10-11

Usuário: "sobre o fix configuracao por ambiente, esta aprovado a forma que
vamos fazer essa correcao/configuracao inicial"; pediu também atualização do
relatório e criação de .env. Complemento autorizado: backend/.env local com
campos obrigatórios vazios, padrões operacionais preenchidos, permissão 0600
e exclusão do Git. Esta solicitação substitui a restrição anterior de não
criar .env; testes continuam isolados e não leem esse arquivo.

Branch: codex/configuracao-por-ambiente. npm ci: 120 pacotes instalados,
auditoria informou zero vulnerabilidades. node --test tests/config.test.js:
RED cinco falhas/um sucesso; GREEN seis sucessos. node --check
backend/src/config.js: passou. Sem rede ERP ou banco nos testes; integração
real e preenchimento local pendentes. Nota KZN-2B9C preservada.
Relatório, inventário e guias atualizados. Novo push não realizado nesta etapa.
