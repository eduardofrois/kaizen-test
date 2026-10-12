# Spec — Precisão monetária

**Versão:** 1
**Estado:** Validado localmente — PR #9 aberto; CI da implementação passou
**Baseline/data:** d040365; 2026-10-11
**Origem:** FIX-003 — Conversão de reais para centavos perde dinheiro
**Branch:** fix/precisao-monetaria
**Aprovação do desenho:** 2026-10-11; usuário: “aprovado”, após apresentação da spec.
**Aprovação para implementar:** 2026-10-11; usuário “aprovado”, após apresentação do plano versão 1.

## Problema e evidência

backend/src/lib/dinheiro.js/paraCentavos usa Math.floor(Number(reais) * 100).
Representação binária de 1.15 gera 114.99999999999999; floor devolve 114.
Execução isolada nesta preparação confirmou 0.29→28 e 1.15→114. Registros
anteriores também demonstraram 4.10→409 e 19.99→1998.
Consumidores: carrinhoService calcula subtotal unitário×quantidade e total;
pedidoService armazena valor_total_centavos retornado pelo ERP.
O carrinho reconverte subtotais em reais ao agregar, permitindo nova perda.
Pull realizado; main inclui PR #8 no merge d040365.

## Objetivo e domínio suportado

Converter preços/totais monetários finitos, não negativos, expressos em reais
com até duas casas decimais, para centavos inteiros sem perder centavos pela
aproximação binária. Preservar compatibilidade com string numérica decimal
atualmente aceita por Number. Valores, multiplicações e somas devem permanecer
no intervalo de inteiros seguros do JavaScript.

Este domínio é a hipótese explícita desta unidade para os valores monetários
usuais do catálogo. A implementação do ERP não está disponível para confirmar
validação de escala. Valores com mais de duas casas, negativos, inválidos,
Infinity/NaN e política de arredondamento fiscal não terão novos contratos
ou validações neste trabalho; devem ser especificados se necessários.

## Escopo e invariantes

- REQ-01: substituir truncamento por arredondamento ao centavo mais próximo
  na função compartilhada, dentro do domínio de duas casas definido acima.
- REQ-02: manter paraReais e contratos em reais no JSON; preservar Number
  como representação pública, sem mudar API para string ou centavos.
- REQ-03: preços convertidos são multiplicados pela quantidade e somados em
  centavos inteiros; sem soma direta de reais no carrinho.
- REQ-04: preservar KZN-312 (pendências fora do total), KZN-318 (contador),
  posse e bloqueio do checkout; preço nunca vem do navegador como autoridade.
- REQ-05: novos vínculos locais usam conversão corrigida do total ERP, sem
  recalcular/substituir total do ERP. Não reparar históricos automaticamente.
- REQ-06: sem dependência, schema, reset, alteração do SIAC ou pedido real em
  teste. Usar módulo real e serviço com SQLite em memória/ERP simulado.

Fora: dinheiro negativo, descontos/frete/impostos novos, arredondamento de
três ou mais casas, saneamento genérico de entradas inválidas, migração de
valores históricos, transformação geral do contrato ERP e biblioteca decimal.

## Desenho proposto e alternativas

Proposta: Math.round(Number(reais) * 100) na fronteira compartilhada. Para
valores do domínio aprovado, aproximações de 114.99999999999999 voltam a 115.
Não acrescentar EPSILON como correção universal: não define política decimal
para qualquer magnitude/escala. Manter soma/multiplicação já existentes em
centavos e provar estabilidade das reconversões feitas pelo carrinho.

Alternativa: parser decimal/biblioteca para entradas de precisão arbitrária.
Exigiria contrato de escala/arredondamento, tratamento de strings/exponentes
e ampliação do escopo sem necessidade demonstrada nesta unidade.
Alternativa: corrigir somente exibição arredondando totais. Não corrige
subtotal nem armazenamento local, então foi descartada.

## Contratos, dados e riscos

Assinaturas paraCentavos(reais) e paraReais(centavos) preservadas. Sem mudança
HTTP, frontend, schema ou migração. Totais antigos já persistidos podem conter
perda e não serão alterados; correção vale para cálculos e gravações futuras.
Teste 1.005*100 mostra limite: Math.round retorna 100, não 101. Esse valor está
fora do domínio desta unidade; não afirmar suporte universal a precisão extra.

## Critérios de aceite

- [x] AC-01: 0.29→29, 1.15→115, 4.10→410, 19.99→1999, zero e preços inteiros.
- [x] AC-02: string decimal suportada e ida/volta paraCentavos(paraReais(c))
  conserva centavos de uma faixa representativa, sem alegar exaustão de Number.
- [x] AC-03: serviço real: 3×1.15 + 2×4.10 = 11.65; subtotais 3.45 e 8.20;
  linha indisponível de 19.99 continua excluída e bloqueia checkout.
- [x] AC-04: gravação de novo vínculo, em banco isolado e ERP fake, conserva
  valor_total ERP de 19.99 como 1999; endereço/posse e limpeza preservados.
- [x] AC-05: regressões backend/frontend e build passam; evidências distinguem
  cálculo isolado, serviço simulado e confirmação manual quando houver.

## Estratégia de validação e entrega

Testes unitários do módulo de dinheiro; regressão do carrinho no harness
existente; pedido com ERP simulado e SQLite em memória para verificar coluna.
Sem rede ERP ou .env real. Roteiro manual opcional compara subtotal/total com
preços da interface, sem confirmar pedido real. Verificações não alteram dados
locais. Atualizar fix.md, relatório e investigação com resultados reais.

## Revisão e histórico

Versão 1 do desenho aprovada pelo usuário em 2026-10-11, incluindo domínio
de duas casas e ausência de reparo histórico. Plan.md preparado para revisão;
nenhum código/teste alterado. Aprovação do plano de implementação pendente.

## Implementação e evidências — 2026-10-11

Plano versão 1 aprovado explicitamente. Produção: Math.round substituiu
Math.floor somente em paraCentavos. RED focado: 29 testes, 20 passaram e
9 falharam pelo defeito monetário, incluindo 1998 != 1999 na coluna SQLite.
GREEN completo: backend 35/35, frontend 37/37, build 60 módulos, node --check
e git diff --check passaram. Ida/volta verificou 100001 valores (0..100000).
Pedido criado somente no fake; banco em memória, sem ERP/.env/banco real.
Validação manual opcional não realizada; CI, commit e PR pendentes.
Históricos não reparados; precisão superior a duas casas fora do escopo.

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
