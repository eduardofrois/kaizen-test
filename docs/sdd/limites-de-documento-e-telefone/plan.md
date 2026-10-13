# Plano — Limites e máscaras de documento e telefone

**Versão:** 1
**Estado:** Implementado e integrado à main; validação manual confirmada pelo usuário em 2026-10-12. Evidências e limites por cenário na matriz e no histórico desta unidade.
**Spec:** [spec.md](spec.md), versão2 aprovada em2026-10-12.
**Objetivo:** formatar e limitar documento/telefone nas duas telas com edição utilizável.
**Arquitetura:** funções puras compartilhadas, CampoComMascara específico e
integração nos quatro campos. Campo genérico e contratos preservados.
**Stack:** React/JSX, JavaScript ESM, node:test e Vite existentes.
**Aprovação para implementar:** 2026-10-12; usuário “aprovado” após este plano versão1.
**Execução:** sequencial nesta sessão, sem subagentes.


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

REQ-01 a09 da spec: CPF até11/CNPJ12–14; telefone fixo até10/celular11; máscaras
progressivas sem pontuação final pendurada; máximos14/11 dígitos, zeros intactos;
sem biblioteca, backend, schema, outros campos ou algoritmo de documento.
Sem DDI/ramal. Entradas novas só dígitos, saída/payload formatados; telefone vazio
permitido. Dados carregados fora do domínio preservados até edição explícita.
Não usar maxLength nativo para truncar colagem antes da interpretação completa.

## Arquivos e interfaces

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Criar | frontend/src/lib/mascaras.js | Formatação, valores iniciais, cursor/exclusão |
| Criar | frontend/src/componentes/CampoComMascara.jsx | Eventos/ref/seleção e Campo existente |
| Alterar | frontend/src/paginas/Cadastro.jsx | Dois campos mascarados |
| Alterar | frontend/src/paginas/Perfil.jsx | Inicialização e dois campos de dados pessoais |
| Criar | frontend/tests/mascaras.test.js | Tabelas de formatos, transições e edição |
| Atualizar | spec/plano, fix.md, RELATORIO.md, docs/investigacao.md, docs/sdd/README.md | Aprovações, resultados e limites |

Interfaces propostas em mascaras.js:

```js
formatarDocumento(valor) // string -> string limitada/formatada
formatarTelefone(valor) // string -> string limitada/formatada
formatarValorInicial(tipo, valor) // 'documento'|'telefone', string|null -> string
ajustarEntrada(tipo, valor, cursor) // -> { valor: string, cursor: number }
apagarNaMascara(tipo, valor, inicio, fim, direcao) // -> { valor, cursor }
```

CampoComMascara recebe tipoMascara, value, onChange e demais props de Campo.
Produz onChange({target:{name,value}}), compatível com handlers mudar existentes.
Não adicionar estado paralelo ao valor do formulário. Demais props/erros/dicas
seguem via Campo, sem alterar Campo genérico.

## Tarefa1 — Funções e provas de edição

**Aceites:** AC-01,02,03,04; interfaces acima.

- [x] Registrar aprovação do plano e conferir Git/diff.
- [ ] Criar testes antes da implementação; import ausente é falha estrutural,
  distinta da reprodução manual do defeito já registrada.
- [x] Tabelas de documento incluem vazio,1/3/4/6/7/9/10/11/12/14/15 dígitos,
  zeros iniciais, formatado, letras misturadas e só letras. Exemplos completos:

```js
assert.equal(formatarDocumento('01234567890'), '012.345.678-90');
assert.equal(formatarDocumento('01234567890123'), '01.234.567/8901-23');
assert.equal(formatarTelefone('1134567890'), '(11) 3456-7890');
assert.equal(formatarTelefone('11987654321'), '(11) 98765-4321');
```

- [x] Telefone: vazio,1/2/3/6/7/10/11/12 dígitos, entrada formatada e letras;
  saída parcial sugerida:1='(1',2='(11',3='(11) 3'. Delimitador só quando
  existe próximo grupo; nenhum hífen/ponto final pendurado.
