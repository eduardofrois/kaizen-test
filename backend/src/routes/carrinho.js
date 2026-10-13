import { Router } from 'express';
import { autenticar } from '../middleware/autenticacao.js';
import { ApiError } from '../lib/ApiError.js';

/** Clientes antigos devem recarregar: nunca escolher destino implicitamente. */
export const rotasCarrinho = Router();
rotasCarrinho.use(autenticar);
rotasCarrinho.use(() => {
  throw ApiError.conflito('CARRINHO_OBRIGATORIO', 'Atualize a página para escolher o carrinho.');
});
