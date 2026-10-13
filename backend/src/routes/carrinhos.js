import { Router } from 'express';
import { autenticar } from '../middleware/autenticacao.js';
import { ColetorDeErros, exigirObjeto, inteiroPositivo, textoObrigatorio } from '../lib/validacao.js';
import * as gestao from '../services/carrinhosService.js';
import * as itens from '../services/carrinhoService.js';
import { lerEstadoCheckout } from '../services/checkoutService.js';

export const rotasCarrinhos = Router();
rotasCarrinhos.use(autenticar);
rotasCarrinhos.param('id', (req, _res, next, valor) => {
  const erros = new ColetorDeErros();
  req.carrinhoId = inteiroPositivo(valor, 'carrinho_id', erros, { max: Number.MAX_SAFE_INTEGER });
  erros.lancarSeInvalido(); next();
});
function nomeDoCorpo(req) {
  const corpo = exigirObjeto(req.body), erros = new ColetorDeErros();
  const nome = textoObrigatorio(corpo.nome, 'nome', erros, { max: 60 });
  erros.lancarSeInvalido(); return nome;
}
rotasCarrinhos.get('/', (req, res) => res.json({ dados: gestao.listarCarrinhos(req.usuario.id) }));
rotasCarrinhos.post('/', (req, res) => res.status(201).json({ dados: gestao.criarCarrinho(req.usuario.id, nomeDoCorpo(req)) }));
rotasCarrinhos.get('/:id', async (req, res) => res.json({ dados: await itens.lerCarrinho(req.usuario.id, req.carrinhoId) }));
rotasCarrinhos.patch('/:id', (req, res) => res.json({ dados: gestao.renomearCarrinho(req.usuario.id, req.carrinhoId, nomeDoCorpo(req)) }));
rotasCarrinhos.put('/:id/principal', (req, res) => res.json({ dados: gestao.definirPrincipal(req.usuario.id, req.carrinhoId) }));
rotasCarrinhos.delete('/:id', (req, res) => {
  const corpo = req.body === undefined ? {} : exigirObjeto(req.body);
  const erros = new ColetorDeErros();
  if (corpo.confirmar_com_itens !== undefined && typeof corpo.confirmar_com_itens !== 'boolean') erros.adicionar('confirmar_com_itens', 'Deve ser verdadeiro ou falso.');
  erros.lancarSeInvalido();
  res.json({ dados: gestao.excluirCarrinho(req.usuario.id, req.carrinhoId, corpo.confirmar_com_itens) });
});
rotasCarrinhos.post('/:id/itens', async (req, res) => {
  const corpo = exigirObjeto(req.body), erros = new ColetorDeErros();
  const codigo = textoObrigatorio(corpo.codigo_produto, 'codigo_produto', erros, { max: 40 });
  const quantidade = inteiroPositivo(corpo.quantidade ?? 1, 'quantidade', erros, { max: 99 });
  erros.lancarSeInvalido();
  res.status(201).json({ dados: await itens.adicionarItem(req.usuario.id, req.carrinhoId, codigo, quantidade) });
});
rotasCarrinhos.patch('/:id/itens/:codigo', async (req, res) => {
  const corpo = exigirObjeto(req.body), erros = new ColetorDeErros();
  const quantidade = inteiroPositivo(corpo.quantidade, 'quantidade', erros, { max: 99 });
  erros.lancarSeInvalido();
  res.json({ dados: await itens.alterarQuantidade(req.usuario.id, req.carrinhoId, req.params.codigo, quantidade) });
});
rotasCarrinhos.delete('/:id/itens/:codigo', async (req, res) => res.json({ dados: await itens.removerItem(req.usuario.id, req.carrinhoId, req.params.codigo) }));
rotasCarrinhos.delete('/:id/itens', async (req, res) => {
  itens.limparCarrinho(req.usuario.id, req.carrinhoId);
  res.json({ dados: await itens.lerCarrinho(req.usuario.id, req.carrinhoId) });
});
rotasCarrinhos.get('/:id/checkout', (req, res) => res.json({ dados: lerEstadoCheckout(req.usuario.id, req.carrinhoId) }));
