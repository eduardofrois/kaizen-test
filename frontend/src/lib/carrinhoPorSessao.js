function vazio() {
  return { itens: [], quantidade_itens: 0, quantidade_pecas: 0, valor_total: 0, pronto_para_checkout: false };
}

/** Estado da aba: nenhum destino é inferido pelo servidor ou por outra aba. */
export function criarCarrinhoPorSessao(api, autenticado) {
  let ativo = false, ciclo = 0, selecao = 0, leitura = 0, lista = 0;
  let filas = new Map(), pendentes = new Map(), gestoes = 0;
  const ouvintes = new Set();
  const inicial = () => ({ carrinhos: [], principalId: null, ativoId: null,
    carrinho: vazio(), carregando: autenticado, ocupado: false, gerindo: false, erro: null, aviso: null });
  let estado = inicial();
  function publicar(mudancas) {
    const proximo = { ...estado, ...mudancas };
    estado = { ...proximo, gerindo: gestoes > 0,
      ocupado: gestoes > 0 || (pendentes.get(proximo.ativoId) ?? 0) > 0 };
    ouvintes.forEach(fn => fn());
  }
  const atual = (c) => ativo && autenticado && c === ciclo;
  function capturarOrigem() {
    const c = ciclo, s = selecao, id = estado.ativoId;
    return () => atual(c) && selecao === s && estado.ativoId === id;
  }
  function snapshotAtual(dados, id) {
    if (dados?.id !== id) throw new Error('Resposta de carrinho inválida.');
    return (dados.versao ?? 0) >= (estado.carrinho.versao ?? 0);
  }

  async function carregar() {
    if (!ativo || !autenticado || !estado.ativoId) return false;
    const origem = capturarOrigem(), numero = ++leitura, id = estado.ativoId;
    publicar({ carregando: true, erro: null });
    try {
      const resposta = await api.ler(id);
      if (!origem() || numero !== leitura) return false;
      if (!snapshotAtual(resposta.dados, id)) return false;
      publicar({ carrinho: resposta.dados, erro: null });
      return true;
    } catch (erro) {
      if (!origem() || numero !== leitura) return false;
      publicar({ carrinho: vazio(), erro });
      return true;
    } finally {
      if (origem() && numero === leitura) publicar({ carregando: false });
    }
  }

  async function recarregar() {
    if (!ativo || !autenticado) return false;
    const c = ciclo, numero = ++lista;
    try {
      const resposta = await api.listar();
      if (!atual(c) || numero !== lista) return false;
      const { carrinhos, principal_id } = resposta.dados;
      const excluido = estado.ativoId !== null && !carrinhos.some(i => i.id === estado.ativoId);
      const destino = estado.ativoId === null ? principal_id : excluido ? carrinhos[0]?.id : estado.ativoId;
      publicar({ carrinhos, principalId: principal_id });
      if (destino !== estado.ativoId) {
        selecao++; leitura++;
        publicar({ ativoId: destino, carrinho: vazio(), erro: null,
          aviso: excluido ? 'O carrinho ativo foi excluído em outra aba. Selecionamos o mais antigo restante.' : null });
      }
      return carregar();
    } catch (erro) {
      if (!atual(c) || numero !== lista) return false;
      publicar({ erro, carrinho: vazio(), carregando: false });
      return true;
    }
  }

  async function selecionar(id) {
    if (!ativo || !autenticado || !estado.carrinhos.some(c => c.id === id)) return false;
    selecao++; leitura++; lista++;
    publicar({ ativoId: id, carrinho: vazio(), erro: null, aviso: null });
    return carregar();
  }

  function mutar(metodo, argumentos) {
    if (!ativo || !autenticado || !estado.ativoId) return Promise.resolve(false);
    const origem = capturarOrigem(), id = estado.ativoId, c = ciclo;
    pendentes.set(id, (pendentes.get(id) ?? 0) + 1);
    publicar({});
    const operacao = (filas.get(id) ?? Promise.resolve()).catch(() => {}).then(async () => {
      if (!origem()) return false;
      try {
        await recarregar();
        if (!origem()) return false;
        if (estado.erro) throw estado.erro;
        const leituraAntes = leitura;
        const resposta = await api[metodo](id, ...argumentos);
        if (!origem()) return false;
        if (snapshotAtual(resposta.dados, id)) {
          // Invalida apenas leituras anteriores ao envio, nunca uma recarga nova.
          if (leitura === leituraAntes) leitura++;
          publicar({ carrinho: resposta.dados, erro: null });
        }
        return true;
      } catch (erro) {
        if (!origem()) return false;
        if (erro.status === 401) publicar({ carrinho: vazio(), erro });
        if (erro.status === 404 || erro.codigo === 'CARRINHO_EM_CHECKOUT') await recarregar();
        if (!origem()) return false;
        throw erro;
      }
    }).finally(() => {
      if (!atual(c)) return;
      const restantes = pendentes.get(id) - 1;
      if (restantes) pendentes.set(id, restantes);
      else pendentes.delete(id);
      if (filas.get(id) === operacao) filas.delete(id);
      if (estado.ativoId === id) publicar({});
    });
    filas.set(id, operacao);
    return operacao;
  }

  async function gerir(metodo, argumentos) {
    if (!ativo || !autenticado) return false;
    const origem = capturarOrigem(), c = ciclo;
    lista++;
    gestoes++;
    publicar({});
    try {
      const resposta = await api[metodo](...argumentos);
      if (atual(c)) lista++;
      if (!origem()) return false;
      if (metodo === 'criar') {
        publicar({ carrinhos: [...estado.carrinhos, resposta.dados] });
        return await selecionar(resposta.dados.id);
      }
      return await recarregar();
    } catch (erro) {
      if (!origem()) return false;
      throw erro;
    } finally {
      if (atual(c)) { gestoes--; publicar({}); }
    }
  }

  return {
    obterSnapshot: () => estado,
    assinar: fn => { ouvintes.add(fn); return () => ouvintes.delete(fn); },
    ativar: () => { ciclo++; selecao++; ativo = true; filas = new Map(); pendentes = new Map(); gestoes = 0; publicar(inicial()); },
    invalidar: () => { ativo = false; ciclo++; selecao++; lista++; leitura++; filas = new Map(); pendentes = new Map(); gestoes = 0; publicar({ ...inicial(), carregando: false }); },
    capturarOrigem, recarregar, selecionar,
    criar: nome => gerir('criar', [nome]),
    renomear: (id, nome) => gerir('renomear', [id, nome]),
    definirPrincipal: id => gerir('definirPrincipal', [id]),
    excluir: (id, confirmar) => gerir('excluir', [id, confirmar]),
    adicionar: async (codigo, quantidade = 1, destinoId) => {
      if (destinoId !== undefined && destinoId !== estado.ativoId) {
        if (!await selecionar(destinoId) || estado.ativoId !== destinoId || estado.erro) return false;
      }
      return mutar('adicionar', [codigo, quantidade]);
    },
    alterar: (codigo, quantidade) => mutar('alterar', [codigo, quantidade]),
    remover: codigo => mutar('remover', [codigo]),
    limpar: () => mutar('limpar', []),
  };
}
