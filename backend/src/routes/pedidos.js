import { Router } from 'express';
import { autenticar } from '../middleware/autenticacao.js';
import {
  buscarPedidoDoUsuario,
  finalizarPedido,
  listarPedidos,
} from '../services/pedidoService.js';
import {
  ColetorDeErros,
  exigirObjeto,
  inteiroPositivo,
  lerPaginacao,
  textoOpcional,
  textoObrigatorio,
} from '../lib/validacao.js';

export const rotasPedidos = Router();

rotasPedidos.use(autenticar);

/**
 * POST /api/pedidos - checkout.
 * Pega o carrinho do usuario, manda para o ERP e limpa o carrinho.
 */
rotasPedidos.post('/', async (req, res) => {
  const corpo = exigirObjeto(req.body);
  const erros = new ColetorDeErros();

  const enderecoId = inteiroPositivo(corpo.endereco_id, 'endereco_id', erros, { max: 1e9 });
  const carrinhoId = inteiroPositivo(corpo.carrinho_id, 'carrinho_id', erros, { max: Number.MAX_SAFE_INTEGER });
  const versao = inteiroPositivo(corpo.versao_carrinho, 'versao_carrinho', erros, { max: Number.MAX_SAFE_INTEGER });
  const tentativa = textoObrigatorio(corpo.tentativa_id, 'tentativa_id', erros, { max: 36 });
  if (tentativa && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tentativa)) erros.adicionar('tentativa_id', 'Identificador de tentativa inválido.');
  const observacao = textoOpcional(corpo.observacao, 'observacao', erros, { max: 300 });

  erros.lancarSeInvalido('Nao foi possivel fechar o pedido.');

  const { pedido, repetido } = await finalizarPedido(req.usuario, {
    carrinho_id: carrinhoId, versao_carrinho: versao, tentativa_id: tentativa,
    endereco_id: enderecoId, observacao,
  });

  res.status(repetido ? 200 : 201).location(`/api/pedidos/${pedido.numero}`).json({ dados: pedido });
});

/** GET /api/pedidos - so os pedidos de quem esta logado. */
rotasPedidos.get('/', async (req, res) => {
  const { pagina, tamanho } = lerPaginacao({ ...req.query, tamanho: req.query.tamanho ?? '10' });
  const { pedidos, paginacao } = await listarPedidos(req.usuario.id, { pagina, tamanho });

  res.json({ dados: pedidos, paginacao });
});

/** GET /api/pedidos/:numero */
rotasPedidos.get('/:numero', async (req, res) => {
  res.json({ dados: await buscarPedidoDoUsuario(req.usuario.id, req.params.numero) });
});
