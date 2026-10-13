# Relatório de entrega

**Candidato:** Eduardo Frois

**Data de entrega prevista:** 13/10/2026, até as 15h (horário de Brasília)

**Tempo aproximado das correções:** cerca de 9h20 de tempo decorrido nos intervalos estimados das 14 correções, com média de 40 minutos por correção. Não houve apontamento de horas ativas; veja o detalhamento abaixo.

**Última atualização:** 13/10/2026

**Estado:** quatro chamados, dez correções adicionais e múltiplos carrinhos v2 implementados e integrados à main (76eca4d). Testes isolados e build passaram; limites de validação descritos abaixo.

Referência de código: main 76eca4d, com o PR #17 integrado. Esta edição altera
somente documentação.

Este relatório consolida o estado atual do código, em vez de repetir o diário
de execução. A investigação partiu da baseline original `81897d5`. Os detalhes,
aprovações e evidências de cada unidade estão em [fix.md](fix.md) e
[docs/sdd/](docs/sdd/README.md).

Em 12/10/2026, confirmei que realizei a validação manual das correções. Essa
confirmação complementa os registros anteriores, inclusive aqueles que ainda
indicavam validação manual pendente. Os testes automatizados usam ERP simulado
e SQLite isolado. Não representam uma homologação do SIAC nem um deploy.

---

## 1. Subindo o projeto

Executei a aplicação localmente com dois processos: backend Node/Express na
porta 3001 e frontend React/Vite na porta 5173. Instalei as dependências com
`npm ci` em cada pasta, configurei `backend/.env` e iniciei ambos com
`npm run dev`. O catálogo vem do SIAC; a loja não precisa importar produtos.
O SQLite é criado e o schema é aplicado pelo bootstrap do backend, sem reset.

Os principais pontos de atenção foram identificar `ERP_URL` como o nome real
da variável, entender que ela recebe a base da API e alinhar a versão do Node
com o Vite. O ambiente usado nas validações registradas foi Node 24.14.1 e
npm 11.11.0. O proxy de `/api` permite que o navegador acesse frontend e API
pela mesma origem. Não há configuração de credenciais no frontend.

Criei/configurei os seguintes arquivos além dos originais:

- `backend/.env`, somente local e ignorado pelo Git, para JWT e integração ERP.
- `.gitignore`, para excluir ambiente, dependências, build e SQLite gerado.
- `.github/workflows/validacao.yml`, para testes e build no GitHub Actions.
- Testes em `backend/tests/` e `frontend/tests/`.
- `fix.md`, `docs/investigacao.md`, `docs/ambiente.md`, contexto em `docs/ai/`
  e specs/planos em `docs/sdd/`, para investigação, decisões e evidências.
- `AGENTS.md`, com regras duradouras de trabalho e revisão antes de implementar.

