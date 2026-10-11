# Relatório de entrega

**Estado:** investigação e primeira correção concluídas; trabalho em andamento.

**Última atualização:** 2026-10-11.

**Candidato:** pendente de informação.

**Data de entrega:** pendente de definição.

**Tempo aproximado dedicado:** pendente de registro pelo candidato.

Esta versão registra o que foi encontrado e verificado até agora. A
configuração por ambiente (FIX-001) foi corrigida e validada com testes
automatizados e verificações manuais locais pelo candidato. Demais correções,
múltiplos carrinhos, validação dos demais fluxos e deploy estão pendentes. A análise partiu da baseline original `81897d5`.

---

## 1. Subindo o projeto

A aplicação ainda não foi colocada no ar. Foram lidos os requisitos,
arquitetura, código, dependências e configuração. As dependências do backend foram instaladas com `npm ci` (120 pacotes;
auditoria informou zero vulnerabilidades nessa execução). Foi criado
`backend/.env` local, ignorado pelo Git, com os três campos obrigatórios vazios
para preenchimento pelo candidato, que depois informou tê-los configurado e
iniciado os servidores com sucesso. Build novo e deploy não executados.

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
ambiente local consultado tem Node v24.14.1 e npm 11.11.0. Execução local confirmada pelo candidato,
com catálogo, login, persistência da sessão e logout funcionando.

Arquivos criados para organizar o trabalho:

- `.gitignore`, com regras para ambiente, dependências, build e SQLite local.
- `AGENTS.md`, com instruções e aprovação obrigatória antes de implementar.
- `fix.md`, com inventário detalhado de problemas e investigação.
- `docs/ai/arch.md` e `boundaries.md`, com arquitetura real e limites.
- `docs/investigacao.md`, `decisoes.md` e `ambiente.md`.
- Fluxo e modelos em `docs/sdd/`.
- Spec e plano aprovados e executados em `docs/sdd/configuracao-por-ambiente/`.

O procedimento de instalação/execução está descrito como previsto em
[docs/ambiente.md](docs/ambiente.md); será atualizado com resultados reais.

---

## 2. Chamados reportados

As causas abaixo foram localizadas e verificadas de forma isolada. Nenhum
destes quatro chamados foi corrigido; testes integrados continuam pendentes.

### KZN-312 — Total do carrinho vem maior que a soma das peças

| Campo | Registro |
|---|---|
| **Causa** | `lerCarrinho()` soma `valor_total` de todos os itens, inclusive os marcados como indisponíveis. A pendência impede checkout, mas não exclui o valor da soma. |
| **Como reproduzi** | Executei o serviço em memória com banco/ERP simulados: uma linha disponível de R$ 20 e três unidades sem estoque de R$ 228. O retorno foi R$ 704, com R$ 684 relativos ao item indisponível. Não foi reprodução pela interface. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. Causa em `backend/src/services/carrinhoService.js`, `enriquecerItens()` e `lerCarrinho()`. |
| **Como validei a correção** | Pendente: ainda não há correção. A spec deverá definir o total com pendências e preservar o bloqueio de checkout. |

Também encontrei perda de centavos na conversão monetária, descrita no
problema 3. É uma causa distinta que afeta o mesmo fluxo.

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
| **Validação** | `node --test tests/config.test.js`: seis testes passaram após a correção. `node --check backend/src/config.js`: passou. Processos com env sintética e diretório temporário, sem .env do usuário, rede ERP ou banco. Complemento manual pelo candidato: catálogo, login, refresh de sessão, logout e rejeição de JWT_SEGREDO vazio confirmados. Checkout não testado. |

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
| **Corrigi?** | Não. Precisão e política de conversão serão especificadas antes de implementar. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Problema 4 — Última página bloqueada pela paginação (FIX-004)

| Campo | Registro |
|---|---|
| **O que está errado** | O botão Próxima usa `pagina >= totalPaginas - 1`, antecipando o bloqueio. |
| **Como cheguei nele** | Executei a expressão original de `frontend/src/componentes/ui.jsx`: página 1 de 2 e página 2 de 3 já retornam desabilitado. |
| **Impacto** | Última página do catálogo e dos pedidos não pode ser alcançada pelo botão normal. |
| **Corrigi?** | Não. A correção compartilhada e suas regressões aguardam SDD. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Problema 5 — Carrinho não acompanha autenticação (FIX-005)

