# Relatório de entrega

**Estado:** investigação e primeira correção concluídas; trabalho em andamento.

**Última atualização:** 2026-10-11.

**Autor:** pendente de informação.

**Data de entrega:** pendente de definição.

**Tempo aproximado dedicado:** pendente de registro pelo usuário.

Esta versão registra o que foi encontrado e verificado até agora. A
configuração por ambiente (FIX-001) foi corrigida e validada com testes
automatizados e verificações manuais locais pelo usuário. Demais correções,
múltiplos carrinhos, validação dos demais fluxos e deploy estão pendentes. A análise partiu da baseline original `81897d5`.

---

## 1. Subindo o projeto

A aplicação ainda não foi colocada no ar. Foram lidos os requisitos,
arquitetura, código, dependências e configuração. As dependências do backend foram instaladas com `npm ci` (120 pacotes;
auditoria informou zero vulnerabilidades nessa execução). Foi criado
`backend/.env` local, ignorado pelo Git, com os três campos obrigatórios vazios
para preenchimento pelo usuário, que depois informou tê-los configurado e
iniciado os servidores com sucesso. Build frontend validado posteriormente pela unidade CI-001; deploy pendente.

O repositório próprio foi inicializado em
[eduardofrois/kaizen-test](https://github.com/eduardofrois/kaizen-test), com
histórico independente e backup local do Git original. Os commits `0b75868`
e `6307deb` publicaram a documentação inicial e sua organização. O enunciado do
teste foi preservado, com atualização das instruções de ambiente. A aplicação
permanece local, sem novo push nesta etapa. A remoção dos segredos foi aprovada
e executada na branch `codex/configuracao-por-ambiente`; o histórico original
com credenciais não integra o novo repositório.

Pontos de configuração identificados: o README citava `SIAC_URL` e foi corrigido
para `ERP_URL`; o proxy Vite aponta para backend :3001; os requisitos de Node
do frontend são mais específicos que o >=20 declarado pelo backend. O
ambiente local consultado tem Node v24.14.1 e npm 11.11.0. Execução local confirmada pelo usuário,
com catálogo, login, persistência da sessão e logout funcionando.

Arquivos criados para organizar o trabalho:

- `.gitignore`, com regras para ambiente, dependências, build e SQLite local.
- `AGENTS.md`, com instruções e aprovação obrigatória antes de implementar.
- `fix.md`, com inventário detalhado de problemas e investigação.
- `docs/ai/arch.md` e `boundaries.md`, com arquitetura real e limites.
- `docs/investigacao.md` e `docs/ambiente.md`.
- Fluxo e modelos em `docs/sdd/`.
- Spec e plano aprovados e executados em `docs/sdd/configuracao-por-ambiente/`.

O procedimento de instalação/execução está descrito como previsto em
[docs/ambiente.md](docs/ambiente.md); será atualizado com resultados reais.

---

## 2. Chamados reportados

As causas dos quatro chamados foram localizadas. KZN-312 foi corrigido e
validado automaticamente, manualmente pelo usuário e pelos checks do PR #3.
Os demais chamados continuam sem correção.

### KZN-312 — Total do carrinho vem maior que a soma das peças

| Campo | Registro |
|---|---|
| **Causa** | lerCarrinho somava subtotais de linhas indisponíveis. A pendência bloqueava o checkout, mas não excluía seu valor da soma. |
| **Como reproduzi** | Cenário isolado: R$20 disponíveis + três unidades sem estoque de R$228 retornavam R$704, excesso de R$684. Usuário também confirmou reprodução pela interface com item que perdeu estoque enquanto permanecia no carrinho. |
| **Arquivos alterados** | backend/src/services/carrinhoService.js (apenas condição do redutor), backend/tests/carrinho-total.test.js e documentação. |
| **Correção** | Somar somente linhas com disponivel=true; manter dados, quantidades e subtotais referenciais, sem compra parcial e sem liberar checkout com pendências. Spec/plan versão 1 aprovados em 2026-10-11. |
| **Como validei** | RED: seis falhas/cinco sucessos nos onze novos testes. GREEN: npm test com 17 sucessos; schema real em SQLite :memory:, fetch simulado e env/cwd isolados. Cobertos estoque, inativo, 404/500, vazio, isolamento de usuários, releitura e rejeição de checkout sem POST. Sintaxe e diff passaram. Usuário confirmou funcionamento e ambos os checks do PR #3 passaram. |

FIX-003 (perda de centavos) é outra causa e continua pendente. Não foi alterado
nesta unidade, assim como o contador KZN-318. Nota KZN-7F3A preservada.

### KZN-318 — Número no ícone do carrinho está errado

| Campo | Registro |
|---|---|
| **Causa** | O backend preenche `quantidade_pecas` com `itens.length`, contando produtos distintos, em vez de somar suas quantidades. Cabeçalho e resumo consomem esse campo. |
| **Como reproduzi** | Na verificação isolada, duas linhas com quantidades 2 e 3 retornaram `quantidade_pecas: 2`, embora houvesse cinco unidades. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. Causa em `backend/src/services/carrinhoService.js`, `lerCarrinho()`. |
| **Como validei a correção** | Pendente: validar soma de unidades e regressões dos consumidores após aprovação e implementação. |

### KZN-325 — Busca diz que não encontrou peça que existe

| Campo | Registro |
|---|---|
| **Causa** | A busca preserva a página anterior ao mudar o termo. Troca de categoria, disponibilidade e limpeza da busca também mantêm a página. O novo conjunto de resultados pode não ter essa página. |
| **Como reproduzi** | Executei a função de pesquisa extraída do componente, partindo de `?pagina=2`. Pesquisar amortecedor gerou `/?pagina=2&busca=amortecedor`. A resposta real do catálogo ainda precisa de reprodução integrada. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. Causas em `frontend/src/componentes/Cabecalho.jsx`, `pesquisar()`, e `frontend/src/paginas/Catalogo.jsx`, `trocarParametro()`. |
| **Como validei a correção** | Pendente: conferir reinício da página em mudanças de filtros, preservação dos filtros válidos e navegação pelo histórico. |

### KZN-331 — Pedido saiu com o endereço errado

| Campo | Registro |
|---|---|
| **Causa** | A tela mantém o endereço escolhido em `enderecoId`, mas `finalizar()` ignora esse estado e envia o principal, ou o primeiro da lista. |
| **Como reproduzi** | Executei a função frontend em memória com duas opções: endereço 1 principal, endereço 2 selecionado. O payload enviado à API simulada continha `endereco_id: 1`. Nenhum pedido foi criado no SIAC. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. Causa em `frontend/src/paginas/Checkout.jsx`, `finalizar()`. |
| **Como validei a correção** | Pendente: validar envio da seleção, criação de endereço no checkout, posse no backend e snapshot preservado após edição posterior do endereço. |

---

## 3. Problemas que encontrei por conta própria

O inventário detalhado, com passos de reprodução e propostas de aceite, está
em [fix.md](fix.md). Os IDs FIX/INV são referências internas desta investigação.
Não há suposição de que o teste contenha exatamente sete problemas extras.

### Problema 1 — Segredos literais e configuração com fallback (FIX-001)

| Campo | Registro |
|---|---|
| **O que estava errado** | Segredo JWT e token ERP literais eram usados quando a env faltava, contornando a intenção de fail-fast. ERP_URL também recebia padrão externo. |
| **Como cheguei nele** | Leitura de config.js (nota KZN-2B9C), comparação com exemplo/documentação e regressão em subprocessos isolados. Antes da correção: cinco falhas e um sucesso. |
| **Impacto** | Exposição do segredo usado pode comprometer assinaturas de sessão e a credencial ERP. Não testei validade das credenciais nem exploração de contas reais. |
| **Corrigi?** | Sim, após aprovação explícita de spec/plan em 2026-10-11. Removi literais/fallbacks; exigi JWT_SEGREDO, ERP_URL e ERP_TOKEN; rejeitei placeholders, JWT curto e URL inválida sem ecoar valores. Defaults operacionais e contratos foram preservados. Revogação externa não foi realizada. |
| **Arquivos alterados** | backend/src/config.js, backend/tests/config.test.js, backend/.env.example, README.md e registros documentais. backend/.env criado somente localmente, sem credenciais preenchidas. |
| **Validação** | `node --test tests/config.test.js`: seis testes passaram após a correção. `node --check backend/src/config.js`: passou. Processos com env sintética e diretório temporário, sem .env do usuário, rede ERP ou banco. Complemento manual pelo usuário: catálogo, login, refresh de sessão, logout e rejeição de JWT_SEGREDO vazio confirmados. Checkout não testado. |

### Problema 2 — CORS aceita qualquer origem com credenciais (FIX-002)

| Campo | Registro |
|---|---|
| **O que está errado** | `cors({ origin: true, credentials: true })` reflete origens arbitrárias; `CORS_ORIGEM` existe na configuração, mas não é aplicado. |
| **Como cheguei nele** | Segui a variável de ambiente até `backend/src/app.js` e comparei com o proxy/mesma origem previstos. Evidência estática. |
| **Impacto** | Política de acesso entre origens permissiva. A exploração autenticada depende também de cookies, SameSite e ambiente; não foi demonstrada em navegador. |
| **Corrigi?** | Não. A política de origens e sua validação precisam de spec/plano aprovados. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Problema 3 — Conversão monetária perde centavos (FIX-003)

| Campo | Registro |
|---|---|
| **O que está errado** | `paraCentavos()` usa `Math.floor(Number(reais) * 100)`, truncando aproximações de ponto flutuante. |
| **Como cheguei nele** | Executei a função original de `backend/src/lib/dinheiro.js`: 1.15 virou 114 centavos, 4.10 virou 409 e 19.99 virou 1998. |
| **Impacto** | Subtotais, totais do carrinho e valor local do pedido podem divergir do valor correto/ERP. |
| **Corrigi?** | Sim. Math.round na conversão compartilhada; domínio aprovado de até duas casas. 35 testes backend e 37 frontend passaram. Históricos preservados. |
| **Arquivos alterados** | backend/src/lib/dinheiro.js; testes dinheiro, carrinho-total e pedido-dinheiro; documentos SDD e registros. |

### Problema 4 — Última página bloqueada pela paginação (FIX-004)

| Campo | Registro |
|---|---|
| **O que está errado** | O botão Próxima usa `pagina >= totalPaginas - 1`, antecipando o bloqueio. |
| **Como cheguei nele** | Executei a expressão original de `frontend/src/componentes/ui.jsx`: página 1 de 2 e página 2 de 3 já retornam desabilitado. |
| **Impacto** | Última página do catálogo e dos pedidos não pode ser alcançada pelo botão normal. |
| **Corrigi?** | Sim. Limite corrigido por SDD aprovado; nove testes focados passaram. Validação manual pendente. |
| **Arquivos alterados** | frontend/src/componentes/ui.jsx, frontend/tests/paginacao.test.js e documentos. |

### Problema 5 — Carrinho não acompanha autenticação (FIX-005)

| Campo | Registro |
|---|---|
| **O que está errado** | O provider carrega uma vez e não observa login, logout ou identidade do usuário. Respostas em andamento também não são invalidadas por troca de identidade. |
| **Como cheguei nele** | Leitura de `CarrinhoContext.jsx`, `AuthContext.jsx` e montagem em `main.jsx`. Usuário confirmou manualmente que o carrinho de X permanece visível após sair e entrar em Y, até F5. |
| **Impacto** | Interface pode continuar vazia após login ou mostrar conteúdo residual da conta anterior. As consultas do backend continuam filtradas por usuário; não foi demonstrado vazamento pela API. |
| **Corrigi?** | Não. Ciclo da sessão, estados de erro e respostas antigas precisam de spec/plano. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Problema 6 — Estoque reduzido impede ajuste de quantidade (FIX-006)

| Campo | Registro |
|---|---|
| **O que está errado** | A UI desabilita quantidade para qualquer item indisponível, incluindo aquele cuja quantidade apenas excedeu o estoque restante. |
| **Como cheguei nele** | Comparei `LinhaItem()` em `Carrinho.jsx` com a definição de disponibilidade em `carrinhoService.js`. Inspeção estática e reprodução no frontend confirmada pelo usuário. |
| **Impacto** | Se o estoque cair de cinco para três, o usuário não consegue reduzir para três pelo campo, embora a tela peça ajuste. |
| **Corrigi?** | Sim. Capacidade quantidade_editavel no backend e input com limites; regressões passaram. Manual da correção pendente. |
| **Arquivos alterados** | carrinhoService.js, Carrinho.jsx, LinhaItemCarrinho.jsx, testes backend/frontend e documentos. |

### Problema 7 — Telefone opcional não pode ser removido (FIX-007)

| Campo | Registro |
|---|---|
| **O que está errado** | `atualizarPerfil()` usa `telefone || atual.telefone`, mantendo o valor antigo quando a validação produz null para limpeza do campo. |
| **Como cheguei nele** | Executei o serviço com banco simulado: enviei telefone=null e o argumento do UPDATE continuou com o número anterior. |
| **Impacto** | Usuário não consegue apagar contato, apesar do campo opcional e de uma resposta de salvamento. |
| **Corrigi?** | Sim. Rota distingue omissão e serviço permite null explícito; 21 testes novos passaram. Manual pendente. |
| **Arquivos alterados** | backend/src/routes/perfil.js, backend/src/services/usuarioService.js, backend/tests/perfil-telefone.test.js e documentos. |

### Problema 8 — Senhas têm tratamento inconsistente de espaços (FIX-008)

| Campo | Registro |
|---|---|
| **O que está errado** | Cadastro/nova senha preservam espaços; login e senha atual do perfil passam por validação que aplica trim. |
| **Como cheguei nele** | Comparei validadores das rotas e executei as funções reais de hash/verificação com entrada sintética: versão original confere; versão com trim falha. |
| **Impacto** | Uma senha aceita na criação pode não autenticar com a mesma entrada; a troca de senha atual também pode falhar. |
| **Corrigi?** | Não. Política consistente de credenciais e regressões aguardam SDD; hashes existentes devem ser preservados. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Problema 9 — Restrições de layout em telas pequenas (FIX-009)

| Campo | Registro |
|---|---|
| **O que está errado** | Cabeçalho exige busca com mínimo de 380px junto de logo/menu; grade fixa quatro colunas sem breakpoints. |
| **Como cheguei nele** | Leitura de `Cabecalho.jsx` e `Catalogo.jsx`. Reprodução como visitante confirmou página de 702px numa área útil reportada de 341px, com busca de 380px e cards comprimidos. |
| **Impacto** | Risco de overflow e conteúdo comprimido no celular, relevante para o carrinho visível na vitrine. Extensão do efeito visual ainda precisa ser medida. |
| **Corrigi?** | Sim. Cabeçalho e grade responsivos por SDD aprovado; sete larguras como visitante sem overflow. Validação manual confirmada pelo usuário em 2026-10-12; matriz autenticada completa não executada pela IA. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Pontos adicionais em investigação

Nenhum destes pontos foi corrigido. O detalhamento está em `fix.md`.

| Referência | Evidência e dúvida pendente | Impacto a avaliar |
|---|---|---|
| **INV-001 — Checkout concorrente/repetição** | Duas finalizações simultâneas com ERP simulado geraram duas chamadas de criação e dois vínculos. Falta verificar contrato real de idempotência/recuperação após timeout. | Duplicação de pedidos; a simulação comprova o caminho local, não o comportamento real do SIAC. |
| **INV-002 — Alteração durante checkout** | Código lê snapshot, aguarda ERP e depois apaga todo o carrinho. Interleaving ainda não reproduzido. | Itens adicionados/alterados durante a espera podem desaparecer sem participar do pedido. |
| **INV-003 — Endereço sem principal** | Edição permite desmarcar o único principal sem promover outro. | Decidir se nenhum principal é permitido ou se deve existir exatamente um quando há endereços. |
| **INV-004 — Erro persistente nas telas de pedidos** | Nova consulta/sucesso não limpa erro anterior; evidência estática. | Resposta bem-sucedida pode continuar escondida pelo alerta no mesmo componente montado. |
| **INV-005 — Busca do cabeçalho fora de sincronia** | Input lê URL só na inicialização; reprodução com histórico pendente. | Voltar/avançar ou limpar busca pode manter termo antigo no campo. |

---

## 4. Múltiplos carrinhos

### Como ficou

Ainda não implementado. O requisito inclui criar, nomear, selecionar e remover
carrinhos isolados, editar o ativo dentro da vitrine sem perder busca/navegação
e fechar um carrinho por checkout. A spec e o plano da funcionalidade ainda
serão preparados para aprovação.

### Modelagem

Nenhuma tabela, coluna ou relação foi alterada. Hoje `carrinho_itens` identifica
itens por usuário, com unicidade em `(usuario_id, codigo_produto)`. Não existe
entidade de carrinho. Uma migração futura deverá preservar os itens existentes.

Não há endpoints novos nem alterações de contrato implementadas. Rotas e
payloads serão definidos na spec/plano da funcionalidade.

### Decisões que o enunciado deixou abertas

| Pergunta | Sua decisão | Motivo/situação |
|---|---|---|
| Quantos carrinhos por pessoa? Tem limite? | Pendente. | Limite será definido e justificado na spec. |
| O que acontece ao apagar o carrinho ativo? | Pendente. | Definir seleção substituta e exclusão do último carrinho. |
| Como o carrinho aparece na vitrine? | Pendente. | Definir interação sem perda de busca, filtros ou navegação. |
| E no celular? | Pendente. | Definir apresentação e acesso às ações em pouco espaço. |
| Qual carrinho vem selecionado ao entrar? | Pendente. | Definir persistência e comportamento entre sessões/abas. |
| O que acontece com os carrinhos após fechar um pedido? | Pendente. | Definir preservação do nome/conteúdo e alterações concorrentes. |

Há sugestões iniciais em [docs/ai/arch.md](docs/ai/arch.md), ainda não
aprovadas como decisões de produto.

### Isolamento

O backend atual exige sessão e filtra dados privados por `usuario_id`.
Múltiplos carrinhos deverá validar também a posse do carrinho e o vínculo dos
itens em toda operação. Essa garantia nova ainda não foi implementada nem testada.

---

## 5. Como testei

### Inspeção e verificações realizadas

- Leitura dos três documentos originais, dos 45 arquivos em backend/src e
  frontend/src, manifests/lockfiles, script de banco e trechos do build existente.
- Busca por notas de revisão nos arquivos textuais do checkout: três notas.
- Consulta SQLite em modo somente leitura/imutável: integrity check ok e
  zero registros nas quatro tabelas de negócio da baseline.
- Scripts transitórios em memória executaram funções/expressões originais,
  com dependências simuladas quando necessário: total/contador, URL de busca,
  endereço enviado, conversão monetária, paginação, limpeza do telefone e
  conferência de senha. Resultados estão nas seções 2 e 3.
- Simulação de duas finalizações simultâneas, com ERP aceitando ambas, para
  identificar o caminho sem proteção local de duplicidade.
- Revisão de links, blocos Markdown, sintaxe dos exemplos JavaScript completos
  do plano e regras do .gitignore. Revisão dos arquivos preparados para Git
  não encontrou os valores secretos originais. Push documental conferido no remoto.

### Limitações da validação

O usuário validou manualmente catálogo, login, refresh de sessão e logout
no navegador e rejeição de JWT_SEGREDO vazio no terminal. Não houve execução
real do checkout, auditoria visual completa ou deploy. O build frontend foi
validado posteriormente na unidade CI-001. As simulações não comprovam o contrato
real do SIAC. Nenhum pedido real foi criado e nenhum dado de negócio foi alterado.

Foi adicionada a suíte `backend/tests/config.test.js`. Em `backend/`, executar
`node --test tests/config.test.js`: RED de cinco falhas/um sucesso na baseline;
GREEN de seis sucessos após a correção. Cobre ausência/vazio das três variáveis,
placeholders/segredo curto, URL inválida sem exposição e contrato válido.
A checagem de sintaxe de config.js passou. Os scripts da investigação dos
outros problemas continuam transitórios; não representam testes integrados.

---

## 6. Decisões e suposições

- Adotei SDD com spec.md, plan.md e aprovação explícita antes de cada
  implementação. Aprovação documental não aprova mudança de aplicação.
- Organizei contexto de IA, arquitetura real, limites, decisões e investigação
  em documentos separados. Pastas e branches recebem nomes descritivos.
- Iniciei histórico próprio e preservei localmente o Git original. A primeira
  publicação inclui documentação; código sanitizado preparado na branch da correção; publicação nova pendente.
- Distingo evidência estática, verificação isolada, teste integrado e hipótese.
  Não assumi que os problemas extras são exatamente sete.
- Preservei o SIAC como fonte de catálogo, preço, estoque e pedidos. Falhas e
  limitações da integração precisam ser tratadas deste lado do sistema.

O fallback de segredos foi removido para cumprir o fail-fast documentado.
Ainda há divergências em CORS versus mesma origem e provider do carrinho
versus dependência da autenticação. Propostas de correção estão no inventário;
nenhum padrão foi substituído por preferência pessoal nesta etapa.

As escolhas de produto de múltiplos carrinhos e a política do endereço
principal continuam pendentes. Não foram assumidas como decisões concluídas.

---

## 7. O que faria com mais tempo

Lista provisória de evoluções além do trabalho obrigatório. Será revisada
conforme a implementação e os riscos remanescentes forem conhecidos.

1. Fortalecer recuperação/reconciliação de checkout quando o ERP cria pedido
   e a resposta ou gravação local falha; avaliar contrato de idempotência sem
   prometer transação distribuída que a integração atual não oferece.
2. Ampliar regressões de autenticação, posse de dados, migração e concorrência,
   com ERP simulado e banco isolado, conforme os fluxos implementados.
3. Medir custo das consultas individuais ao ERP e refinar acessibilidade e
   uso em dispositivos pequenos após validar a funcionalidade obrigatória.

Isso ainda não define itens deixados de fora da entrega. As limitações já
assumidas pelo projeto estão em ARQUITETURA.md; não são descobertas inéditas.

---

## 8. Outras observações

Notas de revisão encontradas por leitura do código e busca no checkout:

| Identificador | Local na baseline original |
|---|---|
| **KZN-2B9C** | `backend/src/config.js:8` — configuração e defaults. |
| **KZN-7F3A** | `backend/src/services/carrinhoService.js:73` — leitura e resumo do carrinho. |
| **KZN-5D1E** | `frontend/src/componentes/Cabecalho.jsx:22` — cabeçalho, busca e contador. |

As três pedem citação no resumo de entrega. Foram registradas como evidência
de leitura, sem inferir que cada nota representa apenas um bug.

A investigação e a documentação tiveram apoio de IA, conforme permitido
pelo teste. As decisões de implementação continuam sujeitas à revisão do
usuário. Este relatório será atualizado com causas, mudanças e provas
efetivamente realizadas ao longo do trabalho.

### Atualização de preparação local — 2026-10-11

O usuário informou que preencheu backend/.env. As dependências foram
instaladas pelos lockfiles com npm ci: backend 120 pacotes e frontend 82.
Auditorias npm informaram zero vulnerabilidades nessa execução. Nenhum
manifest/lockfile foi alterado. Servidores e integração real não foram
iniciados nesta etapa; instruções de execução local entregues ao usuário.

### Validação manual e novo achado — 2026-10-11

O usuário informou que iniciou o projeto local com sucesso, conseguiu
logar e visualizar as peças. A captura da vitrine mostra catálogo carregado
e navegação de usuário autenticado. Evidência fornecida pelo usuário;
não equivale a teste completo de sessão, checkout ou credencial inválida.
Persistência após atualizar a página, logout e execução com JWT_SEGREDO
vazio foram confirmados posteriormente, conforme registro abaixo.

Novo achado FIX-010: cadastro permite digitar/colar documento e telefone
acima dos limites; após envio, a API rejeita com máximo de 18 e 20 caracteres,
respectivamente. Confirmada ausência de maxLength em Cadastro.jsx; mesmo
padrão observado estaticamente em Perfil.jsx. É uma melhoria de prevenção e
feedback na interface, mantendo validação no servidor. Não foi implementada;
exige spec/plan e aprovação própria. Detalhamento em fix.md. Dados pessoais
das capturas não foram copiados para a documentação.

### Confirmação manual da configuração — 2026-10-11

Evidência informada pelo usuário: login, catálogo, persistência da sessão
após atualizar a página e logout funcionaram localmente. Ao executar
`JWT_SEGREDO= npm start` em backend/, o processo encerrou com
`Configuracao invalida: JWT_SEGREDO nao definido. Rode: npm run segredo:gerar`.
Fail-fast manual confirmado, sem alterar .env. Os seis testes automatizados
já haviam passado. Não foi executado checkout real; este registro não
comprova os demais fluxos do sistema. Implementação registrada no commit c46e68e. Validação concluída para o
escopo aprovado; resultados consolidados neste commit documental complementar.
Nenhuma nova alteração de aplicação realizada; publicação remota pendente.

## Integração e publicação — 2026-10-11

Por autorização do usuário, branch configuracao-por-ambiente integrada na
main pelo merge f913cda, sem conflitos. Push para eduardofrois/kaizen-test
concluído: remoto confirmou main de 6307deb para f913cda. Branch local
codex/configuracao-por-ambiente preservada. Os registros anteriores de push
pendente descrevem a etapa anterior e estão superados por esta atualização.
.env e arquivos gerados não foram enviados. Publicação do código no GitHub
não representa deploy da aplicação.

## Preparação de CI — 2026-10-11

Preparados spec e plano de pipeline GitHub Actions com dois checks propostos:
testes do backend e build do frontend. A main remota inclui o merge manual
do PR #1. Branch de trabalho: ci/pipeline-de-validacao. Implementação e
execução da CI aguardam aprovação SDD; não há workflow criado nesta etapa.
Não foram adicionados testes de negócio nem declarada cobertura dos chamados.

## Implementação da CI — 2026-10-11

Após aprovação SDD versão 1, criado .github/workflows/validacao.yml e script
npm test no backend. Dois jobs independentes: testes-backend e build-frontend,
Node 24.14.1/ubuntu-24.04, npm ci/cache pelos lockfiles, timeout de 10 minutos
e permissões somente de leitura. PRs para main e push na main disparam checks;
execuções antigas do mesmo PR/ref são canceladas. Sem secrets, ERP ou banco real.

Validação local em cópia temporária para preservar servidores e dados do
usuário: npm ci em ambos os projetos, seis testes passaram, build transformou
58 módulos e gerou dist/index.html. Nenhum lockfile foi alterado. YAML analisado
e diff conferido. Não foi adicionada suíte frontend; build comprova compilação.
Usuário autorizou abrir PR para validar GitHub Actions. Execução remota e
push/main após merge do usuário ainda pendentes nesta etapa; estado SDD
Implementado, sem declarar validação remota ou proteção configurada.

## Primeira execução remota — PR #2

PR: https://github.com/eduardofrois/kaizen-test/pull/2
Execução pull_request/opened concluída com success:
https://github.com/eduardofrois/kaizen-test/actions/runs/38172181159
SHA: 820bc9593a34a31ce49d1a63fcc2b457bd9728dc.
Jobs testes-backend e build-frontend passaram em Ubuntu 24.04/Node 24.14.1.
Logs confirmam npm ci em ambos, seis testes sem falhas e build de 58 módulos.
Frontend instalou 85 pacotes no Linux (82 na validação local macOS), sem
alteração de lockfile. Não houve credenciais reais, servidor ou ERP na CI.
Ainda falta confirmar synchronize após novo push documental e push/main
após merge manual do usuário. Proteção da main não foi alterada.

## Validação do PR concluída — aguardando merge manual

Novo push documental (10420ad) disparou pull_request/synchronize e ambos os
jobs passaram novamente: run 38172264955, SHA
10420adcd74f5b5c8eecf71274b7c6e636de38b1.
Evidência: https://github.com/eduardofrois/kaizen-test/actions/runs/38172264955
AC-01 confirmado por opened e synchronize; checks testes-backend e
build-frontend reais e bem-sucedidos, disponíveis para proteção da main.
Pendente apenas AC-02 e a etapa correspondente do plano: executar e observar
push/main após merge manual do usuário no PR #2. Não declarar estado
Validado global até obter essa evidência. Registro atual supera as pendências
remotas descritas nas etapas anteriores; merge/deploy/proteção não realizados.

## Preparação de KZN-312 — Total do carrinho

Em 2026-10-11, após confirmar a pipeline em PR/main, preparada unidade SDD
versão 1 total-do-carrinho na branch fix/total-do-carrinho. Proposta: excluir
linhas indisponíveis do total do resumo, preservando linhas, quantidades,
subtotais de referência e bloqueio de checkout. Causa localizada no redutor
de lerCarrinho; nota KZN-7F3A preservada. Nenhum código corrigido nesta etapa.
Plano prevê onze testes do serviço com SQLite em memória/ERP simulado,
RED antes da alteração e GREEN depois. Precisão monetária FIX-003 e contador
KZN-318 permanecem pendentes, com SDD próprio. Aprovação para implementar
esta proposta ainda não foi dada; nenhum resultado novo de teste é declarado.

## KZN-312 implementado e FIX-005 confirmado — 2026-10-11

Aprovação de implementação: “Consegui recriar, perfeito. Docs aprovados.”
KZN-312 corrigido conforme SDD versão 1 e 17 testes passaram. O usuário vai
validar a correção localmente e pediu aguardar seu comando para abrir PR.
Nenhum PR/merge realizado nesta unidade. Status SDD: Implementado, checks
remotos e validação manual pós-correção pendentes.

Novo retorno sobre achado existente FIX-005: sair de X e entrar em Y manteve
o carrinho de X na interface até F5. Registrado como confirmação manual, sem
inferir vazamento pela API. Correção permanece separada, sem aprovação SDD.

## Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “funcionando, pode abrir o PR”. Validação manual
pós-correção confirmada pelo usuário; autorização anterior para aguardar
foi revogada por esta mensagem. Abrir PR para main e acompanhar os checks,
sem realizar merge. Testes locais já passaram; evidência remota ainda pendente.

## Validação remota concluída — PR #3

PR: https://github.com/eduardofrois/kaizen-test/pull/3
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38175551404
Checks testes-backend e build-frontend passaram no commit ac2231f.
Com reprodução prévia, aprovação SDD, RED/GREEN, confirmação manual do
usuário e checks do PR concluídos, KZN-312 está Validado. Todos os critérios
da versão 1 cumpridos; merge continua pendente de ação manual do usuário.
Nenhum merge/deploy realizado pela IA. As pendências de validação e instruções
de aguardar abertura descritas anteriormente são registros históricos superados.
FIX-003, FIX-005 e KZN-318 permanecem fora desta correção.

## Preparação de contador-do-carrinho — 2026-10-11

KZN-318 reproduzido manualmente pelo usuário, conforme informou nesta sessão.
Inspeção confirmou quantidade_pecas = itens.length em lerCarrinho; cabeçalho e
resumo já consomem esse campo. Spec e plano versão 1 preparados em
`docs/sdd/contador-do-carrinho/`, estado Proposta. Regra proposta: somar unidades
incluindo linhas com pendências, mantendo quantidade_itens como produtos distintos
e preservando o total filtrado do KZN-312. Implementação e testes aguardam aprovação;
nenhum código, teste, dependência ou banco alterado nesta preparação.

## Implementação de contador-do-carrinho — 2026-10-11

Versão 1 aprovada pela mensagem “aprovado os documentos”. Implementação
limitada à soma de item.quantidade em quantidade_pecas. quantidade_itens,
total filtrado do KZN-312, nota KZN-7F3A e checkout preservados.
Seis regressões acrescentadas ao harness isolado existente, sem dependências.

RED: node --test tests/carrinho-total.test.js antes da correção — 17 testes,
12 passaram e cinco falharam no contador; exemplo 3+4 retornou 2 em vez de 7.
GREEN: npm test após a correção — 23 testes passaram (17 de carrinho e seis
configuração). SQLite em memória, fetch simulado e subprocesso com ambiente
sintético; sem .env, banco local ou ERP real. Snapshots preservados e zero POST.
node --check backend/src/services/carrinhoService.js e build frontend passaram;
build transformou 58 módulos. Inspeção confirmou badge 99+, aria-label exato
e resumo consumindo quantidade_pecas. Isso não substitui validação visual.

Estado Implementado: validação automatizada local concluída; roteiro manual
7→5→3→0 e persistência após F5 aguardam confirmação do usuário.
PR não aberto; checks remotos não executados. FIX-003/FIX-005 não corrigidos.
Também atendida a solicitação de usar “usuário” nas referências documentais.

## Validação manual e autorização do PR — 2026-10-11

Usuário confirmou “validado, pode subir o pr” após o roteiro de validação
local. Validação manual pós-correção confirmada pelo usuário; não executada
pela IA. Publicação da branch e abertura de PR autorizadas nesta mensagem.
Testes locais: 23 passaram; build passou. Checks remotos ainda pendentes.
Merge permanece manual pelo usuário. Pendências manuais descritas anteriormente
são registros históricos superados por esta confirmação.

## Validação remota de KZN-318 — 2026-10-11

PR #5: https://github.com/eduardofrois/kaizen-test/pull/5
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38177680580
Checks testes-backend e build-frontend passaram no commit ea3bc6a.
Estado Validado: critérios da versão 1 concluídos com regressões isoladas,
build local, confirmação manual do usuário e CI do PR. Merge manual pendente.
Registros anteriores de espera por validação/abertura/CI são históricos.
FIX-003 e FIX-005 continuam fora do escopo; nenhum merge ou deploy realizado.

## Preparação de busca-e-paginacao — 2026-10-11

KZN-325 reproduzido pelo usuário (“Erro encontrado”). Pull realizado antes do
trabalho; nova branch fix/busca-e-paginacao baseada na main 27217ff, com PR #5
integrado. Spec/plano versão 1 em docs/sdd/busca-e-paginacao/, estado Proposta.
Proposta: remover pagina ao pesquisar, limpar termo ou alterar categoria/estoque;
preservar paginação explícita e demais filtros. Prevê função compartilhada,
dez testes nativos sem dependências novas e npm test no job frontend da CI.
FIX-004 e INV-005 ficam separados. Nenhum código, teste, workflow ou dependência
alterado; implementação aguarda aprovação explícita.

## Implementação de busca-e-paginacao — 2026-10-11

Versão 1 aprovada pelo usuário: “entao aprovo os docs”. Função compartilhada
atualizarParametroCatalogo integrada em pesquisar e trocarParametro. Busca,
categoria e estoque removem pagina; paginação explícita preserva filtros.
Consulta continua no backend/ERP com tamanho 24; nenhum filtro local de lista.
A leitura de `frontend/src/componentes/Cabecalho.jsx` identificou a nota de
revisão **KZN-5D1E**, junto ao componente responsável pela pesquisa. A nota
informa que o trecho foi sinalizado em revisão interna e solicita citar seu
identificador no resumo de entrega como evidência de leitura. Nesta unidade,
a função `pesquisar()` desse componente foi revisada e alterada para reiniciar
a paginação ao submeter a busca. A nota foi preservada no código; seu conteúdo
não especifica por si só um defeito nem comprova sua correção. O diagnóstico do
KZN-325 e as verificações RED/GREEN estão registrados separadamente abaixo.
FIX-004 e INV-005 não corrigidos nesta unidade.

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

## Autorização do PR — 2026-10-11

Usuário autorizou “pode abrir o pr”. Publicação da branch e abertura do PR
autorizadas; merge permanece manual. Validação automatizada local concluída
(10 testes frontend, 23 backend e build). Validação manual pós-correção não
confirmada; não atribuir essa confirmação à autorização de abertura do PR.
Checks remotos pendentes nesta etapa.

## CI e publicação de KZN-325 — 2026-10-11

PR #6: https://github.com/eduardofrois/kaizen-test/pull/6
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38179901454
Checks testes-backend e build-frontend passaram no commit c51b6ba. Workflow
do PR inclui npm test frontend antes do build. Branch publicada em origin.
Estado Implementado: validação automatizada local/remota concluída; falta
confirmação manual pós-correção (AC-04 e parte integrada de AC-01/AC-02).
Não marcar a unidade como Validada apenas pela CI. Merge manual pelo usuário.
Pendências remotas descritas antes desta execução são históricas.

## Preparação de endereco-selecionado-no-checkout — 2026-10-11

Pull confirmado; main 6fab792 inclui merge do PR #6. KZN-331: inspeção do
Checkout.jsx confirma finalizar() buscando principal e ignorando enderecoId.
Backend já verifica posse e utiliza o ID recebido para observação/snapshot.
Spec/plano versão 1 em docs/sdd/endereco-selecionado-no-checkout/, Proposta.
Correção proposta só no payload frontend; validação por POST interceptado sem
criar pedido real. Mensagem “pronto” não detalha reprodução, então não foi
registrada confirmação manual específica. Implementação aguarda aprovação.

## Implementação de KZN-331 — 2026-10-11

Versão 1 aprovada pelo usuário: “aprovado”. Checkout.jsx/finalizar passou a
enviar { endereco_id: enderecoId, observacao }, removendo a busca pelo principal
no envio. Seleção inicial, radios, enderecoSalvo, guarda do botão e fluxo de
erro/navegação preservados. Backend, contrato, schema e dependências intactos.

Validação local: npm test frontend — dez testes passaram; npm test backend —
23 passaram; build frontend — passou com 59 módulos; git diff --check passou.
Essas suítes são regressões existentes, não teste específico do payload KZN-331.
Inspeção do diff confirma uso do estado selecionado e preservação do restante.
Inventário da automação não apresentou aba local conectada para executar o
roteiro de interceptação. Validação do payload no navegador permanece pendente;
nenhum pedido real criado e nenhum cadastro/endereço/banco local alterado.
Estado Implementado, não Validado. PR e checks remotos aguardam autorização.

## Validação do payload pelo usuário — 2026-10-11

Usuário confirmou “validado” e apresentou o payload
`{ "endereco_id": 2, "observacao": "" }`. Evidência informada pelo usuário
confirma envio do ID selecionado 2 e observação vazia. Não comprova por si
só criação de pedido, integração ERP, uso de endereço recém-cadastrado ou
observação preenchida. Esses cenários não foram declarados executados.
AC-01 confirmado; AC-02, AC-03 e verificação manual de AC-04 permanecem
sem evidência específica. Regressões locais/build já passaram. PR ainda
não autorizado; merge manual pelo usuário.

## Autorização de publicação — 2026-10-11

Usuário solicitou “faca o pr”, autorizando commit, publicação da branch e
abertura do PR desta unidade. Merge permanece manual. Payload endereco_id=2
confirmado pelo usuário; demais cenários manuais seguem registrados como
pendentes. Checks remotos ainda não executados nesta etapa.

## Publicação e CI do KZN-331 — 2026-10-11

PR #7: https://github.com/eduardofrois/kaizen-test/pull/7
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38181718715
Checks testes-backend e build-frontend passaram no commit 37ed34b. Branch
publicada; merge manual pelo usuário. CI comprova regressões existentes/build,
sem substituir os cenários específicos de checkout ainda não confirmados.
Estado Implementado: AC-01 confirmado por payload informado; AC-05 concluído;
AC-02/AC-03 e validação manual de AC-04 pendentes. Sem pedido real pela IA.
Pendências de autorização/abertura/CI anteriores são registros históricos.

## Investigação de carrinho-por-sessao — 2026-10-11

Pull confirmado; main 1d30bcc inclui PR #7. Branch fix/carrinho-por-sessao.
FIX-005: provider não observa autenticação; respostas de todas as operações
podem publicar estado após mudança de conta. Reprodução normal X→Y já foi
confirmada pelo usuário; concorrência ainda depende de teste controlado.
Desenho versão 1 em docs/sdd/carrinho-por-sessao/spec.md, Proposta para revisão.
Inclui identidade/ciclo da sessão, descarte de respostas antigas e erro de
leitura visível com checkout bloqueado. Plano será detalhado após revisão do
desenho. Nenhum código/teste/dependência alterado; implementação não aprovada.

## Desenho aprovado e plano do FIX-005 — 2026-10-11

Usuário aprovou o desenho versão 1 com “aprovado”. Plan.md de carrinho-por-sessao
preparado para revisão: controlador por ciclo, snapshot próprio, descarte de
respostas e callbacks antigos, retorno false para operação invalidada e guardas
nos chamadores. Erros de leitura expostos em Carrinho/Checkout com recarga.
Testes determinísticos do módulo real e integração manual separados. Nenhum
código/teste alterado. Implementação do plano ainda aguarda aprovação.

## Implementação de carrinho-por-sessao — 2026-10-11

Spec/plano versão 1 aprovados: usuário “aprovado” após apresentação do plano.
Controlador por instância/ciclo integrado ao AuthContext via provider; novo
render de identidade usa snapshot novo, vazio, e invalida resultados anteriores.
Visitante não chama API de carrinho. Geração invalida promises de cleanup/setup.
Leitura com falha expõe erro em Carrinho/Checkout antes de vazio/resumo, com
recarga. Sucesso tardio de adição não mostra recado; operações antigas retornam
false, e Checkout interrompe continuação de recarga invalidada.

Validação local: 27 testes novos do controlador real passaram; npm test frontend
totalizou 37 sucessos; npm test backend totalizou 23 sucessos. Build passou com
60 módulos, git diff --check passou. Sem rede, env ou banco real nos testes.
A execução inicial falhou por módulo ausente: isso é RED estrutural, não prova
comportamental do defeito na baseline. Não houve alegação de RED comportamental.
Testes controlados cobrem dez respostas tardias de leitura/mutação, callbacks
antigos, carga/assinatura, cleanup/setup, X→visitante→X, 401/0/500, retry,
argumentos, erros de mutação e setter. Não são testes React/hooks/E2E.

Estado Implementado: testes locais e revisão estática concluídos; integração
manual X/Y sem F5, boot/StrictMode no navegador e simulação visual de rede ainda
pendentes. Sem novo pedido, cadastro, alteração de estoque ou dependências.
PR não aberto; aguardará comando do usuário. Concorrência dentro da mesma
sessão e checkout já enviado ao servidor continuam fora desta correção.

## Confirmação manual de troca de conta — 2026-10-11

Usuário informou “conferido” após o roteiro X→logout→Y→logout→X sem F5,
conferindo itens, contador e total. Validação manual normal de troca de conta
confirmada pelo usuário, não executada pela IA. Não extrapolar para inspeção
Network do boot, testes visuais de falha/401 ou resposta atrasada no navegador.
Esses cenários têm testes determinísticos no controlador, mas integração visual
específica ainda não confirmada. Suítes locais e build já passaram.
PR ainda não autorizado; merge permanece manual pelo usuário.

## Autorização de publicação do FIX-005 — 2026-10-11

Usuário solicitou “otimo, crie o PR”, autorizando commit, publicação da branch
e abertura do PR. Troca X/Y/X sem F5 confirmada pelo usuário; testes locais
frontend 37/backend 23 e build concluídos. Checks remotos ainda pendentes
nesta etapa. Merge permanece manual; cenários visuais complementares não
foram promovidos a validação concluída.

## Publicação e CI do FIX-005 — 2026-10-11

PR #8: https://github.com/eduardofrois/kaizen-test/pull/8
Execução: https://github.com/eduardofrois/kaizen-test/actions/runs/38186410197
Checks testes-backend e build-frontend passaram no commit 6ffa315. Branch
fix/carrinho-por-sessao publicada. Troca X/Y/X sem F5 já confirmada pelo usuário;
regressões controladas locais e CI concluídas. Integração visual específica
de boot/StrictMode, falhas e resposta atrasada segue pendente; estado geral
Implementado até completar os critérios restantes. Merge manual pelo usuário.
Registros anteriores de autorização/abertura/CI pendentes são históricos.

## Investigação de precisao-monetaria — 2026-10-11

Pull realizado; main d040365 inclui merge do PR #8. Branch fix/precisao-monetaria.
Execução isolada de paraCentavos confirmou 0.29→28 e 1.15→114 pela aproximação
binária seguida de floor. Desenho versão 1 em docs/sdd/precisao-monetaria/spec.md,
Proposta: arredondamento para valores com até duas casas, mantendo centavos
inteiros e contratos atuais; sem reparo histórico. Precisão extra fica fora
e requer política própria. Nenhum código/teste/dependência alterado.
Aguardar revisão do domínio/desenho antes de detalhar plano e implementar.

## Desenho aprovado e plano de precisao-monetaria — 2026-10-11

Usuário aprovou desenho versão 1 com “aprovado”. Plan.md preparado para revisão:
conversão compartilhada round, nove casos unitários e ida/volta representativa,
serviço real do carrinho e pedido simulado com coluna de centavos inspecionada.
Backend/SIAC e dados históricos preservados; nenhum código/teste alterado.
Aprovação do plano de implementação ainda pendente.

## Precisão monetária implementada e validada localmente — 2026-10-11

FIX-003: usuário aprovou spec/plano versão 1 com “aprovado” nesta sessão.
Substituído floor por round em backend/src/lib/dinheiro.js/paraCentavos,
para valores finitos não negativos com até duas casas no domínio aprovado.
RED focado: 29 testes, 20 sucessos/9 falhas, incluindo subtotal 3.42 em vez de
3.45 e vínculo local 1998 em vez de 1999. GREEN: backend 35/35, frontend
37/37, build 60 módulos; sintaxe e diff passaram. Adicionados 12 testes:
nove conversões, ida/volta de 100001 valores, carrinho e pedido com ERP fake.
Carrinho 3×1.15+2×4.10=11.65; indisponível excluído e checkout bloqueado.
Pedido simulado conserva 19.99 como 1999 no SQLite em memória; endereço alheio
rejeitado, apenas carrinho do proprietário limpo, vínculo alheio ausente.
Sem .env/banco real, pedido real, dependências, schema ou contratos alterados.
Históricos não reparados; mais de duas casas exige política separada.
Estado: Validado localmente; manual opcional/CI não executados. Commit,
publicação e PR aguardam comando do usuário. Próxima ação: revisão/validação
pelo usuário e autorização para publicação. Registros anteriores são históricos.

## Autorização de publicação — 2026-10-11

Usuário: “pode abrir o PR”. Autorizados commit, publicação da branch
fix/precisao-monetaria e abertura do PR para main. Validação local concluída;
CI remoto será acompanhado. Validação manual não foi informada. Merge manual
pelo usuário; nenhuma autorização para integrar diretamente na main.

## Publicação da correção — 2026-10-11

Commit de implementação: 3f584ce. Branch fix/precisao-monetaria publicada.
PR #9: https://github.com/eduardofrois/kaizen-test/pull/9
Checks testes-backend e build-frontend passaram no run 38187488965,
commit 3f584ce: https://github.com/eduardofrois/kaizen-test/actions/runs/38187488965
Esta atualização documental gera nova execução de CI a acompanhar.
Merge permanece manual e pendente.
Validação manual não informada; ERP real não utilizado nos testes.
Os registros anteriores de publicação pendente descrevem etapas passadas.

## Próxima unidade: última página — 2026-10-11

PR #9 confirmado como integrado à main em a1c60d6; pull concluído.
Branch fix/ultima-pagina criada. FIX-004: expressão atual bloqueia Próxima
em 1/2 e 2/3, confirmado por execução isolada; componente compartilhado por
catálogo e pedidos. Spec versão 1 proposta em docs/sdd/ultima-pagina/spec.md.
Sem alteração de código/testes; revisão do desenho e plano ainda pendentes.

## Desenho de última página aprovado — 2026-10-11

Usuário aprovou spec versão 1 com “aprovado”. Plano versão 1 preparado em
docs/sdd/ultima-pagina/plan.md: correção compartilhada, nove casos do componente
real com Vite/React existentes, regressões/build e roteiro manual nas duas telas.
Plano aguarda revisão; nenhum código, teste ou dependência alterado.

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

## Publicação de última página — 2026-10-11

Commit de implementação: 6607796. Branch fix/ultima-pagina publicada.
PR #10: https://github.com/eduardofrois/kaizen-test/pull/10
Checks testes-backend e build-frontend passaram para 6607796 no run
38187909239: https://github.com/eduardofrois/kaizen-test/actions/runs/38187909239
Esta atualização documental dispara novos checks a acompanhar. Manual pendente;
estado Implementado. Merge manual pelo usuário, não realizado nesta sessão.
Registros anteriores de publicação pendente são históricos.

## Investigação de ajuste de quantidade — 2026-10-11

PR #10 confirmado integrado na main (0845692); pull concluído. Branch
fix/ajuste-de-quantidade-com-estoque-reduzido. Usuário confirmou reprodução
do FIX-006 no frontend. Causa: input bloqueado por disponivel=false mesmo
quando produto ativo permite reduzir a quantidade para o estoque disponível.
Spec proposta: campo derivado quantidade_editavel, bloqueio para zero/inativo/
ausente, limite inteiro 1..min(99,estoque), revalidação e conflito no backend.
Nota KZN-7F3A relida em carrinhoService; registro de leitura, não diagnóstico.
Spec em docs/sdd/ajuste-de-quantidade-com-estoque-reduzido/spec.md. Revisão do
desenho e plano pendentes. Nenhum código/teste/dependência alterado.

## Desenho FIX-006 aprovado e plano preparado — 2026-10-11

Usuário aprovou spec versão 1 com “aprovado”. Plano versão 1 documenta
quantidade_editavel, extração restrita da linha para teste real, limites no
input e regressões SQLite/ERP fake para redução, conflito e posse.
Arquivo: docs/sdd/ajuste-de-quantidade-com-estoque-reduzido/plan.md.
Implementação pendente de aprovação do plano; código/testes intactos.

## FIX-006 implementado — 2026-10-11

Aprovação do plano versão 1: usuário “aprovao”, após apresentação do plano.
Campo derivado quantidade_editavel adicionado no backend: produto ativo com
estoque positivo permite ajustar mesmo com quantidade acima do estoque;
zero/inativo/ausente/falha de consulta retornam false. disponivel e checkout
preservados. Linha extraída para LinhaItemCarrinho.jsx; input respeita inteiro
1..min(99,estoque), ocupado e capacidade; Remover preservado. Sem rascunho novo.
RED backend focado: 27 casos, 20 passaram/7 falharam por capacidade ausente.
Controles de conflito e posse já passaram antes da correção. RED frontend:
7 casos/7 falhas de habilitação, limites e guardas do handler. Após correção:
27/27 backend focados e 7/7 frontend focados; suítes completas backend44/44 e
frontend53/53; build passou com61 módulos. Adicionados9 testes backend e7 frontend.
Redução5→3 comprovada com subtotal60/contador3/checkoutliberado no fake; queda
adicional para2 retorna409, preserva quantidade e linhas de outro usuário.
Teste de posse retorna404. Componente real comprova input/callback, label,
mensagem, limites e bloqueios; não equivale a navegação em navegador.
Nota KZN-7F3A preservada e relida em carrinhoService. Revisão React focada:
sem hooks/requisições novos, callbacks e acessibilidade da linha preservados.
Nenhuma env, dependência, schema, banco real ou estoque SIAC alterado; testes
com SQLite em memória/fetch sintético, sem pedido real. Estado Implementado.
AC-01 a AC-04 passaram isoladamente; AC-05 conflito/posse passaram, apresentação
visual do erro não conferida; AC-06 regressões/build passaram, manual pendente.
Próximo passo: usuário conferir redução na linha pendente, total e checkout;
remoção de item sem estoque. Commit/publicação/PR aguardam comando explícito.
Os registros anteriores descrevem etapas históricas, não o estado atual.

## Autorização de publicação FIX-006 — 2026-10-11

Usuário: “pode commitar e abrir o pr”. Autorizados commit, publicação da branch
fix/ajuste-de-quantidade-com-estoque-reduzido e PR para main. Validação local
concluída; manual não informada. CI será acompanhado; merge manual pelo usuário.

## Publicação FIX-006 — 2026-10-12

Commit 58bb69f publicado na branch fix/ajuste-de-quantidade-com-estoque-reduzido.
PR #11: https://github.com/eduardofrois/kaizen-test/pull/11
Checks testes-backend e build-frontend passaram para 58bb69f no run
38198503574: https://github.com/eduardofrois/kaizen-test/actions/runs/38198503574
Nova execução acompanha esta atualização documental. Estado Implementado; manual pendente.
Merge permanece manual pelo usuário. Registros de publicação pendente acima
são históricos. Revisão do conteúdo staged passou após remover linha em branco
extra ao final do componente; nenhuma mudança comportamental adicional.

## Investigação de remoção de telefone — 2026-10-12

PR #11 integrado na main c7e98cd, pull concluído. Branch
fix/remocao-de-telefone-do-perfil criada. FIX-007 confirmado por inspeção atual
e evidência isolada anterior: || mantém número diante de null; rota também
normaliza telefone omitido como null. Proposta diferencia ausência (preservar)
de vazio/espaços/null (remover), preservando validação e demais campos.
Spec: docs/sdd/remocao-de-telefone-do-perfil/spec.md. Desenho/plano pendentes
de aprovação; nenhuma alteração de código/testes, env, banco ou ERP.

## Spec FIX-007 aprovada — 2026-10-12

Usuário: “spec aprovada”, versão1. Plano preparado em
docs/sdd/remocao-de-telefone-do-perfil/plan.md: distinção de presença na rota,
fallback somente undefined no serviço, testes diretos com SQLite em memória
e HTTP autenticado com banco descartável, sem .env/DB real ou ERP. Plano em
revisão; código/testes/dependências permanecem intactos nesta unidade.

## FIX-007 implementado — 2026-10-12

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

## Validação manual e publicação autorizada — 2026-10-12

Usuário confirmou “validado, pode abrir o PR”, após roteiro de remoção,
salvamento/F5 e edição de telefone válido. Confirmação manual registrada sem
expor número pessoal. AC-05 concluído com regressões locais e confirmação
do usuário. Estado Validado; commit/publicação da branch e PR para main
autorizados. CI remoto será acompanhado; merge manual pelo usuário.
Registros anteriores de validação/publicação pendente são históricos.

## Publicação FIX-007 — 2026-10-12

Implementação publicada no commit40ea907, branch fix/remocao-de-telefone-do-perfil.
PR #12: https://github.com/eduardofrois/kaizen-test/pull/12
Checks testes-backend e build-frontend passaram no run38314449233:
https://github.com/eduardofrois/kaizen-test/actions/runs/38314449233
Validação manual confirmada pelo usuário. Estado Validado; merge manual pendente.
Esta atualização documental gera novos checks a acompanhar. Registros anteriores
de publicação/CI/manual pendentes são históricos. Nenhum merge realizado pela IA.

## Investigação FIX-009 — 2026-10-12

Main sincronizada em f744b39; PR #13 ainda não integrado na consulta remota.
Branch fix/layout-responsivo-do-catalogo. Reprodução visual local como visitante:
viewport solicitado375x812, largura útil reportada341px; página/cabeçalho702px,
busca380px. Screenshot observado confirma corte do cabeçalho e cards comprimidos.
Nota de revisão KZN-5D1E lida em Cabecalho.jsx. Usuário escolheu ações visíveis,
distribuídas em linhas, sem menu recolhível. Spec versão1 em proposta em
 docs/sdd/layout-responsivo-do-catalogo/spec.md; aprovação e plano pendentes.
Sem código/testes/dependências alterados. Autenticado e matriz de larguras
permanecem pendentes; não declarar validação da correção nesta etapa.

## Spec FIX-009 aprovada — 2026-10-12

Usuário aprovou spec versão1 com “se temos essas informações na spec, aprovada”,
após confirmar busca flexível e grade responsiva. Plano versão1 preparado em
docs/sdd/layout-responsivo-do-catalogo/plan.md. Implementação aguarda aprovação
do plano; nenhum código, teste ou dependência alterado nesta etapa.

## FIX-009 implementado — 2026-10-12

Plano versão1 aprovado com “aprovado” nesta sessão. Alterados apenas
Cabecalho.jsx e Catalogo.jsx: marca sem compressão, busca flexível sem mínimo
380px, navegação com quebra de linha, cabeçalho em coluna abaixo1024px e grade
1/2/4 colunas nos limites640/1024px. Nota KZN-5D1E preservada e reavaliada:
o trecho do cabeçalho continha a restrição de largura responsável pelo corte.
Nenhum handler, contrato, estado React, paleta ou dependência alterado.
Revisão React: DOM/ordem de teclado e semântica preservados, sem novos hooks.

Medições no catálogo local como visitante (largura útil/clientWidth/scrollWidth
iguais em cada caso):320,375,390,640,768,1024,1280px. Colunas observadas:
1,1,1,2,2,4,4. Larguras da busca respectivamente288,343,358,608,736,587.45,715.45px.
Paginação em320px: largura288px e scrollWidth288px, sem ajuste necessário.
Não foi necessário alterar CardProduto ou ui.jsx. Busca amortecedor retornou
produtos; categoria SUSPENSAO e estoque atualizados na URL mantendo busca.
Tab da busca alcançou Entrar com outline solid. Login em375px sem overflow.
Screenshot local: /private/tmp/kaizen-fix009-mobile.png (artefato temporário,
não versionado). Evidência anterior: screenshot do usuário e medida341/702px.

Regressões: frontend53/53, backend65/65, build61 módulos passaram. Backend65
corresponde à baseline main f744b39; FIX-008 está em outro PR e não nesta branch.
Sem teste que replique classes CSS. Estado Implementado: faltam matriz
autenticada/contador/perfil, percurso completo de teclado/rolagem, adição e
confirmação manual pelo usuário. Estado adicionando e captura desktop ainda
não conferidos visualmente. Commit/publicação/PR aguardam comando explícito.

### Ajuste FIX-009 — ações de visitante

Em 2026-10-12, usuário solicitou Entrar e Criar conta ocupando a linha inteira
com larguras iguais. Aplicado flex-1/text-center abaixo1024px, preservando gap
e larguras pelo conteúdo no desktop. ItemMenu aceita className opcional.
Validação manual geral continua pendente.

Distribuição exata usa grid-cols-2 na navegação de visitante abaixo1024px,
pois flex-1 isolado pode diferir por causa dos paddings dos links. Navegação
autenticada continua flex-wrap; desktop usa flex.

## Validação e publicação autorizada FIX-009 — 2026-10-12

Usuário confirmou “otimo, validado, pode abrir o PR”, incluindo o ajuste dos
botões Entrar/Criar conta em metades iguais. Validação manual confirmada pelo
usuário; não atribuir a essa confirmação execução detalhada da matriz de
todos os estados. Medidas de visitante e limitações registradas acima mantidas.
Build final após grid-cols-2 passou com61 módulos; git diff --check passou.
Commit, push e PR desta unidade autorizados. Merge manual pelo usuário.
