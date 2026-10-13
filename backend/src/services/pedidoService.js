import { obterBanco, agoraISO } from '../db/index.js';
import { ApiError } from '../lib/ApiError.js';
import { paraCentavos, paraReais } from '../lib/dinheiro.js';
import * as erp from '../erp/cliente.js';
import { buscarEndereco, serializarEndereco } from './enderecoService.js';
import { lerCarrinho } from './carrinhoService.js';
import { iniciarTentativa, marcarEnviando, marcarIncerta, recusarTentativa, registrarNumeroErp, concluirTentativa, pedidoDaTentativa, erroIncerto } from './checkoutService.js';

function enderecoEmUmaLinha(e) {
  const complemento = e.complemento ? `, ${e.complemento}` : '';
  return `${e.logradouro}, ${e.numero}${complemento} - ${e.bairro}, ${e.cidade}/${e.uf} - CEP ${e.cep}`;
}

/**
 * Fecha o pedido.
 *
 * O pedido de verdade nasce no ERP. A loja guarda so o vinculo
 * numero <-> usuario, porque o ERP conhece "Fulano, CPF X", nao "a conta
 * fulano@email.com". Sem esse vinculo nao daria para montar "meus pedidos".
 */
export async function finalizarPedido(usuario, dados, db = obterBanco()) {
  const linha = buscarEndereco(usuario.id, dados.endereco_id, db);
  const endereco = linha ? serializarEndereco(linha) : null;
  const { repetida } = iniciarTentativa(usuario.id, dados, endereco, db);
  if (repetida) return { pedido: pedidoDaTentativa(usuario.id, dados.tentativa_id, db), repetido: true };
  let carrinho;
  try {
    carrinho = await lerCarrinho(usuario.id, dados.carrinho_id, db);
    if (!carrinho.itens.length) throw ApiError.conflito('CARRINHO_VAZIO', 'Seu carrinho está vazio.');
    if (carrinho.itens.some(i => !i.disponivel)) throw ApiError.conflito('CARRINHO_COM_PENDENCIAS',
      'Alguns itens precisam de ajuste antes de fechar o pedido.',
      carrinho.itens.filter(i => !i.disponivel).map(i => ({ codigo_produto: i.codigo_produto, motivo: i.problema })));
  } catch (erro) {
    recusarTentativa(usuario.id, dados.tentativa_id, db);
    throw erro;
  }
  const partes = [`Entrega: ${enderecoEmUmaLinha(endereco)}`];
  if (dados.observacao) partes.push(`Obs. do cliente: ${dados.observacao}`);
  marcarEnviando(usuario.id, dados.tentativa_id, db);
  let pedido;
  try {
    pedido = await erp.criarPedido({ cliente: { nome: usuario.nome, documento: usuario.documento },
      observacao: partes.join(' | ').slice(0, 500),
      itens: carrinho.itens.map(i => ({ codigo_produto: i.codigo_produto, quantidade: i.quantidade })) });
  } catch (erro) {
    if (erro.recusaConclusiva) { recusarTentativa(usuario.id, dados.tentativa_id, db); throw erro; }
    try {
      if (erro.numeroErp !== undefined) registrarNumeroErp(usuario.id, dados.tentativa_id, erro.numeroErp, db);
    } catch { /* Falha local não libera o envio nem autoriza repetição. */ }
    try { marcarIncerta(usuario.id, dados.tentativa_id, db); } catch { /* enviando permanece bloqueante */ }
    throw erroIncerto();
  }
  try {
    registrarNumeroErp(usuario.id, dados.tentativa_id, pedido.numero, db);
    return { pedido: concluirTentativa(usuario.id, dados.tentativa_id, pedido, db), repetido: false };
  } catch {
    // Mesmo se esta gravação falhar, o estado enviando continua bloqueante.
    try { marcarIncerta(usuario.id, dados.tentativa_id, db); } catch { /* banco indisponível: não reenviar */ }
    throw erroIncerto();
  }
}

/**
 * Lista os pedidos do usuario.
 *
 * Numero, valor e data vem do banco local; a situacao atual vem do ERP, que e
 * quem manda nisso. Sao N chamadas por pagina - com paginas de 10 e um
 * catalogo deste tamanho, compensa a simplicidade. Um volume maior pediria
 * cache ou um endpoint de consulta em lote no ERP.
 */
export async function listarPedidos(usuarioId, { pagina, tamanho }, db = obterBanco()) {
  const { total } = db
    .prepare('SELECT COUNT(*) AS total FROM pedidos_usuario WHERE usuario_id = ?')
    .get(usuarioId);

  const linhas = db
    .prepare(`
      SELECT * FROM pedidos_usuario
       WHERE usuario_id = ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?
    `)
    .all(usuarioId, tamanho, (pagina - 1) * tamanho);

  const pedidos = await Promise.all(
    linhas.map(async (linha) => {
      const base = {
        numero: linha.numero_erp,
        valor_total: paraReais(linha.valor_total_centavos),
        criado_em: linha.criado_em,
        endereco_entrega: JSON.parse(linha.endereco_entrega),
      };

      try {
        const doErp = await erp.buscarPedido(linha.numero_erp);
        return {
          ...base,
          situacao: doErp?.situacao ?? 'INDISPONIVEL',
          quantidade_itens: doErp?.quantidade_itens ?? null,
        };
      } catch {
        // ERP fora do ar: mostra o que a loja sabe em vez de quebrar a pagina.
        return { ...base, situacao: 'INDISPONIVEL', quantidade_itens: null };
      }
    }),
  );

  return {
    pedidos,
    paginacao: {
      pagina,
      tamanho,
      total,
      total_paginas: Math.max(1, Math.ceil(total / tamanho)),
    },
  };
}

export async function buscarPedidoDoUsuario(usuarioId, numero, db = obterBanco()) {
  // Checa a posse ANTES de ir no ERP: trocar o numero na URL nao pode revelar
  // o pedido de outro cliente.
  const vinculo = db
    .prepare('SELECT * FROM pedidos_usuario WHERE usuario_id = ? AND UPPER(numero_erp) = ?')
    .get(usuarioId, String(numero).toUpperCase());

  if (!vinculo) {
    throw ApiError.naoEncontrado('Pedido nao encontrado.');
  }

  const pedido = await erp.buscarPedido(vinculo.numero_erp);

  if (!pedido) {
    throw ApiError.naoEncontrado('Pedido nao encontrado no sistema de estoque.');
  }

  return { ...pedido, endereco_entrega: JSON.parse(vinculo.endereco_entrega) };
}