| Campo | Registro |
|---|---|
| **O que está errado** | O provider carrega uma vez e não observa login, logout ou identidade do usuário. Respostas em andamento também não são invalidadas por troca de identidade. |
| **Como cheguei nele** | Leitura de `CarrinhoContext.jsx`, `AuthContext.jsx` e montagem em `main.jsx`. Reprodução integrada pendente. |
| **Impacto** | Interface pode continuar vazia após login ou mostrar conteúdo residual da conta anterior. As consultas do backend continuam filtradas por usuário; não foi demonstrado vazamento pela API. |
| **Corrigi?** | Não. Ciclo da sessão, estados de erro e respostas antigas precisam de spec/plano. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Problema 6 — Estoque reduzido impede ajuste de quantidade (FIX-006)

| Campo | Registro |
|---|---|
| **O que está errado** | A UI desabilita quantidade para qualquer item indisponível, incluindo aquele cuja quantidade apenas excedeu o estoque restante. |
| **Como cheguei nele** | Comparei `LinhaItem()` em `Carrinho.jsx` com a definição de disponibilidade em `carrinhoService.js`. Evidência estática. |
| **Impacto** | Se o estoque cair de cinco para três, o usuário não consegue reduzir para três pelo campo, embora a tela peça ajuste. |
| **Corrigi?** | Não. Validar visualmente o cenário e especificar as ações permitidas por motivo da pendência. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

### Problema 7 — Telefone opcional não pode ser removido (FIX-007)

| Campo | Registro |
|---|---|
| **O que está errado** | `atualizarPerfil()` usa `telefone || atual.telefone`, mantendo o valor antigo quando a validação produz null para limpeza do campo. |
| **Como cheguei nele** | Executei o serviço com banco simulado: enviei telefone=null e o argumento do UPDATE continuou com o número anterior. |
| **Impacto** | Usuário não consegue apagar contato, apesar do campo opcional e de uma resposta de salvamento. |
| **Corrigi?** | Não. A spec deve definir omissão versus limpeza explícita no PATCH e conferir rota/serviço. |
| **Arquivos alterados** | Nenhum arquivo de aplicação. |

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
| **Como cheguei nele** | Leitura de `Cabecalho.jsx` e `Catalogo.jsx`. A restrição CSS está localizada; medição e reprodução visual ainda não foram executadas. |
| **Impacto** | Risco de overflow e conteúdo comprimido no celular, relevante para o carrinho visível na vitrine. Extensão do efeito visual ainda precisa ser medida. |
| **Corrigi?** | Não. Reprodução visual, preservação da identidade e coordenação com múltiplos carrinhos serão especificadas. |
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

Há sugestões iniciais em [docs/decisoes.md](docs/decisoes.md), ainda não
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

O candidato validou manualmente catálogo, login, refresh de sessão e logout
no navegador e rejeição de JWT_SEGREDO vazio no terminal. Não houve execução
real do checkout, auditoria visual completa, build novo ou deploy. As simulações não comprovam o contrato
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
candidato. Este relatório será atualizado com causas, mudanças e provas
efetivamente realizadas ao longo do trabalho.

### Atualização de preparação local — 2026-10-11

O candidato informou que preencheu backend/.env. As dependências foram
instaladas pelos lockfiles com npm ci: backend 120 pacotes e frontend 82.
Auditorias npm informaram zero vulnerabilidades nessa execução. Nenhum
manifest/lockfile foi alterado. Servidores e integração real não foram
iniciados nesta etapa; instruções de execução local entregues ao candidato.

### Validação manual e novo achado — 2026-10-11

O candidato informou que iniciou o projeto local com sucesso, conseguiu
logar e visualizar as peças. A captura da vitrine mostra catálogo carregado
e navegação de usuário autenticado. Evidência fornecida pelo candidato;
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

Evidência informada pelo candidato: login, catálogo, persistência da sessão
após atualizar a página e logout funcionaram localmente. Ao executar
`JWT_SEGREDO= npm start` em backend/, o processo encerrou com
`Configuracao invalida: JWT_SEGREDO nao definido. Rode: npm run segredo:gerar`.
Fail-fast manual confirmado, sem alterar .env. Os seis testes automatizados
já haviam passado. Não foi executado checkout real; este registro não
comprova os demais fluxos do sistema. Implementação registrada no commit c46e68e. Validação concluída para o
escopo aprovado; resultados consolidados neste commit documental complementar.
Nenhuma nova alteração de aplicação realizada; publicação remota pendente.

## Integração e publicação — 2026-10-11

Por autorização do candidato, branch configuracao-por-ambiente integrada na
main pelo merge f913cda, sem conflitos. Push para eduardofrois/kaizen-test
concluído: remoto confirmou main de 6307deb para f913cda. Branch local
codex/configuracao-por-ambiente preservada. Os registros anteriores de push
pendente descrevem a etapa anterior e estão superados por esta atualização.
.env e arquivos gerados não foram enviados. Publicação do código no GitHub
não representa deploy da aplicação.
