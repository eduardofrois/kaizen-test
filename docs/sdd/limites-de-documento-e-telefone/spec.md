# Spec — Limites e máscaras de documento e telefone

**Versão:** 2
**Estado:** Validado pelo usuário — PR #16 aberto
**Origem:** FIX-010
**Baseline/data:** 7d4f391; 2026-10-12
**Branch:** fix/limites-de-documento-e-telefone
**Aprovação da versão2:** 2026-10-12; usuário “aprovado”, após apresentação da versão2.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado” após plano versão1.

## Problema e evidência

Usuário demonstrou cadastro aceitando documento/telefone excessivos durante
entrada, com rejeição apenas no envio. Cadastro.jsx e DadosPessoais de Perfil.jsx
não limitam nem formatam os quatro inputs; Campo repassa props normalmente.
Backend admite documento até18 caracteres com11/14 dígitos e telefone opcional
até20 caracteres com10/11 dígitos. Não há evidência de persistência excessiva.
Em2026-10-12 usuário ampliou escopo: máscaras e identificação automática CPF/CNPJ.

## Objetivo e escopo

Limitar e formatar documento e telefone nos formulários de cadastro e perfil.
Inclui utilitários compartilhados e adaptação de entrada/colagem/cursor apenas
nesses campos. Sem backend/schema/dependências, outros campos, senha/endereço,
validação matemática de CPF/CNPJ ou migração de dados existentes.
Documento numérico segue o contrato atual da API; outros formatos de documento
exigiriam outra alteração de contrato e não são introduzidos nesta unidade.
Telefone segue padrão brasileiro com DDD, sem código de país/extensão.

## Requisitos e comportamento

- REQ-01: documento conserva string de dígitos e zeros iniciais; máximo14 dígitos.
  Até11 dígitos aplica CPF progressivo (000.000.000-00); ao entrar12º dígito
  troca para CNPJ progressivo (00.000.000/0000-00). Ao voltar para11, retorna CPF.
  Identificação é por quantidade, não por validação ou intenção inferida.
- REQ-02: telefone conserva string, máximo11 dígitos; até10 usa máscara de
  fixo (00) 0000-0000, com11 usa celular (00) 00000-0000. Formatação progressiva
  enquanto incompleto, sem caracteres pendurados além do necessário.
- REQ-03: entrada nova remove caracteres não numéricos e usa primeiros14/11
  dígitos. Aceitar colagem com ou sem máscara, inclusive excesso. Não converter
  em Number. Não interpretar +55 como DDI: campo é DDD+número; explicitar isso
  na dica de telefone. Sem adivinhar ou remover código de país automaticamente.
- REQ-04: digitação, paste e autofill devem convergir ao mesmo valor formatado.
  Não depender de maxLength do DOM antes de interpretar colagem: ele pode cortar
  parte de um CNPJ já formatado quando o campo contém máscara parcial. Limitar
  dígitos na transformação; resultado CPF<=14, CNPJ<=18, telefone<=15 caracteres,
  compatível com máximos18/20 da API. A implementação pode omitir maxLength
  nativo se necessário para permitir interpretar a entrada completa.
- REQ-05: cursor acompanha posição lógica entre dígitos ao inserir/substituir
  no meio; não salta sempre para o fim. Backspace/Delete junto à pontuação
  devem permitir apagar dígito adjacente, sem sensação de campo travado.
  Selecionar tudo/limpar/colar e substituição parcial funcionam.
- REQ-06: documento é input textual, telefone type=tel; ambos inputMode=numeric.
  Labels acessíveis/erros preservados. Dicas explicam CPF/CNPJ automático e
  telefone com DDD. Placeholder não substitui label. Identidade visual mantida.
- REQ-07: enviar texto formatado, aceito pela API existente; documento incompleto
  ainda pode ser enviado e rejeitado pelas regras atuais, sem política nova de
  bloqueio do formulário. Telefone vazio segue vazio no payload e removível.
- REQ-08: dados válidos numéricos/carregados com ou sem máscara podem ser
  formatados em memória para exibição; nada é persistido ao carregar tela.
  Não truncar dados legados fora do domínio silenciosamente no carregamento:
  preservar texto original visível até edição explícita pelo usuário.
  Após edição explícita aplica política14/11 dígitos. Não alterar outro usuário.
- REQ-09: máscaras não validam dígitos verificadores, não garantem número real
  nem substituem backend. Nenhum algoritmo matemático ou regra nova na API.

## Exemplos sintéticos

| Entrada | Exibição completa |
|---|---|
| 01234567890 | 012.345.678-90 |
| 01234567890123 | 01.234.567/8901-23 |
| 1134567890 | (11) 3456-7890 |
| 11987654321 | (11) 98765-4321 |

Exemplos são strings de teste, não documentos/contatos pessoais. Com11 dígitos
um CNPJ ainda incompleto aparece como CPF; o12º promove automaticamente.
Texto só com letras inserido pelo usuário resulta vazio. Validade de negócio
permanece com a API; máscara não é indicação visual de documento validado.

## Arquitetura e alternativas

