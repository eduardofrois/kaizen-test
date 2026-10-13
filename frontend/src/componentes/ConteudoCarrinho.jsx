import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { dinheiro } from '../api/cliente.js';
import { LinhaItemCarrinho } from './LinhaItemCarrinho.jsx';
import { Alerta, Botao, Carregando } from './ui.jsx';

export function ConteudoCarrinho({ compacto = false, aoCheckout }) {
  const contexto = useCarrinho();
  const idInstancia = useId();
  const { carrinho, carregando, ocupado, erro, aviso, recarregar } = contexto;
  const [falha, setFalha] = useState(null);
  async function executar(acao) {
    if (!contexto.origem()) return;
    const origem = contexto.capturarOrigem(); setFalha(null);
    try { await acao(); } catch (e) { if (origem()) setFalha({ id: contexto.ativoId, erro: e }); }
  }
  if (erro) return <div className="space-y-3"><Alerta tipo="erro" titulo="Não foi possível carregar o carrinho">{erro.message}</Alerta>
    <Botao variante="contorno" onClick={recarregar}>Tentar novamente</Botao></div>;
  if (carregando) return <Carregando texto="Carregando carrinho..." />;
  const bloqueado = Boolean(carrinho.checkout);
  return <div className="min-w-0 space-y-4">
    {aviso && <Alerta tipo="info">{aviso}</Alerta>}
    {falha?.id === contexto.ativoId && <Alerta tipo="erro">{falha.erro.message}</Alerta>}
    {bloqueado && <Alerta tipo="aviso" titulo={carrinho.checkout.estado === 'incerto' ? 'Pedido em verificação' : 'Pedido em envio ou verificação'}>
      Este carrinho está protegido. Não envie novamente. Você pode continuar em outro carrinho.
      <Botao tamanho="pequeno" variante="discreto" onClick={recarregar}>Consultar situação</Botao>
    </Alerta>}
    {!carrinho.itens.length ? <p className="py-6 text-center text-sm text-tinta-500">Seu carrinho está vazio. Adicione peças da vitrine.</p> : <>
      {!bloqueado && !carrinho.pronto_para_checkout && <Alerta tipo="aviso">Ajuste ou remova os itens com pendência.</Alerta>}
      <ul className="divide-y divide-tinta-200">{carrinho.itens.map(item => <LinhaItemCarrinho key={item.codigo_produto}
        item={item} idQuantidade={`${idInstancia}-${item.codigo_produto}`} compacto={compacto} ocupado={ocupado || bloqueado}
        aoAlterar={(codigo, quantidade) => executar(() => contexto.alterar(codigo, quantidade))}
        aoRemover={codigo => executar(() => contexto.remover(codigo))} />)}</ul>
      <Botao tamanho="pequeno" variante="discreto" disabled={ocupado || bloqueado} onClick={() => executar(contexto.limpar)}>Esvaziar carrinho</Botao>
    </>}
    <dl className="space-y-2 border-t border-tinta-200 pt-4 text-sm">
      <div className="flex justify-between"><dt>Peças</dt><dd>{carrinho.quantidade_pecas}</dd></div>
      <div className="flex justify-between gap-2 font-bold text-tinta-900"><dt>Total disponível</dt><dd>{dinheiro.format(carrinho.valor_total)}</dd></div>
    </dl>
    {carrinho.pronto_para_checkout && !ocupado ? <Link to="/checkout" onClick={aoCheckout} className="block rounded-lg bg-marca-700 p-3 text-center text-sm font-semibold text-white hover:bg-marca-800">Fechar pedido</Link>
      : <Botao className="w-full" disabled>Fechar pedido</Botao>}
  </div>;
}
