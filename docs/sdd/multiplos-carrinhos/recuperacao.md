# Migração e recuperação — múltiplos carrinhos

## Migração

`aplicarSchema()` usa `migrarBanco()` no bootstrap e no db:init. A conversão
legada ocorre em transação IMMEDIATE: renomeia tabela antiga, cria modelo,
cria principal por conta, copia os itens com IDs/quantidades/datas preservados,
compara conteúdo, confere chaves estrangeiras e só então conclui user_version=1.
Versão futura é rejeitada; repetir não duplica carrinhos/itens.

Antes de aplicar em dados reais, gerar backup consistente pela API
`Database.backup(destino)` do better-sqlite3, usando conexão somente de leitura
e destino protegido. Não copiar somente o .db enquanto houver WAL ativo.
Confirmar recuperação em uma cópia isolada e interromper processos antigos
antes de publicar o novo backend/frontend juntos. Nunca executar db:reset.

Falha na conversão reverte a transação, inclusive a renomeação. Depois de
novas gravações no modelo novo, não iniciar código antigo sobre esse banco
nem restaurar backup descartando dados recentes. Preferir correção progressiva;
intervenção real requer autorização específica e inventário dos dados afetados.

## Pedido em verificação

A intenção fica em checkout_tentativas antes de enviar ao SIAC. Estados
preparando/enviando/incerto impedem alterações e novo checkout da origem.
Não expiram. Reinício não reenfileira o POST; GET de estado e leitura do
carrinho conservam essa proteção. Outros carrinhos continuam disponíveis.

Na loja, conferir nome/ID do carrinho e situação apresentada. No suporte:

1. Identificar proprietário e tentativa no banco por conexão protegida, sem
   copiar dados pessoais, assinatura da requisição ou credenciais para logs
   compartilhados. Registrar referência operacional, não o conteúdo sensível.
2. Se há número ERP, consultar o pedido no SIAC por `buscarPedido(numero)` e
   confirmar proprietário, conteúdo e entrega com evidência da tentativa.
   A loja não presume que outro pedido com itens parecidos seja o mesmo.
   A partir da revisão v2, número válido recebido com total inválido também
   fica registrado: a tentativa continua incerta, sem vínculo ou limpeza.
   Número presente não comprova conclusão nem torna o total parcial confiável.
3. Com criação comprovada, registrar o número com `registrarNumeroErp()` e
   chamar `concluirTentativa()` com dados confirmados do SIAC e conexão do
   banco correto. A função valida identidade/número e atomiza vínculo,
   limpeza da origem, versão e conclusão. Não enviar novamente ao ERP.
4. Com prova de que não houve criação, usar `recusarTentativa()` após a
   decisão autorizada, documentando sua referência. Itens ficam preservados;
   cliente consulta situação e pode confirmar uma nova tentativa.
5. Se não há número e o SIAC não oferece consulta confiável por referência,
   manter o bloqueio até confirmação do responsável pelo ERP. Tempo decorrido,
   ausência na listagem local ou carrinho cheio não provam não criação.

Essas funções são internas e não têm rota pública de desbloqueio. O roteiro
não autoriza intervenção em dados reais, mudança de estado sem evidência ou
reenvio cego. Não existe garantia distribuída de execução exatamente uma vez.
O índice SQLite exclusivo protege processos que compartilham esse mesmo banco;
instâncias com arquivos independentes não compartilham a proteção.

## Ensaios executados — 2026-10-13

- `migracao-carrinhos.test.js`: legado com duas contas, item, endereço e pedido;
  reexecução; erro de integridade revertendo conversão; versão futura rejeitada.
- `checkout-carrinhos.test.js`: timeout, 5xx, sucesso inválido e falha local
  mantêm itens/bloqueio; replay confirmado não faz outro POST; reabertura do
  arquivo e conexão independente mantêm proteção; pedido reconciliado
  sinteticamente conclui sem POST. Chave antiga continua após excluir carrinho.
- `multiplos-carrinhos.test.js`: duas criações concorrentes disputam a última
  vaga; duas exclusões concorrentes deixam exatamente um principal e um carrinho.

Somente SQLite temporário e ERP fake. Nenhuma reconciliação, backup/restauração
ou criação de pedido no SIAC real foi executada pela suíte desta unidade.
