import { Link } from 'react-router-dom';
import { dinheiro } from '../api/cliente.js';

export function LinhaItemCarrinho({ item, aoAlterar, aoRemover, ocupado }) {
  const limite = Math.min(99, item.estoque ?? 99);
  return (
    <li className="flex gap-4 py-4">
      <img
        src={item.imagem_url}
        alt=""
        width="80"
        height="80"
        className="size-20 shrink-0 rounded-lg bg-tinta-100 object-contain p-1"
      />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase text-marca-700">{item.marca}</p>

        <h3 className="truncate text-sm font-semibold text-tinta-900">
          <Link to={`/produto/${item.codigo_produto}`} className="hover:underline">
            {item.descricao}
          </Link>
        </h3>

        <p className="mt-0.5 text-xs text-tinta-500">
          {item.codigo_produto} · {dinheiro.format(item.preco_unitario)} cada
        </p>

        {item.problema && (
          <p className="mt-1.5 text-xs font-medium text-amber-700">{item.problema}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <label className="sr-only" htmlFor={`qtd-${item.codigo_produto}`}>
            Quantidade de {item.descricao}
          </label>
          <input
            id={`qtd-${item.codigo_produto}`}
            type="number"
            min="1"
            max={limite}
            value={item.quantidade}
            disabled={ocupado || !item.quantidade_editavel}
            onChange={(evento) => {
              const valor = Number(evento.target.value);
              if (!ocupado && item.quantidade_editavel && Number.isInteger(valor)
                  && valor >= 1 && valor <= limite) {
                aoAlterar(item.codigo_produto, valor);
              }
            }}
            className="w-20 rounded-lg border border-tinta-300 px-2 py-1.5 text-sm
              focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-100
              disabled:bg-tinta-100"
          />

          <button
            type="button"
            onClick={() => aoRemover(item.codigo_produto)}
            disabled={ocupado}
            className="text-sm text-tinta-500 underline hover:text-red-600 disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      </div>

      <p className="shrink-0 text-right text-sm font-bold text-tinta-900">
        {dinheiro.format(item.valor_total)}
      </p>
    </li>
  );
}
