import { useEffect, useRef } from 'react';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { dinheiro } from '../api/cliente.js';
import { GerenciadorCarrinhos } from './GerenciadorCarrinhos.jsx';
import { ConteudoCarrinho } from './ConteudoCarrinho.jsx';
import { Botao } from './ui.jsx';

export function PainelCarrinho({ lateral = false, aoRecolher }) {
  const { carrinho, ativoId, carrinhos } = useCarrinho();
  const dialogo = useRef(null), acionador = useRef(null), posicao = useRef(0);
  const nome = carrinhos.find(c => c.id === ativoId)?.nome ?? 'Carrinho';
  function fechar() { dialogo.current?.close(); }
  function abrir() {
    posicao.current = window.scrollY;
    dialogo.current.showModal();
    document.documentElement.style.overflow = 'hidden';
  }
  function conterFoco(evento) {
    if (evento.key !== 'Tab') return;
    const controles = [...dialogo.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
      .filter(elemento => elemento.getClientRects().length > 0);
    const primeiro = controles[0], ultimo = controles.at(-1);
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo?.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro?.focus(); }
  }
  useEffect(() => () => { document.documentElement.style.overflow = ''; }, []);
  return <>
    {lateral && <aside className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] min-w-0 self-start overflow-y-auto rounded-xl border border-tinta-200 bg-white p-4 lg:block" aria-label="Carrinho na vitrine">
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-bold text-tinta-900">Seu carrinho</h2><Botao tamanho="pequeno" variante="discreto" onClick={aoRecolher}>Recolher</Botao></div>
      <GerenciadorCarrinhos /><div className="mt-4"><ConteudoCarrinho compacto /></div>
    </aside>}
    <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-tinta-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${lateral ? 'lg:hidden' : ''}`}>
      <button ref={acionador} onClick={abrir} className="mx-auto flex w-full max-w-6xl min-w-0 items-center justify-between gap-3 rounded-lg bg-marca-700 px-4 py-3 text-sm font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-marca-700" aria-haspopup="dialog">
        <span className="min-w-0 truncate">{nome} · {carrinho.quantidade_pecas} {carrinho.quantidade_pecas === 1 ? 'peça' : 'peças'}</span><span className="shrink-0">{dinheiro.format(carrinho.valor_total)} · Ver carrinho</span>
      </button>
    </div>
    <dialog ref={dialogo} onKeyDown={conterFoco} aria-labelledby="titulo-painel-carrinho" className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[440px] overflow-y-auto border-0 bg-white p-4 shadow-xl backdrop:bg-black/40"
      onClose={() => { document.documentElement.style.overflow = ''; window.scrollTo(0, posicao.current); acionador.current?.focus({ preventScroll: true }); }}>
      <div className="mb-4 flex items-center justify-between"><h2 id="titulo-painel-carrinho" className="font-bold">Seu carrinho</h2><Botao variante="discreto" tamanho="pequeno" onClick={fechar}>Fechar carrinho</Botao></div>
      <GerenciadorCarrinhos /><div className="mt-4"><ConteudoCarrinho compacto aoCheckout={fechar} /></div>
    </dialog>
  </>;
}
