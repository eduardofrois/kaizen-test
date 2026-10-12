function carrinhoVazio() {
  return { itens: [], quantidade_itens: 0, quantidade_pecas: 0,
    valor_total: 0, pronto_para_checkout: false };
}

export function criarCarrinhoPorSessao(apiCarrinho, autenticado) {
  let ativo = false;
  let geracao = 0;
  let estado = { carrinho: carrinhoVazio(), carregando: autenticado, erro: null };
  const ouvintes = new Set();
  const publicar = (mudancas) => {
    estado = { ...estado, ...mudancas };
    for (const ouvir of ouvintes) ouvir();
  };
  const atual = (ciclo) => ativo && ciclo === geracao;

  async function executar(metodo, argumentos, leitura = false) {
    if (!ativo || !autenticado) return false;
    const ciclo = geracao;
    if (leitura) publicar({ carregando: true, erro: null });
    try {
      const resposta = await apiCarrinho[metodo](...argumentos);
      if (!atual(ciclo)) return false;
      publicar({ carrinho: resposta.dados, erro: null });
      return true;
    } catch (erro) {
      if (!atual(ciclo)) return false;
      if (leitura || erro.status === 401) publicar({ carrinho: carrinhoVazio(), erro });
      if (!leitura) throw erro;
      return true;
    } finally {
      if (leitura && atual(ciclo)) publicar({ carregando: false });
    }
  }

  return {
    obterSnapshot: () => estado,
    assinar: (ouvir) => { ouvintes.add(ouvir); return () => ouvintes.delete(ouvir); },
    ativar: () => {
      geracao++;
      ativo = true;
      publicar({ carrinho: carrinhoVazio(), carregando: autenticado, erro: null });
    },
    invalidar: () => {
      ativo = false;
      geracao++;
      publicar({ carrinho: carrinhoVazio(), carregando: false, erro: null });
    },
    recarregar: () => executar('ler', [], true),
    adicionar: (codigo, quantidade = 1) => executar('adicionar', [codigo, quantidade]),
    alterar: (codigo, quantidade) => executar('alterar', [codigo, quantidade]),
    remover: (codigo) => executar('remover', [codigo]),
    limpar: () => executar('limpar', []),
    setCarrinho: (valor) => {
      if (!ativo || !autenticado) return false;
      const carrinho = typeof valor === 'function' ? valor(estado.carrinho) : valor;
      publicar({ carrinho, erro: null });
      return true;
    },
  };
}
