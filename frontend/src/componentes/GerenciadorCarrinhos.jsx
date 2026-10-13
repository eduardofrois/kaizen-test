import { useId, useState } from 'react';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { Alerta, Botao } from './ui.jsx';

export function GerenciadorCarrinhos() {
  const contexto = useCarrinho();
  const { carrinhos, ativoId, principalId, selecionar, ocupado, gerindo, carregando, carrinho } = contexto;
  const id = useId();
  const [formulario, setFormulario] = useState(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState(null);
  const atual = carrinhos.find(c => c.id === ativoId);
  const bloqueado = Boolean(carrinho.checkout);

  async function executar(acao) {
    if (!contexto.origem()) return;
    const origem = contexto.capturarOrigem();
    setErro(null);
    try {
      const aplicado = await acao();
      if (aplicado !== false) { setFormulario(null); setNome(''); }
    } catch (falha) { if (origem()) setErro(falha); }
  }
  function abrir(tipo) { setErro(null); setFormulario({ tipo, id: ativoId }); setNome(tipo === 'renomear' ? atual?.nome ?? '' : ''); }

  return <section className="min-w-0 space-y-3" aria-label="Gerenciar carrinhos">
    <label htmlFor={id} className="block text-sm font-semibold text-tinta-800">Carrinho ativo</label>
    <select id={id} value={ativoId ?? ''} disabled={gerindo} onChange={e => { setErro(null); setFormulario(null); void selecionar(Number(e.target.value)); }}
      className="w-full min-w-0 rounded-lg border border-tinta-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-marca-700">
      {!ativoId && <option value="">Carregando carrinhos...</option>}
      {carrinhos.map(c => <option key={c.id} value={c.id}>{c.nome}{c.id === principalId ? ' — principal' : ''}</option>)}
    </select>
    <div className="flex flex-wrap gap-2">
      <Botao tamanho="pequeno" variante="contorno" disabled={ocupado || carrinhos.length >= 10} onClick={() => abrir('criar')}>Novo carrinho</Botao>
      <Botao tamanho="pequeno" variante="discreto" disabled={!atual || ocupado || bloqueado} onClick={() => abrir('renomear')}>Renomear</Botao>
      <Botao tamanho="pequeno" variante="discreto" disabled={!atual || ocupado || bloqueado} onClick={() => abrir('excluir')}>Excluir</Botao>
      {atual && ativoId !== principalId && <Botao tamanho="pequeno" variante="discreto" disabled={ocupado} onClick={() => executar(() => contexto.definirPrincipal(ativoId))}>Definir como principal</Botao>}
    </div>
    <p className="text-xs text-tinta-500">{carrinhos.length}/10 carrinhos. O principal vem selecionado ao entrar.</p>
    {formulario && formulario.id === ativoId && formulario.tipo !== 'excluir' && <form className="space-y-2" onSubmit={e => {
      e.preventDefault(); void executar(() => formulario.tipo === 'criar' ? contexto.criar(nome) : contexto.renomear(formulario.id, nome));
    }}>
      <label className="block text-sm" htmlFor={`${id}-nome`}>Nome do carrinho</label>
      <input id={`${id}-nome`} value={nome} onChange={e => setNome(e.target.value)} maxLength={60} required autoFocus
        className="w-full rounded-lg border border-tinta-300 p-2 text-sm focus:outline-2 focus:outline-marca-700" />
      <div className="flex gap-2"><Botao tamanho="pequeno" type="submit" disabled={ocupado || !nome.trim()}>Salvar carrinho</Botao>
        <Botao tamanho="pequeno" variante="discreto" type="button" onClick={() => setFormulario(null)}>Cancelar</Botao></div>
    </form>}
    {formulario?.tipo === 'excluir' && formulario.id === ativoId && <div className="space-y-2 rounded-lg border border-red-200 p-3">
      <p className="break-words text-sm">Excluir “{atual?.nome}”{carrinho.itens.length ? ' e todos os seus itens' : ''}?</p>
      <div className="flex flex-wrap gap-2"><Botao tamanho="pequeno" variante="perigo" disabled={ocupado || carregando} onClick={() => executar(() => contexto.excluir(ativoId, true))}>Confirmar exclusão</Botao>
        <Botao tamanho="pequeno" variante="discreto" onClick={() => setFormulario(null)}>Cancelar</Botao></div>
    </div>}
    {erro && <Alerta tipo="erro">{erro.message}</Alerta>}
  </section>;
}
