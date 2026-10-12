import { createContext, useContext, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { api } from '../api/cliente.js';
import { criarCarrinhoPorSessao } from '../lib/carrinhoPorSessao.js';
import { useAuth } from './AuthContext.jsx';

const CarrinhoContext = createContext(null);

/** O servidor guarda o carrinho; cada ciclo autenticado tem seu estado local. */
export function ProvedorCarrinho({ children }) {
  const { usuario, carregando: carregandoAuth } = useAuth();
  const usuarioId = usuario?.id ?? null;
  const controle = useMemo(
    () => criarCarrinhoPorSessao(api.carrinho, !carregandoAuth && usuarioId !== null),
    [usuarioId, carregandoAuth],
  );
  const estado = useSyncExternalStore(controle.assinar, controle.obterSnapshot);

  useLayoutEffect(() => {
    controle.ativar();
    void controle.recarregar();
    return () => controle.invalidar();
  }, [controle]);

  const valor = useMemo(() => ({
    ...estado,
    carregando: carregandoAuth || estado.carregando,
    recarregar: controle.recarregar,
    adicionar: controle.adicionar,
    alterar: controle.alterar,
    remover: controle.remover,
    limpar: controle.limpar,
    setCarrinho: controle.setCarrinho,
  }), [estado, controle, carregandoAuth]);

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho() {
  const contexto = useContext(CarrinhoContext);
  if (!contexto) throw new Error('useCarrinho precisa estar dentro de <ProvedorCarrinho>.');
  return contexto;
}
