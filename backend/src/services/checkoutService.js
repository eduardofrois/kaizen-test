import { createHash } from 'node:crypto';
import { obterBanco, agoraISO } from '../db/index.js';
import { ApiError } from '../lib/ApiError.js';
import { paraCentavos, paraReais } from '../lib/dinheiro.js';
import { buscarCarrinho, exigirCarrinhoEditavel, atualizarVersao, tentativaBloqueante } from './carrinhosService.js';

export function erroIncerto() {
  return new ApiError(502, 'CHECKOUT_INCERTO', 'Pedido em verificação. Não envie novamente; procure o atendimento.');
}

function buscarTentativa(usuarioId, tentativaId, db) {
  const linha = db.prepare('SELECT * FROM checkout_tentativas WHERE usuario_id=? AND tentativa_id=?').get(usuarioId, tentativaId);
  if (!linha) throw ApiError.naoEncontrado('Tentativa não encontrada.');
  return linha;
}

export function iniciarTentativa(usuarioId, dados, endereco, db = obterBanco()) {
  const assinatura = createHash('sha256').update(JSON.stringify([
    usuarioId, dados.carrinho_id, dados.versao_carrinho, dados.endereco_id, dados.observacao || '',
  ])).digest('hex');
  return db.transaction(() => {
    buscarCarrinho(usuarioId, dados.carrinho_id, db);
    const anterior = db.prepare('SELECT * FROM checkout_tentativas WHERE usuario_id=? AND tentativa_id=?').get(usuarioId, dados.tentativa_id);
    if (anterior) {
      if (anterior.assinatura_requisicao !== assinatura) throw ApiError.conflito('TENTATIVA_INCOMPATIVEL', 'Essa tentativa pertence a outra confirmação.');
      if (anterior.estado === 'concluido') return { tentativa: anterior, repetida: true };
      if (anterior.estado === 'incerto') throw erroIncerto();
      throw ApiError.conflito(anterior.estado === 'recusado' ? 'TENTATIVA_RECUSADA' : 'CARRINHO_EM_CHECKOUT',
        anterior.estado === 'recusado' ? 'Corrija os dados e confirme uma nova tentativa.' : 'Pedido em envio ou verificação.');
    }
    const carrinho = exigirCarrinhoEditavel(usuarioId, dados.carrinho_id, db);
    if (carrinho.versao !== dados.versao_carrinho) throw ApiError.conflito('CARRINHO_ALTERADO', 'O carrinho mudou. Confira os itens antes de confirmar.');
    if (!endereco) throw ApiError.naoProcessavel('Não foi possível fechar o pedido.', [{ campo: 'endereco_id', mensagem: 'Endereço de entrega não encontrado.' }]);
    const agora = agoraISO();
    db.prepare(`INSERT INTO checkout_tentativas(usuario_id,tentativa_id,carrinho_id_origem,
      versao_carrinho,assinatura_requisicao,endereco_entrega,estado,criado_em,atualizado_em)
      VALUES(?,?,?,?,?,?,'preparando',?,?)`).run(usuarioId, dados.tentativa_id, dados.carrinho_id,
      dados.versao_carrinho, assinatura, JSON.stringify(endereco), agora, agora);
    return { tentativa: buscarTentativa(usuarioId, dados.tentativa_id, db), repetida: false };
  }).immediate();
}

function mudarEstado(usuarioId, tentativaId, estado, db) {
  const tentativa = buscarTentativa(usuarioId, tentativaId, db);
  if (!['preparando','enviando','incerto'].includes(tentativa.estado)) throw ApiError.conflito('TENTATIVA_FINALIZADA', 'Tentativa já finalizada.');
  db.prepare('UPDATE checkout_tentativas SET estado=?,atualizado_em=? WHERE usuario_id=? AND tentativa_id=?')
    .run(estado, agoraISO(), usuarioId, tentativaId);
}
export function marcarEnviando(usuarioId, tentativaId, db = obterBanco()) { mudarEstado(usuarioId, tentativaId, 'enviando', db); }
export function marcarIncerta(usuarioId, tentativaId, db = obterBanco()) { mudarEstado(usuarioId, tentativaId, 'incerto', db); }
export function recusarTentativa(usuarioId, tentativaId, db = obterBanco()) { mudarEstado(usuarioId, tentativaId, 'recusado', db); }
export function registrarNumeroErp(usuarioId, tentativaId, numero, db = obterBanco()) {
  buscarTentativa(usuarioId, tentativaId, db);
  db.prepare('UPDATE checkout_tentativas SET numero_erp=?,atualizado_em=? WHERE usuario_id=? AND tentativa_id=?')
    .run(String(numero), agoraISO(), usuarioId, tentativaId);
}

export function concluirTentativa(usuarioId, tentativaId, pedido, db = obterBanco()) {
  return db.transaction(() => {
    const tentativa = buscarTentativa(usuarioId, tentativaId, db);
    buscarCarrinho(usuarioId, tentativa.carrinho_id_origem, db);
    if (tentativa.estado === 'concluido') return pedidoDaTentativa(usuarioId, tentativaId, db);
    if (!['enviando','incerto'].includes(tentativa.estado)) throw ApiError.conflito('TENTATIVA_INVALIDA', 'Tentativa não enviada.');
    if (String(pedido.numero) !== tentativa.numero_erp) throw ApiError.conflito('PEDIDO_INCOMPATIVEL', 'Pedido não corresponde à tentativa.');
    db.prepare(`INSERT INTO pedidos_usuario(usuario_id,numero_erp,endereco_entrega,valor_total_centavos,criado_em)
      VALUES(?,?,?,?,?)`).run(usuarioId, String(pedido.numero), tentativa.endereco_entrega, paraCentavos(pedido.valor_total), agoraISO());
    db.prepare('DELETE FROM carrinho_itens WHERE carrinho_id=?').run(tentativa.carrinho_id_origem);
    atualizarVersao(tentativa.carrinho_id_origem, db);
    db.prepare("UPDATE checkout_tentativas SET estado='concluido',atualizado_em=? WHERE usuario_id=? AND tentativa_id=?")
      .run(agoraISO(), usuarioId, tentativaId);
    return { ...pedido, endereco_entrega: JSON.parse(tentativa.endereco_entrega) };
  }).immediate();
}

export function pedidoDaTentativa(usuarioId, tentativaId, db = obterBanco()) {
  const tentativa = buscarTentativa(usuarioId, tentativaId, db);
  const vinculo = db.prepare('SELECT * FROM pedidos_usuario WHERE usuario_id=? AND numero_erp=?').get(usuarioId, tentativa.numero_erp);
  if (!vinculo) throw erroIncerto();
  return { numero: vinculo.numero_erp, valor_total: paraReais(vinculo.valor_total_centavos),
    endereco_entrega: JSON.parse(vinculo.endereco_entrega), criado_em: vinculo.criado_em };
}

export function lerEstadoCheckout(usuarioId, carrinhoId, db = obterBanco()) {
  buscarCarrinho(usuarioId, carrinhoId, db);
  const tentativa = tentativaBloqueante(carrinhoId, db) ?? db.prepare(`SELECT * FROM checkout_tentativas
    WHERE usuario_id=? AND carrinho_id_origem=? ORDER BY criado_em DESC,rowid DESC LIMIT 1`).get(usuarioId, carrinhoId);
  return tentativa ? { estado: tentativa.estado, tentativa_id: tentativa.tentativa_id, numero_erp: tentativa.numero_erp } : { estado: 'livre' };
}