- [x] Implementar formatação por grupos da string de dígitos. Sanitização
  String(valor??'').replace(/\D/g,'').slice(0,limite), sem Number. Documento
  escolhe grupos3,3,3,2 ou2,3,3,4,2. Telefone DDD2+assinante4/5+final4.
- [x] Inicialização: null/vazio vira vazio; aceitar apenas dígitos/pontuação
  convencional (. / - espaços para documento; parênteses/-/espaços para telefone)
  e quantidade exata11/14 ou10/11 para formatar. Texto com letras, +, excesso ou
  incompleto permanece original, sem truncamento ao abrir. Testar cada caso.
- [x] ajustarEntrada conta dígitos antes do cursor bruto, formata texto inteiro,
  mapeia posição pelo mesmo número de dígitos na saída, limitada aos presentes.
  Com0 dígitos anteriores retorna0; após último retorna fim. Testar inserção
  no meio, troca11/12 e10/11, excesso, colagem e substituição de seleção.
- [x] apagarNaMascara converte seleção em intervalo lógico de dígitos; seleção
  remove dígitos cobertos. Sem seleção, Backspace remove anterior ao cursor e
  Delete remove próximo, saltando pontuação. Reformata e reposiciona no índice
  lógico da exclusão. Nos extremos sem dígito é no-op. Testar ao redor de cada
  delimitador, seleção apenas de pontuação, seleção total e texto vazio.
- [x] Executar `node --test tests/mascaras.test.js` em frontend/ até GREEN.
  Testes verificam resultados observáveis, não replicam implementação.

## Tarefa2 — Componente e integração

**Aceites:** AC-01 a04. Consome funções puras e Campo existente.

- [x] Criar CampoComMascara com useRef do input e uma ref de seleção pendente.
  Renderizar input como children de Campo; manter classes equivalentes ao input
  existente, id/name, aria-invalid/aria-describedby conforme erro. Dica só
  exibida sem erro; manter label associado. Passar type text/tel e inputMode=numeric.
- [x] Em onChange ler value/selectionStart do input, chamar ajustarEntrada,
  publicar evento compatível e guardar cursor. Restaurar seleção em useLayoutEffect
  após valor atualizado. Se saída igual ao value anterior, restaurar seleção
  imediatamente no input (React pode não renderizar). Não forçar foco ao montar.
- [x] Interceptar Backspace/Delete sem Ctrl/Alt/Meta via onKeyDown, usar seleção
  atual e apagarNaMascara, preventDefault apenas nessa operação. Manter atalhos
  copiar/colar/selecionar/desfazer e movimentação de teclado. Não interceptar
  composição ativa; aplicar formatação ao terminar composição pelo fluxo de change.
  Conferir exclusão por teclado virtual no navegador: onChange também deve
  reconhecer exclusão que remove apenas pontuação via inputType e valor anterior,
  encaminhando à exclusão lógica quando os dígitos ficariam inalterados.
- [x] Colagem e autofill entram pelo change sem limite HTML prévio. Se dados
  carregados são legados fora do domínio, só normalizar após edição explícita;
  nunca executar onChange no mount. Seleção inicial usa valor visível completo.
- [x] Cadastro troca somente documento/telefone por CampoComMascara; mantém
  mudar/enviar/CAMPOS. Adicionar dicas de formato automático e DDD sem código
  de país. Estado inicial vazio preservado; handlers recebem texto formatado.
- [x] DadosPessoais inicializa documento/telefone com formatarValorInicial e
  troca os dois campos por componente específico. Nenhum setUsuario/save no
  carregamento. TrocarSenha/Enderecos permanecem intactos. Telefone vazio ainda
  passa por salvar(formulario) e pela regra de remoção existente.
- [x] Conferir props acessíveis/semântica e identidade visual; aplicar checklist
  React disponível sem refatoração de estado fora do escopo.

## Tarefa3 — Navegador, regressões e entrega

**Aceites:** AC-03 a05. Provas puras não substituem cursor e teclado reais.

- [ ] No cadastro, usar dados sintéticos sem enviar: digitar CPF, continuar até
  CNPJ, voltar por Backspace, colar completo com/sem máscara, excesso e letras.
  Telefone: fixo->celular->fixo, limpar e reescrever. Verificar string e seleção.
