import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, dinheiro } from '../api/cliente.js';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { FormularioEndereco } from '../componentes/FormularioEndereco.jsx';
import { Alerta, Botao, Carregando, ErroGeral, EstadoVazio } from '../componentes/ui.jsx';

export function Checkout() {
  const contexto = useCarrinho();
  const { carrinho, ativoId, ocupado, carregando: carregandoCarrinho, recarregar, erro: erroCarrinho, capturarOrigem } = contexto;
  const tentativa = useRef(null);
  const [verificacao, setVerificacao] = useState(null);
  const navegar = useNavigate();

  const [enderecos, setEnderecos] = useState([]);
  const [enderecoId, setEnderecoId] = useState(null);
  const [observacao, setObservacao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const origem = capturarOrigem();
    let ativo = true;
    setCarregando(true); setErro(null); setVerificacao(null); setEnviando(false);
    tentativa.current = null;
    api.enderecos
      .listar()
      .then((resposta) => {
        if (!ativo || !origem()) return;
        setEnderecos(resposta.dados);
        const principal = resposta.dados.find((item) => item.principal) ?? resposta.dados[0];
        setEnderecoId(principal?.id ?? null);
        // Sem nenhum endereco cadastrado, ja abre o formulario: um passo a menos.
        setMostrarFormulario(resposta.dados.length === 0);
      })
      .catch((falha) => { if (ativo && origem()) setErro(falha); })
      .finally(() => { if (ativo && origem()) setCarregando(false); });
    return () => { ativo = false; };
  }, [ativoId, capturarOrigem]);

  function enderecoSalvo(novo) {
    if (!contexto.origem()) return;
    setEnderecos((atual) => {
      const semEle = atual.filter((item) => item.id !== novo.id);
      // Salvar um principal desmarca os outros no servidor; reflete aqui.
      const atualizados = novo.principal
        ? semEle.map((item) => ({ ...item, principal: false }))
        : semEle;
      return [...atualizados, novo];
    });

    setEnderecoId(novo.id);
    setMostrarFormulario(false);
  }

  async function finalizar() {
    if (!contexto.origem()) return;
    if (enviando || ocupado || carregandoCarrinho || !carrinho.pronto_para_checkout || verificacao === ativoId) return;
    const origem = capturarOrigem(), id = ativoId;
    const dados = { carrinho_id: id, versao_carrinho: carrinho.versao,
      tentativa_id: tentativa.current ?? crypto.randomUUID(), endereco_id: enderecoId, observacao };
    tentativa.current = dados.tentativa_id;
    setErro(null); setEnviando(true);
    try {
      const resposta = await api.pedidos.criar(dados);
      if (!origem()) return;
      if (await recarregar() === false || !origem()) return;
      navegar(`/pedidos/${resposta.dados.numero}`, { replace: true, state: { novo: true } });
    } catch (falha) {
      if (!origem()) return;
      setErro(falha);
      if (falha.status === 0 || falha.status >= 500 || falha.codigo === 'CARRINHO_EM_CHECKOUT') {
        setVerificacao(id);
        try {
          const resposta = await api.carrinhos.estadoCheckout(id);
          if (!origem()) return;
          if (resposta.dados.tentativa_id === dados.tentativa_id && resposta.dados.estado === 'concluido' && resposta.dados.numero_erp) {
            navegar(`/pedidos/${resposta.dados.numero_erp}`, { replace: true }); return;
          }
          if (resposta.dados.tentativa_id === dados.tentativa_id && resposta.dados.estado === 'recusado') { setVerificacao(null); tentativa.current = null; }
        } catch { /* Sem resposta conclusiva: conservar proteção local. */ }
      } else tentativa.current = null;
      if (origem()) await recarregar();
    } finally { if (origem()) setEnviando(false); }
  }

  async function consultar() {
    if (!contexto.origem()) return;
    const origem = capturarOrigem();
    try {
      const { dados } = await api.carrinhos.estadoCheckout(ativoId);
      if (!origem()) return;
      const correspondente = dados.tentativa_id === tentativa.current || (!tentativa.current && Boolean(carrinho.checkout));
      if (correspondente && dados.estado === 'concluido' && dados.numero_erp) {
        navegar(`/pedidos/${dados.numero_erp}`, { replace: true }); return;
      }
      if (correspondente && dados.estado === 'recusado') {
        setVerificacao(null); tentativa.current = null; setErro(null);
      }
      await recarregar();
    } catch (falha) { if (origem()) setErro(falha); }
  }

  if (carregando || carregandoCarrinho) return <Carregando texto="Preparando o checkout..." />;

  if (erroCarrinho) return (
    <div className="space-y-4">
      <Alerta tipo="erro" titulo="Não foi possível carregar o carrinho">{erroCarrinho.message}</Alerta>
      <Botao onClick={recarregar}>Tentar novamente</Botao>
    </div>
  );

  if (carrinho.itens.length === 0) {
    return (
      <EstadoVazio
        titulo="Nada para fechar"
        descricao="Seu carrinho está vazio."
        acao={<Link to="/"><Botao>Ver catálogo</Botao></Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="break-words text-2xl font-bold text-tinta-900">Fechar pedido — {carrinho.nome}</h1>
      {(carrinho.checkout || verificacao === ativoId) && <Alerta tipo="aviso" titulo="Pedido em envio ou verificação">
        Não confirme novamente. Consulte a situação ou procure o atendimento.
        <Botao variante="discreto" onClick={consultar}>Consultar situação</Botao>
      </Alerta>}

      <ErroGeral erro={erro} camposConhecidos={[]} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-tinta-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-tinta-900">Endereço de entrega</h2>

              {enderecos.length > 0 && !mostrarFormulario && (
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(true)}
                  className="text-sm text-marca-700 underline hover:text-marca-800"
                >
                  Adicionar outro
                </button>
              )}
            </div>

            {enderecos.length > 0 && (
              <ul className="mt-4 space-y-2">
                {enderecos.map((endereco) => (
                  <li key={endereco.id}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                        enderecoId === endereco.id
                          ? 'border-marca-500 bg-marca-50'
                          : 'border-tinta-200 hover:bg-tinta-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="endereco"
                        value={endereco.id}
                        checked={enderecoId === endereco.id}
                        onChange={() => setEnderecoId(endereco.id)}
                        className="mt-1 size-4 text-marca-700 focus:ring-marca-500"
                      />
                      <span className="text-sm">
                        <strong className="text-tinta-900">{endereco.apelido}</strong>
                        {endereco.principal && (
                          <span className="ml-2 rounded bg-tinta-200 px-1.5 py-0.5 text-xs text-tinta-600">
                            principal
                          </span>
                        )}
                        <br />
                        <span className="text-tinta-600">
                          {endereco.logradouro}, {endereco.numero}
                          {endereco.complemento ? `, ${endereco.complemento}` : ''} —{' '}
                          {endereco.bairro}, {endereco.cidade}/{endereco.uf} — CEP {endereco.cep}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            {mostrarFormulario && (
              <div className="mt-4 border-t border-tinta-200 pt-4">
                <FormularioEndereco
                  aoSalvar={enderecoSalvo}
                  aoCancelar={enderecos.length > 0 ? () => setMostrarFormulario(false) : null}
                />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-tinta-200 bg-white p-5">
            <h2 className="font-semibold text-tinta-900">Observação (opcional)</h2>
            <textarea
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Alguma instrução para a entrega?"
              className="mt-3 w-full rounded-lg border border-tinta-300 px-3 py-2.5 text-sm
                focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-100"
            />
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-tinta-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta-500">
            Seu pedido
          </h2>

          <ul className="mt-4 space-y-3 text-sm">
            {carrinho.itens.map((item) => (
              <li key={item.codigo_produto} className="flex justify-between gap-3">
                <span className="min-w-0 text-tinta-600">
                  <span className="font-medium text-tinta-800">{item.quantidade}x</span>{' '}
                  {item.descricao}
                </span>
                <span className="shrink-0 font-medium">{dinheiro.format(item.valor_total)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t border-tinta-200 pt-3">
            <span className="font-semibold text-tinta-900">Total</span>
            <span className="text-lg font-bold text-tinta-900">
              {dinheiro.format(carrinho.valor_total)}
            </span>
          </div>

          {!carrinho.pronto_para_checkout && !carrinho.checkout && (
            <Alerta tipo="aviso" className="mt-4">
              Há itens com pendência no carrinho.
            </Alerta>
          )}

          <Botao
            tamanho="grande"
            className="mt-5 w-full"
            carregando={enviando}
            disabled={!enderecoId || !carrinho.pronto_para_checkout || ocupado || verificacao === ativoId}
            onClick={finalizar}
          >
            Confirmar pedido
          </Botao>

          <Link
            to="/carrinho"
            className="mt-3 block text-center text-sm text-tinta-600 underline hover:text-marca-700"
          >
            Voltar ao carrinho
          </Link>
        </aside>
      </div>
    </div>
  );
}
