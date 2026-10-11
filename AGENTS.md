# Instruções de trabalho — Kaizen

## Contexto obrigatório

Antes de trabalhar, leia `README.md`, `ARQUITETURA.md`, `RELATORIO.md`,
`fix.md`, `docs/ai/arch.md`, `docs/ai/boundaries.md` e `docs/sdd/README.md`.
Leia também a spec e o plano da unidade em andamento. Confira o Git e as
alterações locais antes de editar. Instruções diretas do usuário prevalecem.

## Aprovação e SDD

- Toda correção e funcionalidade precisa de
  `docs/sdd/<nome-descritivo>/spec.md` e `plan.md`.
- Nomeie pastas e branches pelo objetivo, em minúsculas com hífens, como
  `configuracao-por-ambiente` ou `total-do-carrinho`. IDs FIX/KZN ficam nos
  metadados para rastreabilidade, não como único nome do trabalho.
- Investigar e preparar documentação não autoriza implementar.
- Só altere código, testes, dependências, contratos ou schema após aprovação
  explícita do usuário para implementar a versão revisada de spec e plano.
- Registre data, escopo e referência da aprovação nos documentos. A IA não
  pode atribuir aprovação ao usuário por conta própria.
- Mudanças materiais de escopo, comportamento, modelo ou risco exigem nova
  revisão; ajustes de redação e execução dentro do plano aprovado não exigem.
- Não confunda aprovação da estrutura documental com aprovação dos bugs ou
  das propostas de múltiplos carrinhos.
- Use os modelos em `docs/sdd/_templates/`. Eles são modelos, não specs aprovadas.

## Implementação

- Preserve JavaScript ESM, nomes em português e os padrões existentes.
- Rotas cuidam de HTTP e validação; serviços cuidam das regras de negócio;
  `backend/src/erp/cliente.js` centraliza o acesso ao SIAC.
- Preserve `ApiError`, o envelope de erro e `ColetorDeErros`.
- Toda operação privada valida o proprietário no backend. IDs vindos do
  cliente nunca substituem essa validação.
- Dinheiro deve ser calculado em centavos inteiros. Não aceite preços
  enviados pelo navegador como fonte de verdade.
- O ERP é dono de produtos, preços, estoque e pedidos. Não modifique o SIAC
  nem crie cópias permanentes desses dados sem decisão aprovada.
- Preserve busca, filtros e página na URL e a identidade visual documentada.
- Não faça refatoração ou troca de stack sem relação com a unidade aprovada.

## Validação e comunicação

- Prefira verificações focadas nos critérios de aceite e regressões reais.
- Use ERP simulado e SQLite isolado nos testes. Não crie pedidos no ERP real
  como efeito colateral de uma suíte.
- Distinga inspeção estática, verificação isolada e teste integrado/manual.
- Não declare build, teste, deploy ou correção sem execução e evidência.
- Ao concluir cada etapa SDD, atualize o estado de spec/plan, checkboxes,
  evidências e pendências antes do commit. Diferencie validação de publicação.
- Atualize `fix.md` ao investigar/implementar/validar; mantenha o relatório
  coerente com resultados reais quando sua edição estiver autorizada.
- Comunique causa raiz, resultado, validação e limitações em português.
- Não delegue a subagentes automaticamente; siga a autorização da sessão.

## Segredos, banco e Git

- Nunca copie valores de `.env`, tokens, cookies, hashes ou credenciais para
  documentos, commits, logs compartilhados ou respostas.
- Antes de publicar, confira o conteúdo completo e o histórico que serão
  enviados. Nunca publique credenciais literais. `.gitignore` não remove
  segredos do código nem arquivos já rastreados.
- Banco local, WAL/SHM, dependências e build são arquivos gerados; siga o
  `.gitignore`. Não execute `db:reset` nem apague dados sem autorização.
- Migrações devem preservar contas, endereços, itens e vínculos de pedidos.
- Use branches `<tipo>/<assunto>`, sem prefixo codex, com tipos alinhados
  a Conventional Commits: fix, feat, ci, docs, refactor, test ou chore.
  Exemplo: `fix/configuracao-por-ambiente`. Commits seguem `tipo: descrição`.
- Publique as branches de trabalho no repositório do candidato; os merges
  serão feitos manualmente pelo usuário no GitHub. Não integrar na main
  sem nova instrução explícita.
- Não use `git add .` sem revisar arquivos. Não use force push, descarte
  alterações do usuário nem publique no repositório original da empresa.
- Autorização para um envio não concede autorização permanente para publicar
  qualquer mudança. Confira o escopo autorizado na sessão e nos registros SDD.

## Responsabilidade dos documentos

- Este arquivo contém apenas instruções duradouras para trabalhar no projeto.
  Não registrar aqui aprovações, status de tarefas, resultados, commits ou PRs.
- Specs e planos registram escopo, aprovação, execução e validação da unidade.
- `docs/investigacao.md` registra situação atual, pendências e próxima ação.
- Escolhas e justificativas ficam na spec/plano da unidade; arquitetura geral
  fica em `docs/ai/arch.md`.
- `RELATORIO.md` registra resultados e evidências para a entrega.
- `fix.md` detalha achados, causas, reproduções e estado das correções.
- Consulte os documentos da unidade e a sessão para autorizações pontuais;
  não transforme essas autorizações em regras permanentes neste arquivo.