- [ ] Selecionar parte no meio, digitar e colar; Backspace/Delete junto a ponto,
  barra, hífen e parênteses. Verificar cursor lógico, campo não travado e limites
  de dígitos. Testar seletor total, Tab, foco visível, atalhos e autofill quando
  disponível. Não afirmar autofill nativo verificado se apenas simulado.
- [ ] Conferir em desktop e viewport móvel de375px; teclado virtual real será
  confirmação do usuário se ferramenta de emulação não o fornecer. Perfil
  autenticado e persistência de remoção dependem de conferência pelo usuário
  ou sessão de teste autorizada; não modificar conta real automaticamente.
- [ ] Conferir que formulário envia formato exibido e backend mantém erros
  atuais para incompletos. Usar inspeção/validador real isolado para compatibilidade;
  não cadastrar conta/alterar perfil/ERP real automaticamente.
- [x] Executar npm test em frontend/ e backend/; npm run build em frontend/;
  git diff --check. Registrar contagens reais e baseline, sem presumir PR13
  integrado. Revisar diff e conteúdo completo para segredos/artefatos.
- [x] Atualizar documentos com aprovação, testes, limitações, estado Implementado
  e pendências manuais; marcar aceites apenas quando comprovados.
- [x] Usuário valida cadastro/perfil e telefone removível, edição e colagem;
  registrar confirmação antes de Validado. Sem copiar dados pessoais aos docs.
- [x] Somente após comando específico: commit `fix: aplica mascaras a documento
  e telefone`, push da branch e PR para main; acompanhar checks. Merge manual.

## Matriz de validação

| Aceite | Prova | Esperado | Observado |
|---|---|---|---|
| AC-01 | Tabelas e navegador, duas telas | CPF/CNPJ automático e limite14 | Testes de funções e cadastro no navegador passaram; manual das duas telas confirmado |
| AC-02 | Tabelas e navegador | Fixo/celular, vazio e limite11 | Testes de funções passaram; vazio/remoção e manual confirmados |
| AC-03 | Cursor/seleção/teclas/paste | Edição sem travar ou cortar prematuramente | Exclusões em todas as posições testadas; colagem/edição manual confirmadas; IME/autofill sem prova individual |
| AC-04 | Inicialização/contrato/manual | Legado preservado e remoção funcional | Inicialização/legado cobertos por testes; remoção com salvar/F5 confirmada pelo usuário |
| AC-05 | Suítes/build/confirmação | Sem regressão e manual registrado | Frontend79/backend89/build63 passaram na etapa; manual confirmado |

## Recuperação e autorrevisão

Sem migração. Nada gravado ao montar; alteração só persiste por envio explícito.
Reversão por commit quando autorizada, sem reset. Tarefa1 cobre domínio/cursor,
tarefa2 cobre integração/acessibilidade e tarefa3 cobre prova visual/contratos.
REQ-01 a09 mapeados; nenhuma dependência nova ou alteração backend.
Plano versão1 aguarda aprovação; execução permanece não autorizada.

Nota de execução: testes foram escritos junto à primeira versão das funções,
não antes. Não foi registrado RED estrutural nem alegado TDD completo.

## Histórico — FIX-010 implementado — 2026-10-12

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

## Histórico — FIX-010 validado — 2026-10-12

Usuário confirmou “validado, pode abrir o PR” após roteiro das duas telas,
colagem/edição e remoção de telefone. Estado Validado pelo usuário; regressões
79 frontend/89 backend e build registrados acima. Confirmação não equivale
a prova automatizada de autofill/composição/teclado virtual; limitações mantidas.
Commit, push e PR desta unidade autorizados; merge manual pelo usuário.
Registros anteriores de manual/publicação pendentes são históricos.

## Histórico — Publicação FIX-010 — 2026-10-12

Implementação `cc24f45` publicada em `fix/limites-de-documento-e-telefone`.
PR #16: https://github.com/eduardofrois/kaizen-test/pull/16
Validação manual confirmada. Checks remotos em acompanhamento; merge manual
pendente. Nenhum merge realizado pela IA.
