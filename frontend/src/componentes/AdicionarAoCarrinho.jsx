import { useId, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { useAuth } from '../contextos/AuthContext.jsx';
import { Alerta, Botao } from './ui.jsx';

export function AdicionarAoCarrinho({ produto, quantidade = 1 }) {
  const { autenticado } = useAuth();
  const contexto = useCarrinho();
  const navegar = useNavigate(), local = useLocation(), id = useId();
  const [escolhendo, setEscolhendo] = useState(false), [destino, setDestino] = useState('');
  const [recado, setRecado] = useState(null), [enviando, setEnviando] = useState(false);
  const ativo = contexto.carrinhos.find(c => c.id === contexto.ativoId);
  const ocupado = enviando || contexto.ocupado || contexto.carregando;
  function entrar() { navegar('/entrar', { state: { de: local.pathname + local.search } }); }
  async function adicionar(destinoId) {
    if (!autenticado) { entrar(); return; }
    if (!contexto.origem()) return;
    setEnviando(true); setRecado(null);
    let origem = contexto.capturarOrigem();
    try {
      if (destinoId !== undefined && destinoId !== contexto.ativoId) {
        if (await contexto.selecionar(destinoId) === false) return;
        origem = contexto.capturarOrigem();
      }
      const aplicado = await contexto.adicionar(produto.codigo, quantidade, destinoId);
      if (aplicado !== false) {
        const nome = contexto.carrinhos.find(c => c.id === (destinoId ?? contexto.ativoId))?.nome;
        setRecado({ origem, tipo: 'sucesso', texto: `Adicionado ao ${nome}.` }); setEscolhendo(false);
      }
    } catch (erro) { if (origem()) setRecado({ origem, tipo: 'erro', texto: erro.message }); }
    finally { setEnviando(false); }
  }
  return <div className="mt-4 min-w-0 space-y-2">
    <Botao className="w-full break-words" disabled={produto.estoque === 0 || (autenticado && (!ativo || ocupado || Boolean(contexto.carrinho.checkout)))} carregando={enviando} onClick={() => adicionar()}>
      {produto.estoque === 0 ? 'Indisponível' : ativo ? `Adicionar ao ${ativo.nome}` : 'Adicionar ao carrinho'}
    </Botao>
    {produto.estoque > 0 && <Botao className="w-full" tamanho="pequeno" variante="contorno" disabled={autenticado && ocupado} onClick={() => {
      if (!autenticado) { entrar(); return; } setDestino(String(contexto.ativoId)); setEscolhendo(true); setRecado(null);
    }}>Escolher carrinho</Botao>}
    {escolhendo && <form className="space-y-2 rounded-lg border border-tinta-200 p-2" onSubmit={e => { e.preventDefault(); void adicionar(Number(destino)); }}>
      <label htmlFor={id} className="text-xs font-semibold">Adicionar esta peça em</label>
      <select id={id} value={destino} onChange={e => setDestino(e.target.value)} className="w-full min-w-0 rounded border border-tinta-300 p-2 text-sm">
        {contexto.carrinhos.map(c => <option key={c.id} value={c.id} disabled={c.bloqueado}>{c.nome}{c.principal ? ' — principal' : ''}</option>)}
      </select>
      <div className="flex flex-wrap gap-1"><Botao type="submit" tamanho="pequeno" disabled={ocupado || !destino}>Adicionar aqui</Botao>
        <Botao type="button" tamanho="pequeno" variante="discreto" onClick={() => setEscolhendo(false)}>Cancelar</Botao></div>
    </form>}
    {recado?.origem() && <Alerta tipo={recado.tipo}>{recado.texto}</Alerta>}
  </div>;
}
