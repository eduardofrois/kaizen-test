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
- A nota KZN-2B9C marca configuração com credenciais literais na baseline.
  Antes de publicar a aplicação, resolva FIX-001 por SDD e confira o conteúdo
  completo e o histórico que serão enviados. `.gitignore` não remove segredos
  do código nem arquivos já rastreados.
- Banco local, WAL/SHM, dependências e build são arquivos gerados; siga o
  `.gitignore`. Não execute `db:reset` nem apague dados sem autorização.
- Migrações devem preservar contas, endereços, itens e vínculos de pedidos.
- Use branches `codex/<assunto>` e commits pequenos por unidade de trabalho.
- Não use `git add .` sem revisar arquivos. Não use force push, descarte
  alterações do usuário nem publique no repositório original da empresa.
- A inicialização/envio inicial ao repositório do candidato foi autorizada;
  isso não concede autorização permanente para publicar qualquer mudança.

## Estado de aprovação em 2026-10-11

A estrutura documental, `fix.md` e o preenchimento inicial de `RELATORIO.md`
foram autorizados. A aprovação do relatório veio na mensagem: "aprovo o
preenchumento inicial, vai fazendo as alteracoes enquanto eu avalio sobre a
config do ambiente". Registrar evidências reais e manter resultados pendentes
identificados. A correção `configuracao-por-ambiente` foi explicitamente
aprovada em 2026-10-11, junto da criação de `backend/.env` local e atualização
do relatório. Demais correções e múltiplos carrinhos aguardam SDD aprovado.
Veja `docs/investigacao.md` para retomar.
