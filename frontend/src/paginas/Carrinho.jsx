import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dinheiro } from '../api/cliente.js';
import { LinhaItemCarrinho } from '../componentes/LinhaItemCarrinho.jsx';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { Alerta, Botao, Carregando, EstadoVazio } from '../componentes/ui.jsx';

export function Carrinho() {
  const { carrinho, carregando, alterar, remover, limpar, recarregar, erro: erroCarrinho } = useCarrinho();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);

  async function executar(acao) {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
    } catch (falha) {
      setErro(falha);
    } finally {
      setOcupado(false);
    }
  }

  if (carregando && carrinho.itens.length === 0) {
    return <Carregando texto="Carregando carrinho..." />;
  }

  if (erroCarrinho) return (
    <div className="space-y-4">
      <Alerta tipo="erro" titulo="Não foi possível carregar o carrinho">{erroCarrinho.message}</Alerta>
      <Botao onClick={recarregar}>Tentar novamente</Botao>
    </div>
  );

  if (carrinho.itens.length === 0) {
    return (
      <EstadoVazio
        titulo="Seu carrinho está vazio"
        descricao="Procure a peça pelo nome, pela marca ou pelo carro em que ela se aplica."
        acao={<Link to="/"><Botao>Ver catálogo</Botao></Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-tinta-900">Carrinho</h1>
        <button
          type="button"
          onClick={() => executar(limpar)}
          disabled={ocupado}
          className="text-sm text-tinta-500 underline hover:text-red-600 disabled:opacity-50"
        >
          Esvaziar
        </button>
      </div>

      {erro && <Alerta tipo="erro">{erro.message}</Alerta>}

      {!carrinho.pronto_para_checkout && (
        <Alerta tipo="aviso" titulo="Alguns itens precisam de ajuste">
          Ajuste ou remova os itens marcados abaixo para fechar o pedido.
        </Alerta>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-tinta-200 bg-white px-5">
          <ul className="divide-y divide-tinta-200">
            {carrinho.itens.map((item) => (
              <LinhaItemCarrinho
                key={item.codigo_produto}
                item={item}
                ocupado={ocupado}
                aoAlterar={(codigo, quantidade) => executar(() => alterar(codigo, quantidade))}
                aoRemover={(codigo) => executar(() => remover(codigo))}
              />
            ))}
          </ul>
        </div>

        <aside className="h-fit rounded-xl border border-tinta-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta-500">Resumo</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-tinta-600">Itens</dt>
              <dd className="font-medium">{carrinho.quantidade_pecas}</dd>
            </div>
            <div className="flex justify-between border-t border-tinta-200 pt-3 text-base">
              <dt className="font-semibold text-tinta-900">Total</dt>
              <dd className="font-bold text-tinta-900">{dinheiro.format(carrinho.valor_total)}</dd>
            </div>
          </dl>

          <Link to="/checkout" className="mt-5 block">
            <Botao
              tamanho="grande"
              className="w-full"
              disabled={!carrinho.pronto_para_checkout || ocupado}
            >
              Fechar pedido
            </Botao>
          </Link>

          <Link
            to="/"
            className="mt-3 block text-center text-sm text-tinta-600 underline hover:text-marca-700"
          >
            Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