Preferir funções puras compartilhadas de máscara e um componente específico
para estes inputs, caso necessário para cursor/teclas, reutilizado nas duas
telas. Campo genérico mantém comportamento dos demais inputs. Estado/payloads
preservam contrato textual; não adicionar biblioteca para dois formatos.
Alternativa manter apenas maxLength não atende pedido de máscaras. Seletor
manual CPF/CNPJ foi descartado em favor da identificação automática solicitada.
DDI, ramal e documento alfanumérico ficam fora do contrato atual.

## Critérios de aceite

- [ ] AC-01: nas duas telas documento aplica CPF/CNPJ progressivo, troca nos
  limites11/12 e preserva zeros iniciais; nenhum texto editado excede14 dígitos.
- [ ] AC-02: telefone alterna fixo/celular nos limites10/11, preserva DDD e
  limita11 dígitos. Limpar segue permitido; dica informa ausência de DDI.
- [ ] AC-03: digitação, paste com/sem máscara, autofill e excesso produzem
  formato consistente; selecionar/substituir/apagar no meio e nas bordas da
  máscara mantém cursor utilizável. Colagem não perde dígitos por limite nativo.
- [ ] AC-04: carregamento válido formata sem gravar; legado fora do domínio
  não é truncado ao abrir. Payload formatado continua aceito e erros da API
  exibidos; remoção de telefone permanece funcional.
- [x] AC-05: testes focados de máscaras/interação, regressões frontend/backend
  e build passam; usuário confirma cadastro e perfil antes de Validado.

## Estratégia de validação e riscos

Tabelas de funções reais para strings vazias/parciais/completas, letras, excesso,
transições, zeros e formatos carregados. Testes de handlers/cursor quando
extraídos; confirmar comportamento no navegador com teclado/paste real e
seleção, pois fill programático não prova digitação. Testar desktop e celular;
inputMode apenas sugere teclado, não impõe validação. Não cadastrar conta real
nem salvar perfil automaticamente; conferência autenticada pelo usuário ou
sessão sintética autorizada. Sem ERP/pedidos ou dados pessoais em evidências.

## Histórico e entrega

v1: proposta apenas maxLength. v2: escopo ampliado por pedido explícito de
máscaras automáticas; substitui v1, inclusive estratégia de limitação nativa.
Atualizar fix.md, relatório, investigação e índice SDD com estado real.
Após aprovação da versão2, preparar plan.md para revisão separada. Nenhum
código/teste/dependência alterado. Commit/push/PR dependem de comando específico.

## Aprovação da revisão

Em2026-10-12 usuário aprovou versão2 com máscaras automáticas. Plano versão1
preparado para revisão separada; aprovação não atribuída à implementação.

## FIX-010 implementado — 2026-10-12

Plano versão1 aprovado com “aprovado” após apresentação nesta sessão. Criados
mascaras.js e CampoComMascara.jsx; integrados documento/telefone em Cadastro
e DadosPessoais de Perfil. CPF/CNPJ automático11/12 dígitos, telefone fixo/
celular10/11, limites14/11, zeros preservados e payload textual formatado.
Sem maxLength nativo que corte colagem prematuramente; máscara limita dígitos.
Campo genérico, API, dependências e schema intactos. Inicialização formata apenas
valores completos no domínio e preserva legado fora do domínio até edição.

26 testes novos de funções reais, incluindo tabelas e todas as posições de
exclusão ao redor da pontuação; frontend79/79, backend89/89 e build63 módulos
passaram; diff --check passou. Primeira execução focada23/24: expectativa de
cursor escrita como14 estava incorreta (fim da saída tem15); corrigida a
asserção após conferir comprimento. Não é RED comportamental do defeito original;
reprodução original vem da confirmação manual/inspeção registrada anteriormente.

Navegador no cadastro: digitação sintética produziu01.234.567/8901-23; telefone
formatado; colagem com máscara e excesso limitada corretamente; exclusão no
meio produziu012.345.678-0 com cursor11. Nenhum cadastro/perfil enviado.
Revisão React: reutilização de componente, handlers compatíveis, sem estado
paralelo do valor; ref de seleção restaurada após render. Labels/erros mantidos.
Estado Implementado. Testes puros não comprovam toda interação: perfil
autenticado/persistência, autofill nativo, teclado virtual, atalhos/desfazer e
composição ainda precisam de conferência. AC-01 a04 parcialmente comprovados
isoladamente/cadastro; AC-05 regressões/build passaram, manual pendente.
Próximo passo: usuário validar nas duas telas digitação, colagem, troca CPF/CNPJ,
fixo/celular, seleção/exclusão no meio e remoção de telefone com salvar/F5.
Sem dados pessoais nos docs. Commit/push/PR aguardam comando específico.

## FIX-010 validado — 2026-10-12

Usuário confirmou “validado, pode abrir o PR” após roteiro das duas telas,
colagem/edição e remoção de telefone. Estado Validado pelo usuário; regressões
79 frontend/89 backend e build registrados acima. Confirmação não equivale
a prova automatizada de autofill/composição/teclado virtual; limitações mantidas.
Commit, push e PR desta unidade autorizados; merge manual pelo usuário.
Registros anteriores de manual/publicação pendentes são históricos.

## Publicação FIX-010 — 2026-10-12

Implementação `cc24f45` publicada em `fix/limites-de-documento-e-telefone`.
PR #16: https://github.com/eduardofrois/kaizen-test/pull/16
Validação manual confirmada. Checks remotos em acompanhamento; merge manual
pendente. Nenhum merge realizado pela IA.