O repositório de entrega é
[eduardofrois/kaizen-test](https://github.com/eduardofrois/kaizen-test), com
histórico próprio para não carregar as credenciais do histórico original.
A execução local foi confirmada; não há deploy registrado. O procedimento
reproduzível está no [README.md](README.md#como-rodar-o-projeto).

---

## 2. Chamados reportados

Os quatro chamados estão corrigidos no checkout revisado. Cada correção teve
spec e plano próprios, sem misturar causas diferentes que afetam a mesma tela.

### KZN-312 — Total do carrinho vem maior que a soma das peças

| Campo | Registro |
|---|---|
| **Causa** | `lerCarrinho()` somava o subtotal de todas as linhas, inclusive indisponíveis. A mesma linha bloqueava o checkout, mas continuava aumentando o total. |
| **Como reproduzi** | R$ 20,00 disponíveis mais três unidades sem estoque a R$ 228,00 produziam R$ 704,00: excesso de R$ 684,00. A reprodução também foi confirmada pela interface com item que perdeu estoque. |
| **Correção** | O redutor soma somente linhas com `disponivel=true`. A linha com pendência permanece visível, com quantidade, motivo e subtotal de referência. O checkout continua bloqueado até resolver todas as pendências. |
| **Arquivos alterados** | `backend/src/services/carrinhoService.js`, `backend/tests/carrinho-total.test.js`; spec/plano em `docs/sdd/total-do-carrinho/`. |
| **Como validei a correção** | Onze testes novos: antes, seis falhavam; depois, a suíte da etapa passou com 17 testes. Cobertura de estoque insuficiente/zero, inativo, produto ausente, falha de consulta, vazio e isolamento. Validação manual confirmada; checks do PR #3 passaram. |

**Decisão:** excluir a linha inteira do total disponível, sem reduzir a quantidade
automaticamente ou aceitar compra parcial. A perda de centavos tinha outra
causa e foi tratada na FIX-003. Nota de revisão **KZN-7F3A** lida e preservada.

### KZN-318 — Número no ícone do carrinho está errado

| Campo | Registro |
|---|---|
| **Causa** | `quantidade_pecas` recebia `itens.length`, contando produtos distintos em vez de unidades. |
| **Como reproduzi** | Dois produtos com três e quatro unidades mostravam contador 2, apesar de haver sete peças. |
| **Correção** | `quantidade_pecas` passou a somar `item.quantidade`. `quantidade_itens` continua representando produtos distintos. Cabeçalho e resumo recebem o mesmo total de unidades do backend. |
| **Arquivos alterados** | `backend/src/services/carrinhoService.js`, `backend/tests/carrinho-total.test.js`; spec/plano em `docs/sdd/contador-do-carrinho/`. |
| **Como validei a correção** | Seis regressões adicionadas; cinco falhavam antes da mudança. Depois, 23 testes backend passaram na etapa, além do build. Roteiro manual 7→5→3→0 e persistência após F5 confirmados. Checks do PR #5 passaram. |

**Decisão:** contar também as unidades com pendências, pois continuam no
carrinho. O contador informa conteúdo; o total monetário informa o valor das
linhas disponíveis. O badge visual `99+` e o rótulo acessível foram preservados.

### KZN-325 — Busca diz que não encontrou peça que existe

| Campo | Registro |
|---|---|
| **Causa** | Busca, categoria, disponibilidade e limpeza do termo mantinham a página anterior. Um resultado menor podia ser consultado numa página que não existia. |
| **Como reproduzi** | Partindo de `?pagina=2`, pesquisar amortecedor mantinha `pagina=2` na URL. O problema também foi reproduzido pelo candidato no catálogo. |
| **Correção** | A função compartilhada `atualizarParametroCatalogo()` remove `pagina` ao mudar busca/filtros e preserva os demais parâmetros. Uma mudança explícita de página mantém os filtros. |
| **Arquivos alterados** | `frontend/src/lib/parametrosCatalogo.js`, `frontend/src/componentes/Cabecalho.jsx`, `frontend/src/paginas/Catalogo.jsx`, `frontend/tests/parametros-catalogo.test.js`, `frontend/package.json`, `.github/workflows/validacao.yml`; spec/plano em `docs/sdd/busca-e-paginacao/`. |
| **Como validei a correção** | Dez testes da função real: oito resets falhavam antes e todos passaram depois. Backend e build passaram na etapa; checks do PR #6 passaram. Validação manual confirmada na consolidação de 12/10/2026. |

**Decisão:** manter a consulta no backend/ERP e os filtros na URL, preservando
links compartilháveis e histórico. A sincronização posterior do texto do
input com voltar/avançar é uma investigação separada (INV-005). Nota
**KZN-5D1E** lida e preservada.

### KZN-331 — Pedido saiu com o endereço errado

| Campo | Registro |
|---|---|
| **Causa** | `finalizar()` ignorava `enderecoId`, escolhido nos radios, e enviava o endereço principal ou o primeiro da lista. |
| **Como reproduzi** | Com endereço 1 principal e 2 selecionado, o payload original enviava `endereco_id: 1`. A reprodução isolada usou API simulada. |
| **Correção** | O POST passou a enviar `{ endereco_id: enderecoId, observacao }`. A seleção inicial e a seleção de endereço recém-salvo foram preservadas. O backend continua verificando posse e usando o endereço recebido no snapshot. |
| **Arquivos alterados** | `frontend/src/paginas/Checkout.jsx`; spec/plano em `docs/sdd/endereco-selecionado-no-checkout/`. |
| **Como validei a correção** | Payload informado pelo candidato mostrou `endereco_id: 2` após selecionar o endereço 2. Regressões existentes, build e checks do PR #7 passaram. Validação manual da correção confirmada na consolidação de 12/10/2026. |

**Limite da evidência:** o payload comprova a seleção enviada, sem comprovar
sozinho criação de pedido no SIAC. As suítes dessa etapa eram regressões
existentes, sem teste automatizado específico do componente de checkout.

---

## 3. Problemas que encontrei por conta própria

Os dez itens FIX abaixo foram corrigidos. Em cada “Corrigi?”, explico a mudança,
o motivo e o limite da solução. Os pontos INV ao final distinguem as mitigações da feature das investigações
e decisões que permanecem abertas.

### Problema 1 — Segredos literais e configuração com fallback (FIX-001)

| Campo | Registro |
|---|---|
| **O que estava errado** | Segredo JWT, token ERP e URL externa tinham fallback no código. A aplicação podia subir sem ambiente explícito, contornando o fail-fast documentado. |
| **Como cheguei nele** | Leitura de `config.js`, nota KZN-2B9C e comparação com `.env.example`; subprocessos isolados confirmaram o comportamento anterior. |
| **Impacto** | Credenciais compartilhadas no código e risco de executar contra o ambiente errado. A exposição existe independentemente de o token ainda ser válido. |
| **Corrigi?** | **Sim.** Removi literais e fallbacks; `JWT_SEGREDO`, `ERP_URL` e `ERP_TOKEN` passaram a ser obrigatórios. A inicialização rejeita placeholders, JWT curto e URL inválida sem imprimir valores. Mantive os defaults operacionais para não mudar contratos. O histórico de entrega foi separado do original. Revogação de credenciais externas depende do responsável pelo SIAC e não foi executada nesta correção. |
| **Arquivos alterados** | `backend/src/config.js`, `backend/.env.example`, `backend/tests/config.test.js`, `README.md`, `docs/ambiente.md`; SDD `configuracao-por-ambiente`. |
| **Validação** | Seis testes isolados passaram após cinco falhas na baseline. Manual: catálogo, login, F5, logout e encerramento com `JWT_SEGREDO` vazio confirmados, sem sobrescrever `.env`. |

### Problema 2 — CORS aceitava qualquer origem com credenciais (FIX-002)

| Campo | Registro |
|---|---|
| **O que estava errado** | `origin: true` refletia qualquer origem, apesar de existir `CORS_ORIGEM` na configuração. |
| **Como cheguei nele** | Segui a variável até `app.js` e comparei a política com o proxy Vite e a produção na mesma origem. |
| **Impacto** | Permissão excessiva de leitura entre origens. A exploração autenticada depende também dos cookies e da topologia. |
| **Corrigi?** | **Sim.** O middleware compara a origem exatamente com a configurada. Desenvolvimento/teste usam localhost:5173 como padrão; produção sem configuração não autoriza CORS entre origens. Validação fail-fast exige origem HTTP(S) canônica, sem caminho ou lista. Origens desconhecidas seguem as rotas sem headers de permissão; autenticação e posse continuam obrigatórias. Escolhi essa política para preservar o uso de mesma origem e evitar reflexão arbitrária. CORS não resolve CSRF nem substitui autorização. |
| **Arquivos alterados** | `backend/src/app.js`, `backend/src/config.js`, `backend/.env.example`, `backend/tests/cors-config.test.js`, `backend/tests/cors.test.js`, `docs/ambiente.md`; SDD `restricao-de-origem-cors`. |
| **Validação** | 24 testes novos de configuração/HTTP passaram, incluindo GET/OPTIONS, origens enganadoras, ausência de Origin, defaults e sessão. Manual do uso normal confirmado; não foi registrada exploração autenticada no navegador. |

### Problema 3 — Conversão monetária perdia centavos (FIX-003)

| Campo | Registro |
|---|---|
| **O que estava errado** | `Math.floor(Number(reais) * 100)` truncava aproximações binárias abaixo do inteiro esperado. |
| **Como cheguei nele** | A função original converteu 1,15 em 114 centavos, 4,10 em 409 e 19,99 em 1998. |
| **Impacto** | Subtotais, total do carrinho e vínculo local do pedido podiam perder centavos. |
| **Corrigi?** | **Sim.** Substituí `floor` por `round` no helper compartilhado, dentro do domínio aprovado de valores finitos não negativos com até duas casas. Soma e multiplicação continuam em centavos inteiros, com conversão para reais na API. Corrigir a função comum evita remendos separados nos consumidores. Não reescrevi pedidos históricos nem defini arredondamento para preços com precisão extra. |
| **Arquivos alterados** | `backend/src/lib/dinheiro.js`, `backend/tests/dinheiro.test.js`, `backend/tests/carrinho-total.test.js`, `backend/tests/pedido-dinheiro.test.js`; SDD `precisao-monetaria`. |
| **Validação** | Doze testes adicionados, incluindo ida/volta de 100.001 valores. Carrinho 3×1,15 + 2×4,10 = 11,65 e pedido simulado de 19,99 salvo como 1999 centavos. Manual confirmado em 12/10/2026. |

### Problema 4 — Última página bloqueada pela paginação (FIX-004)

| Campo | Registro |
|---|---|
| **O que estava errado** | `pagina >= totalPaginas - 1` desabilitava Próxima uma página antes do fim. |
| **Como cheguei nele** | A expressão original bloqueava a página 1 de 2 e a página 2 de 3. |
| **Impacto** | Parte do catálogo e do histórico ficava inacessível pelo botão de navegação. |
| **Corrigi?** | **Sim.** Corrigi a condição para `pagina >= totalPaginas` no componente compartilhado. Catálogo e pedidos recebem o mesmo ajuste sem duplicar lógica. Mantive Anterior, ocultação com zero/uma página e callbacks existentes. A correção é independente do reinício de página ao pesquisar (KZN-325). |
| **Arquivos alterados** | `frontend/src/componentes/ui.jsx`, `frontend/tests/paginacao.test.js`; SDD `ultima-pagina`. |
| **Validação** | Nove testes do componente real, HTML e callbacks passaram; os dois casos que bloqueavam a última página falhavam antes. Manual confirmado em 12/10/2026. |

### Problema 5 — Carrinho não acompanhava autenticação (FIX-005)

| Campo | Registro |
|---|---|
| **O que estava errado** | O provider carregava uma vez, sem observar login/logout ou descartar respostas antigas ao trocar de conta. Falhas de leitura viravam carrinho vazio. |
| **Como cheguei nele** | Leitura dos contextos e confirmação manual: sair de X e entrar em Y mantinha o carrinho de X até F5. |
| **Impacto** | Conteúdo, contador e total residuais entre contas no mesmo navegador. Não foi demonstrado vazamento pela API, que já filtrava proprietário. |
| **Corrigi?** | **Sim.** Associei o controlador à identidade e ao ciclo da sessão: limpa ao sair/trocar conta, carrega ao autenticar e invalida respostas/callbacks antigos. Visitante não consulta carrinho privado. Falhas de leitura aparecem com opção de tentar novamente e bloqueiam o checkout. Os chamadores interrompem mensagens/navegação de operações invalidadas. Isso corrige o ciclo do estado, além do sintoma resolvido por F5. Concorrência dentro da mesma sessão e checkout já enviado ao backend continuam fora desta unidade. |
| **Arquivos alterados** | `frontend/src/lib/carrinhoPorSessao.js`, `frontend/src/contextos/CarrinhoContext.jsx`, `frontend/src/paginas/Catalogo.jsx`, `frontend/src/paginas/Produto.jsx`, `frontend/src/paginas/Carrinho.jsx`, `frontend/src/paginas/Checkout.jsx`, `frontend/tests/carrinho-por-sessao.test.js`; SDD `carrinho-por-sessao`. |
| **Validação** | 27 testes determinísticos do controlador, incluindo dez respostas tardias, falhas e recarga. Troca X→logout→Y→logout→X sem F5 confirmada com itens, contador e total. Validação manual consolidada em 12/10/2026. |

### Problema 6 — Estoque reduzido impedia ajustar quantidade (FIX-006)

| Campo | Registro |
|---|---|
| **O que estava errado** | `disponivel=false` desabilitava o input tanto para estoque zero quanto para quantidade maior que o estoque positivo restante. |
| **Como cheguei nele** | Comparei a linha da interface com o enriquecimento do carrinho; reprodução no frontend confirmada pelo candidato. |
| **Impacto** | Com cinco unidades no carrinho e estoque três, a tela pedia ajuste, mas obrigava remover/adicionar novamente. |
| **Corrigi?** | **Sim.** O backend informa `quantidade_editavel` quando o produto está ativo e tem estoque positivo. A linha permite inteiro entre 1 e `min(99, estoque)`, mesmo que haja pendência. Estoque zero, inativo, ausente ou falha de consulta continuam sem edição; remoção segue disponível. Separei capacidade de editar de disponibilidade para comprar, sem liberar checkout indevidamente. O backend revalida e preserva o conflito se o estoque cair outra vez. |
| **Arquivos alterados** | `backend/src/services/carrinhoService.js`, `frontend/src/paginas/Carrinho.jsx`, `frontend/src/componentes/LinhaItemCarrinho.jsx`, `backend/tests/carrinho-total.test.js`, `frontend/tests/quantidade-carrinho.test.js`; SDD `ajuste-de-quantidade-com-estoque-reduzido`. |
| **Validação** | Nove testes backend e sete frontend adicionados. ERP simulado comprovou redução 5→3, recálculo e liberação do checkout; nova queda para dois gerou 409, sem alterar quantidade salva ou usuário alheio. Manual confirmado em 12/10/2026. |

### Problema 7 — Telefone opcional não podia ser removido (FIX-007)

| Campo | Registro |
|---|---|
| **O que estava errado** | `telefone \|\| atual.telefone` reaproveitava o contato antigo quando o campo era limpo. A rota também confundia omissão com limpeza. |
| **Como cheguei nele** | Serviço executado com banco simulado recebeu `null`, mas manteve o telefone anterior no UPDATE. |
| **Impacto** | O perfil indicava salvamento sem permitir remover o contato opcional. |
| **Corrigi?** | **Sim.** A rota valida telefone somente quando a propriedade está presente. O serviço preserva o anterior apenas para `undefined`; `null`, vazio ou espaços normalizados removem o valor. Corrigi as duas camadas porque trocar apenas o operador não distinguia intenção de apagar e campo omitido. Nome/documento e validação acumulada foram preservados, sem mudar schema. |
| **Arquivos alterados** | `backend/src/routes/perfil.js`, `backend/src/services/usuarioService.js`, `backend/tests/perfil-telefone.test.js`; SDD `remocao-de-telefone-do-perfil`. |
| **Validação** | 21 testes de serviço/HTTP com banco isolado: limpeza, omissão, edição, 422 sem atualização parcial, 401 e posse. Manual de apagar, salvar, F5 e editar novamente confirmado em 12/10/2026. |

### Problema 8 — Espaços tratados de forma inconsistente em senhas (FIX-008)

| Campo | Registro |
|---|---|
| **O que estava errado** | Cadastro/nova senha preservavam espaços; login e senha atual passavam por `trim`. |
| **Como cheguei nele** | Comparação das rotas e conferência com scrypt real: entrada original autenticava, versão aparada falhava. |
| **Impacto** | A mesma senha aceita no cadastro podia falhar no login ou impedir a troca. |
| **Corrigi?** | **Sim.** Criei `senhaDeAutenticacao()` e apliquei no login e na senha atual. O validador preserva a entrada, rejeita vazio/whitespace/tipo inválido e mede até 200 caracteres incluindo espaços. A política de criação continua separada da conferência de credencial existente. Mantive scrypt, NFKC e hashes já armazenados; não há tentativa alternativa com `trim`, migração ou ampliação das senhas aceitas. |
| **Arquivos alterados** | `backend/src/lib/validacao.js`, `backend/src/routes/auth.js`, `backend/src/routes/perfil.js`, `backend/tests/senha-autenticacao.test.js`; SDD `espacos-na-autenticacao-de-senha`. |
| **Validação** | Sete cenários agrupados de validador/HTTP com SQLite temporário e scrypt real. Cadastro/login, troca, limites, senha incorreta e isolamento passaram. Manual com senha de bordas e nova autenticação confirmado em 12/10/2026. |

### Problema 9 — Layout inadequado em telas pequenas (FIX-009)

| Campo | Registro |
|---|---|
| **O que estava errado** | Busca com mínimo de 380px disputava espaço com marca/menu; grade mantinha quatro colunas em qualquer largura. |
| **Como cheguei nele** | Reprodução visual como visitante: conteúdo de 702px numa área útil reportada de 341px, com cards comprimidos. |
| **Impacto** | Corte de ações e navegação difícil no celular. |
| **Corrigi?** | **Sim.** Retirei o mínimo fixo da busca, distribuí cabeçalho e ações em linhas abaixo de 1024px e adaptei a grade para uma, duas ou quatro colunas nos limites 640/1024px. Entrar/Criar conta ocupam metades iguais no celular. Mantive ações visíveis, paleta, handlers e ordem do DOM para resolver a restrição sem redesenhar a loja. A feature de carrinho na vitrine adapta a grade ao espaço lateral e acrescenta painel móvel, com evidência própria. |
| **Arquivos alterados** | `frontend/src/componentes/Cabecalho.jsx`, `frontend/src/paginas/Catalogo.jsx`; SDD `layout-responsivo-do-catalogo`. |
| **Validação** | Medidas como visitante em 320, 375, 390, 640, 768, 1024 e 1280px sem overflow horizontal da página. Busca/filtros, foco da busca e login em 375px conferidos. Validação manual confirmada em 12/10/2026. |

### Problema 10 — Documento e telefone sem prevenção de excesso (FIX-010)

| Campo | Registro |
|---|---|
| **O que estava errado** | Os inputs aceitavam entrada excessiva e só informavam o problema após a API rejeitar. `type=tel` não limitava tamanho nem formatava. |
| **Como cheguei nele** | Reprodução manual no cadastro com capturas de rejeição por campo e inspeção do mesmo padrão no perfil. |
| **Impacto** | Feedback tardio, retrabalho e preenchimento inconsistente, embora o backend já validasse. |
| **Corrigi?** | **Sim.** Criei funções compartilhadas e `CampoComMascara` para cadastro/perfil: CPF/CNPJ automático por quantidade de dígitos e telefone fixo/celular com DDD. Limites de 14/11 dígitos, preservação de zeros e tratamento de colagem, cursor e exclusão. Evitei `maxLength` que corta a colagem formatada antes de extrair os dígitos. Valores legados fora do domínio são preservados na carga até edição; telefone continua removível. Não adicionei DDI/ramal nem validação matemática de CPF/CNPJ. |
| **Arquivos alterados** | `frontend/src/lib/mascaras.js`, `frontend/src/componentes/CampoComMascara.jsx`, `frontend/src/paginas/Cadastro.jsx`, `frontend/src/paginas/Perfil.jsx`, `frontend/tests/mascaras.test.js`; SDD `limites-de-documento-e-telefone`. |
| **Validação** | 26 testes novos de funções reais, incluindo posições de exclusão junto à pontuação. Conferência de entrada/colagem/exclusão no cadastro e confirmação manual do candidato nas duas telas, incluindo remoção e persistência de telefone. |

### Pontos adicionais e limites remanescentes

INV-001/002 foram tratados no escopo de múltiplos carrinhos; a recuperação
remota continua limitada ao que o SIAC permite comprovar. INV-003/004/005
seguem abertos, com decisão ou reprodução pendente.

| Referência | Estado atual | Limite ou próximo passo |
|---|---|---|
| **INV-001 — Checkout concorrente/repetido** | Mitigado por tentativa persistente, bloqueio exclusivo e replay sem segundo POST | Não garante idempotência remota; resultado incerto exige verificação |
| **INV-002 — Alteração durante checkout** | Mitigado por bloqueio por carrinho e revalidação antes da gravação; limpeza só da origem | Outros carrinhos continuam úteis; não há atomicidade entre loja e SIAC |
| **INV-003 — Endereço sem principal** | Comportamento localizado; regra de produto aberta | Decidir permitir nenhum ou exigir exatamente um principal |
| **INV-004 — Erro persistente em pedidos** | Evidência estática de erro que não é limpo em nova consulta/sucesso | Reproduzir falha→sucesso no mesmo componente antes de corrigir |
| **INV-005 — Texto da busca fora de sincronia** | Evidência estática; campo inicializa pela URL uma vez | Reproduzir histórico/limpeza e definir sincronização sem apagar rascunho |

Causas, grau de evidência e próxima ação estão em [fix.md](fix.md).
Os três INV abertos não são considerados resolvidos por validação geral dos
fluxos normais.

---

## 4. Múltiplos carrinhos

### Resultado e decisões

**Implementado e integrado à main no PR #17**, commit de merge `76eca4d`.
A vitrine permite criar, selecionar, renomear, excluir e editar carrinhos sem
sair dos resultados. A página /carrinho reutiliza gestão e conteúdo do painel.

| Pergunta do enunciado | Decisão implementada | Motivo |
|---|---|---|
| Quantos carrinhos? | Até dez por conta, incluindo vazios; 50 produtos e 99 unidades por produto em cada um | Atender orçamentos paralelos com custo limitado |
| Excluir o ativo? | Selecionar o mais antigo restante, por criado_em e id | Substituição previsível |
| Excluir o principal ou o último? | Promover o mais antigo; último gera “Meu carrinho” vazio/principal | Manter destino válido na próxima entrada |
| Vitrine desktop? | Painel lateral recolhível a partir de 1024px | Conferir e editar enquanto escolhe peças |
| Celular? | Botão inferior abre painel sobreposto, com foco contido e Escape | Preservar espaço para produtos |
| Qual vem selecionado? | Principal persistido; ativo independente por aba/ciclo. F5 volta ao principal | Uma aba não muda o destino da outra |
| Depois do pedido? | Manter nome/ID/principal e esvaziar apenas o carrinho comprado | Reutilizar orçamento sem afetar os demais |
| Destino da adição? | Direto ao ativo, com escolha alternativa que o torna ativo | Um clique no fluxo comum, destino explícito quando necessário |

Criar/renomear aceita 1–60 caracteres após trim. Nomes repetidos são permitidos;
o ID identifica a lista. Exclusão com itens pede confirmação; cancelar não
altera conteúdo. Seleção do painel preserva busca, categoria, página e rolagem.

### Modelagem e contrato

- `carrinhos`: proprietário, nome, principal, versão e datas.
- `carrinho_itens`: referência ao carrinho, código ERP e quantidade, com
  unicidade em (carrinho_id, codigo_produto). Não congela preço ou estoque.
- `checkout_tentativas`: identidade por usuário, origem/versionamento,
  assinatura da confirmação, snapshot de entrega, estado e número ERP conhecido.
  Não guarda catálogo ou pedido ERP completo.
- `pedidos_usuario`: vínculo e snapshots anteriores preservados.

A migração transacional converte o carrinho legado para “Meu carrinho” por
conta, preservando IDs, códigos, quantidades e datas. Não há reset.
Testes partem do schema legado, verificam endereço/vínculo, repetição e rollback.
Isso comprova migração sintética, sem afirmar migração/backup do banco de uso local.

A API usa `/api/carrinhos/:id` para leitura/mutações explícitas.
POST /pedidos recebe carrinho_id, versao_carrinho, tentativa_id, endereco_id e
observacao. O contrato antigo /api/carrinho responde 409 CARRINHO_OBRIGATORIO,
orientando recarga, sem escolher o principal silenciosamente.
Rotas completas e erros estão em [ARQUITETURA.md](ARQUITETURA.md#endpoints).

### Isolamento, concorrência e recuperação

Posse é verificada no backend para carrinhos, itens, endereços, pedidos e
estado de checkout. O controlador frontend invalida respostas por ciclo,
seleção e sequência, compara ID/versão e serializa mutações por carrinho.

Antes de criar pedido no SIAC, a loja registra tentativa/bloqueio persistente.
O backend impede alteração/exclusão da origem durante envio ou verificação;
mutações iniciadas antes revalidam o bloqueio depois de consultar o ERP.
Outros carrinhos continuam disponíveis. Mesma tentativa concluída retorna
o vínculo sem novo POST, inclusive após reabrir o SQLite.

Sucesso atomiza vínculo, limpeza da origem, versão e conclusão local.
Recusa conclusiva preserva itens e libera edição. Transporte/5xx/sucesso inválido
ou falha local após possível criação conservam bloqueio e “Pedido em verificação”.
Número válido recebido com total inválido é preservado quando possível.
F5, reinício e tempo decorrido não liberam ou reenviam automaticamente.

Não há transação distribuída nem promessa de idempotência remota. Proteção
local pressupõe processos compartilhando o mesmo SQLite; reconciliação exige
evidência do SIAC. [Roteiro operacional](docs/sdd/multiplos-carrinhos/recuperacao.md).

### Revisão e evidências

A v1 foi validada manualmente pelo candidato em 13/10/2026. A revisão posterior
identificou quatro falhas e a v2 as corrigiu com TDD: lista antiga sobre seleção
nova, mutação regredindo versão, fila global e perda de número ERP parcial.
Foram acrescentadas 22 regressões, treze frontend e nove backend.
Os cenários reproduzidos passaram após as correções.

[Spec e plano](docs/sdd/multiplos-carrinhos/spec.md),
[revisão](docs/sdd/multiplos-carrinhos/revisao.md) e
[evidências visuais](docs/sdd/multiplos-carrinhos/validacao-visual.md) registram
RED/GREEN, seis larguras, foco/Escape, duas abas, URL/rolagem, compra fake e
pedido incerto. A v2 tem ensaio simulado; não há nova confirmação humana
específica da v2 ou homologação SIAC registrada.

---

## 5. Como testei

### Validação manual

Realizei a validação manual das correções e confirmei sua conclusão em
12/10/2026. Os caminhos descritos nas confirmações anteriores incluem:

- Login, catálogo, F5 com sessão persistida, logout e falha de inicialização
  quando `JWT_SEGREDO` está vazio.
- Carrinho com linha indisponível e conferência de total; alterações/remoções
  acompanhando contador 7→5→3→0 e releitura após F5.
- Seleção de endereço diferente do principal e inspeção do payload enviado.
- Troca X→logout→Y→logout→X sem F5, conferindo itens, contador e total.
- Remoção de telefone, salvar/F5 e edição de um novo valor válido.
- Cadastro/login e troca de senha preservando espaços nas bordas.
- Layout de telas pequenas e ajuste de Entrar/Criar conta em metades iguais.
- Documento/telefone nas telas de cadastro e perfil, colagem/edição e remoção
  de telefone com persistência.

A confirmação consolidada também cobre as correções que os registros antigos
ainda classificavam como manual pendente: busca/paginação, precisão monetária,
última página e ajuste de quantidade. Os roteiros estão nos respectivos planos;
a confirmação geral não acrescenta capturas ou medições por variante.

Não foi registrado deploy, homologação completa do contrato SIAC, auditoria
completa de acessibilidade ou matriz de autofill/IME/teclado virtual. Os testes
automatizados não criam pedidos no ERP real. A evidência específica de endereço
é o payload informado, sem alegação adicional de pedido real criado.

### Testes automatizados e build

Na reavaliação local de **13/10/2026**, a suíte atual passou com
**123/123 testes backend, 94/94 frontend e build de 67 módulos**, usando Node
24.14.1. Código e lockfiles conferidos contra a main 76eca4d. O build dessa
reavaliação foi direcionado a /private/tmp para preservar o dist local.
Estes resultados antecedem a edição documental; não representam uma nova CI.

| Área | O que os testes verificam |
|---|---|
| Backend | Configuração, CORS, dinheiro, total/contador/estoque, autenticação/perfil, posse, migração, gestão de carrinhos, bloqueio/concorrência/replay e recuperação com ERP fake. |
| Frontend | Parâmetros da URL, controlador por sessão/seleção, ordem de respostas e filas por carrinho, paginação, quantidade e máscaras. Há testes de funções e componentes isolados; não uma suíte E2E completa. |
| Build | Compilação do frontend com Vite; não substitui navegação manual. |

Para reproduzir a partir da raiz, use terminais separados:

```sh
cd backend
npm ci
npm test
```

```sh
cd frontend
npm ci
npm test
npm run build
```

Os testes backend usam configuração sintética e SQLite em memória/temporário;
as chamadas ao ERP são simuladas ou bloqueadas. Algumas suítes HTTP abrem porta
local efêmera. O frontend testa módulos reais com Node e, quando necessário,
transformação pelo Vite existente. `.env` e banco de uso local não são fixtures.

O workflow `Validacao` executa testes backend, testes frontend e build em PRs
para `main` e pushes na `main`, com Node 24.14.1. Resultados de CI por unidade
estão nos registros SDD; a implementação da feature teve checks aprovados no
[run 38360777053](https://github.com/eduardofrois/kaizen-test/actions/runs/38360777053).
O merge do PR #17 foi confirmado no Git; não foi consultada a CI de main
nesta revisão.

---

## 6. Decisões e suposições

- Corrigi na camada responsável: agregações e dinheiro no backend; parâmetros,
  seleção de endereço e apresentação no frontend; sessão no ciclo do provider.
- Mantive JavaScript ESM, nomes em português, `ApiError`, envelope de erro e
  `ColetorDeErros`. Não troquei stack, paleta ou biblioteca de formulários.
- Mantive o SIAC como fonte de produtos, preço, estoque e pedidos. Carrinho não
  congela preço nem reserva estoque; checkout pode receber conflito posterior.
- Separei contagem de unidades, valor disponível e capacidade de editar. Cada
  campo responde a uma pergunta diferente, sem esconder linhas com pendência.
- Usei spec/plano por unidade e aprovação explícita antes de alterar aplicação.
  Documentação e validação não concedem autorização automática de publicação.
- Priorizei testes que reproduzem causas e riscos, com dados sintéticos, sem
  expor credenciais ou depender do estoque real.

Discordei dos fallbacks de segredos, da reflexão arbitrária de CORS e do
tratamento de falha técnica como carrinho vazio; as correções estão descritas
acima. A política de endereço principal continua aberta. As decisões de múltiplos
carrinhos estão implementadas e registradas na seção 4. Valores monetários com mais de duas casas exigem regra
própria, além do domínio desta correção.

---

## 7. O que faria com mais tempo

Com o requisito de múltiplos carrinhos implementado, priorizaria:

1. Testes automatizados de interação React para endereço selecionado,
   troca de conta/carrinho, recuperação do checkout e foco do painel.
2. Fechar INV-003/004/005 com decisões e reproduções controladas; melhorar
   recuperação operacional de tentativas incertas conforme contrato do SIAC.
3. Ampliar acessibilidade e dispositivos reais; medir custo das consultas ERP
   antes de decidir cache ou consulta em lote.

Pagamento, frete, nota fiscal, recuperação/confirmação de e-mail e consulta
externa de CEP continuam limitações de escopo já conhecidas do projeto.

---

## 8. Outras observações

As três notas de revisão encontradas no código foram lidas e preservadas:

| Identificador | Arquivo | Relação com o trabalho |
|---|---|---|
| **KZN-2B9C** | `backend/src/config.js` | Configuração, segredos e política de origem. |
| **KZN-7F3A** | `backend/src/services/carrinhoService.js` | Total, contador e capacidade de ajuste. |
| **KZN-5D1E** | `frontend/src/componentes/Cabecalho.jsx` | Busca, contador e layout responsivo. |

Usei IA como apoio de investigação, implementação e documentação, conforme
permitido. As decisões foram revisadas por unidade. O histórico detalhado
permanece em [docs/historico](docs/historico/README.md) e nas specs/planos;
`fix.md` e `docs/investigacao.md` mostram o estado atual. Registros antigos de
pendência manual foram complementados pela confirmação de 12/10/2026, sem
atribuir ensaios individuais às variantes ainda sem prova específica.

Publicação do código no GitHub e deploy são resultados distintos. O enunciado
menciona “colocar a aplicação no ar”, sem definir hospedagem pública, domínio
ou provedor. Registrei execução local e não declarei deploy público.
A revisão documental foi solicitada pelo usuário. Em 13/10/2026, foi
autorizada sua publicação por PR para main; o merge permanece manual.

---

## 9. Estimativa de tempo das correções

As correções foram trabalhadas em 11 e 12/10/2026. Reconstruí os intervalos
pelos horários dos commits: usei o primeiro registro documental da unidade
quando disponível e, nos demais casos, o merge anterior como referência de
início, até o commit de implementação ou validação. Esses marcos aproximam
investigação, SDD, implementação e validação, mas não medem cada etapa nem
permitem separar trabalho ativo de pausas e espera por aprovação.

| Demanda | Intervalo estimado |
|---|---:|
| FIX-001 — Configuração por ambiente | 41 min |
| KZN-312 — Total do carrinho | 17 min |
| KZN-318 — Contador de unidades | 17 min |
| KZN-325 — Busca e paginação | 28 min |
| KZN-331 — Endereço do checkout | 24 min |
| FIX-005 — Carrinho por sessão | 71 min |
| FIX-003 — Precisão monetária | 15 min |
| FIX-004 — Última página | 5 min |
| FIX-006 — Ajuste com estoque reduzido | 2h40 |
| FIX-007 — Remoção de telefone | 12 min |
| FIX-008 — Espaços na autenticação de senha | 21 min |
| FIX-009 — Layout responsivo | 15 min |
| FIX-002 — Restrição de origem CORS | 21 min |
| FIX-010 — Máscaras de documento e telefone | 11 min |

A soma arredondada é aproximadamente **9h20**, com média de **40 minutos**.
O intervalo de 2h40 da FIX-006 pode incluir pausas; sem ele, a média dos outros
13 intervalos fica em aproximadamente 30 minutos. Mantive esse intervalo no
total, pois não há registro que permita descontar pausas com precisão.

Esta estimativa não representa o esforço total do desafio: não contabiliza
separadamente o estudo inicial, a pipeline, a organização documental, esperas
após a implementação, a resolução posterior de conflitos, o deploy ou a
funcionalidade de múltiplos carrinhos. O tempo ativo da feature não foi medido
e não foi acrescentado ao total. Não mantive um controle de horas ativas para
afirmar um total exato de dedicação.
