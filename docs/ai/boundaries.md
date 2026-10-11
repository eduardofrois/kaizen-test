# Limites e invariantes

## Escopo e autorização

- Implementação de bugs/features só após spec + plan e aprovação explícita.
- Documentação aprovada não autoriza alterações de comportamento.
- Inspeções devem evitar mutações no ERP, banco real e arquivos de ambiente.
- O usuário pode decidir por uma correção menor ou por apenas documentar um
  problema; registre os motivos, sem ampliar o escopo automaticamente.

## Domínio

- SIAC externo: fonte de catálogo, preço, estoque e pedidos. Não está sob
  nosso controle. Não prometer atomicidade, cancelamento, reserva ou idempotência
  que seu contrato não demonstra.
- Loja: contas, endereços, carrinhos e vínculos de pedidos.
- Preço não congela no carrinho. Guardar apenas referência e quantidade.
- Carrinho não reserva estoque; o checkout pode receber conflito do ERP.
- Snapshot do endereço do pedido não muda quando o cadastro é editado.
- Sem pagamento, frete, nota fiscal ou recuperação de senha neste escopo.

## Camadas e contratos

- Rotas: sessão, leitura HTTP, validação acumulada, status e serialização.
- Serviços: regras de negócio e operações persistentes.
- Cliente ERP: tradução de falhas e comunicação com o sistema externo.
- Bibliotecas: utilidades pequenas; dinheiro em centavos inteiros.
- Frontend: interação e exibição; backend mantém autoridade sobre dados.
- Erros: `{ erro: { codigo, mensagem, detalhes? }, request_id }`.
- ERP 401 vira erro 502 da loja; 404/409/422 de negócio são preservados.
- Falha técnica não deve ser apresentada como carrinho vazio ou ausência de
  produto sem distinguir sua origem. A baseline ainda tem casos assim.

## Isolamento

- Autenticar usuário no backend e verificar posse em toda operação privada.
- Carrinho futuro deve pertencer ao usuário autenticado; seus itens devem
  pertencer ao carrinho solicitado. Não confiar em usuario_id do payload.
- Operações em andamento precisam manter identidade do usuário/carrinho de
  origem; respostas antigas não podem substituir estado de outra seleção.
- Checkout deve afetar apenas o carrinho/conteúdo aprovado para aquela operação.
- Não tratar guarda React como barreira de segurança.

## Segurança e arquivos

- Segredos apenas em ambiente do backend; valores nunca vão para frontend,
  documentação, Git ou logs compartilhados.
- `.env.example` pode conter nomes e placeholders, nunca credenciais reais.
- `.gitignore` não sanitiza histórico ou código já rastreado.
- Não publicar a baseline de `config.js` enquanto houver credenciais literais.
- Não alterar CORS, trust proxy ou sessão por suposição sobre o deploy:
  especificar ambiente e comportamento pretendido.
- Não executar reset do banco, força de push ou remoção de histórico sem
  autorização. Preservar recuperação ao reinicializar o Git autorizado.

## Interface

- Preservar paleta e padrões de componentes existentes.
- `marca-500` representa a marca; texto pequeno usa marca-700 ou mais escuro
  nas combinações documentadas. Verificar as cores efetivamente renderizadas.
- Busca, categoria, disponibilidade e página vivem na URL.
- Mudança de filtros deve respeitar uma página válida; trocar carrinho não
  deve reiniciar busca, navegação ou rolagem na vitrine.
- Testar teclado, foco e larguras pequenas no painel de múltiplos carrinhos.

## Evidência e entrega

- Fonte de requisitos: README. Intenção arquitetural: ARQUITETURA.
- Fonte detalhada dos achados: fix.md. Índice de situação: docs/investigacao.md.
- Escolhas por unidade: spec e plano SDD. Arquitetura geral: docs/ai/arch.md.
- Entrega para avaliadores: RELATORIO.md.
- Não chamar hipótese de bug confirmado nem simulação de teste de produção.
- Preservar os identificadores KZN-2B9C, KZN-7F3A e KZN-5D1E no registro de
  leitura e, quando autorizado, no resumo de entrega.
