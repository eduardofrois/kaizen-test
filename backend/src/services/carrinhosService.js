import { obterBanco, agoraISO } from '../db/index.js';
import { ApiError } from '../lib/ApiError.js';

export function buscarCarrinho(usuarioId, carrinhoId, db = obterBanco()) {
  const linha = db.prepare('SELECT * FROM carrinhos WHERE id=? AND usuario_id=?').get(carrinhoId, usuarioId);
  if (!linha) throw ApiError.naoEncontrado('Carrinho não encontrado.');
  return { ...linha, principal: Boolean(linha.principal) };
}

export function tentativaBloqueante(carrinhoId, db = obterBanco()) {
  return db.prepare(`SELECT * FROM checkout_tentativas WHERE carrinho_id_origem=?
    AND estado IN ('preparando','enviando','incerto')`).get(carrinhoId) ?? null;
}

export function exigirCarrinhoEditavel(usuarioId, carrinhoId, db = obterBanco()) {
  const carrinho = buscarCarrinho(usuarioId, carrinhoId, db);
  if (tentativaBloqueante(carrinhoId, db)) {
    throw ApiError.conflito('CARRINHO_EM_CHECKOUT', 'Esse carrinho tem um pedido em envio ou verificação.');
  }
  return carrinho;
}

export function atualizarVersao(carrinhoId, db = obterBanco()) {
  db.prepare('UPDATE carrinhos SET versao=versao+1,atualizado_em=? WHERE id=?').run(agoraISO(), carrinhoId);
}

export function garantirCarrinhoInicial(usuarioId, db = obterBanco()) {
  return db.transaction(() => {
    const existente = db.prepare('SELECT id FROM carrinhos WHERE usuario_id=? ORDER BY principal DESC,criado_em,id LIMIT 1').get(usuarioId);
    if (existente) return buscarCarrinho(usuarioId, existente.id, db);
    const agora = agoraISO();
    const resultado = db.prepare(`INSERT INTO carrinhos(usuario_id,nome,principal,criado_em,atualizado_em)
      VALUES(?,'Meu carrinho',1,?,?)`).run(usuarioId, agora, agora);
    return buscarCarrinho(usuarioId, Number(resultado.lastInsertRowid), db);
  }).immediate();
}

export function listarCarrinhos(usuarioId, db = obterBanco()) {
  garantirCarrinhoInicial(usuarioId, db);
  const carrinhos = db.prepare(`SELECT c.*, COALESCE((SELECT SUM(i.quantidade) FROM carrinho_itens i
    WHERE i.carrinho_id=c.id),0) AS quantidade_pecas FROM carrinhos c
    WHERE c.usuario_id=? ORDER BY c.criado_em,c.id`).all(usuarioId)
    .map(c => ({ ...c, principal: Boolean(c.principal), bloqueado: Boolean(tentativaBloqueante(c.id, db)) }));
  return { carrinhos, principal_id: carrinhos.find(c => c.principal).id };
}

function validarNome(nome) {
  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 60) {
    throw ApiError.naoProcessavel('Nome inválido.', [{ campo: 'nome', mensagem: 'Use de 1 a 60 caracteres.' }]);
  }
  return nome.trim();
}

export function criarCarrinho(usuarioId, nome, db = obterBanco()) {
  nome = validarNome(nome);
  return db.transaction(() => {
    garantirCarrinhoInicial(usuarioId, db);
    if (db.prepare('SELECT COUNT(*) n FROM carrinhos WHERE usuario_id=?').get(usuarioId).n >= 10) {
      throw ApiError.conflito('LIMITE_DE_CARRINHOS', 'Você pode manter até 10 carrinhos.');
    }
    const agora = agoraISO();
    const resultado = db.prepare('INSERT INTO carrinhos(usuario_id,nome,criado_em,atualizado_em) VALUES(?,?,?,?)')
      .run(usuarioId, nome, agora, agora);
    return buscarCarrinho(usuarioId, Number(resultado.lastInsertRowid), db);
  }).immediate();
}

export function renomearCarrinho(usuarioId, carrinhoId, nome, db = obterBanco()) {
  nome = validarNome(nome);
  return db.transaction(() => {
    exigirCarrinhoEditavel(usuarioId, carrinhoId, db);
    db.prepare('UPDATE carrinhos SET nome=? WHERE id=?').run(nome, carrinhoId);
    atualizarVersao(carrinhoId, db);
    return buscarCarrinho(usuarioId, carrinhoId, db);
  }).immediate();
}

export function definirPrincipal(usuarioId, carrinhoId, db = obterBanco()) {
  return db.transaction(() => {
    buscarCarrinho(usuarioId, carrinhoId, db);
    db.prepare('UPDATE carrinhos SET principal=0 WHERE usuario_id=? AND principal=1').run(usuarioId);
    db.prepare('UPDATE carrinhos SET principal=1 WHERE id=?').run(carrinhoId);
    return listarCarrinhos(usuarioId, db);
  }).immediate();
}

export function excluirCarrinho(usuarioId, carrinhoId, confirmarComItens = false, db = obterBanco()) {
  return db.transaction(() => {
    const carrinho = exigirCarrinhoEditavel(usuarioId, carrinhoId, db);
    if (db.prepare('SELECT 1 FROM carrinho_itens WHERE carrinho_id=? LIMIT 1').get(carrinhoId) && confirmarComItens !== true) {
      throw ApiError.conflito('CONFIRMACAO_NECESSARIA', 'Esse carrinho tem itens. Confirme a exclusão.');
    }
    db.prepare('DELETE FROM carrinhos WHERE id=?').run(carrinhoId);
    const restante = db.prepare('SELECT id FROM carrinhos WHERE usuario_id=? ORDER BY criado_em,id LIMIT 1').get(usuarioId);
    if (!restante) garantirCarrinhoInicial(usuarioId, db);
    else if (carrinho.principal) db.prepare('UPDATE carrinhos SET principal=1 WHERE id=?').run(restante.id);
    const lista = listarCarrinhos(usuarioId, db);
    return { ...lista, substituto_id: lista.carrinhos[0].id };
  }).immediate();
}
