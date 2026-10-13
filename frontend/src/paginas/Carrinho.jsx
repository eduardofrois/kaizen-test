import { GerenciadorCarrinhos } from '../componentes/GerenciadorCarrinhos.jsx';
import { ConteudoCarrinho } from '../componentes/ConteudoCarrinho.jsx';

export function Carrinho() {
  return <div className="mx-auto max-w-3xl space-y-6">
    <h1 className="text-2xl font-bold text-tinta-900">Carrinhos</h1>
    <div className="rounded-xl border border-tinta-200 bg-white p-4 sm:p-6"><GerenciadorCarrinhos /></div>
    <div className="rounded-xl border border-tinta-200 bg-white p-4 sm:p-6"><ConteudoCarrinho /></div>
  </div>;
}
