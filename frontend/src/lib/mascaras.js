const digitos = valor => String(valor ?? '').replace(/\D/g, '');

function agrupar(texto, tamanhos, separadores) {
  let resultado = '';
  let inicio = 0;
  for (let i = 0; i < tamanhos.length && inicio < texto.length; i++) {
    if (i) resultado += separadores[i - 1];
    resultado += texto.slice(inicio, inicio + tamanhos[i]);
    inicio += tamanhos[i];
  }
  return resultado;
}

export function formatarDocumento(valor) {
  const texto = digitos(valor).slice(0, 14);
  return texto.length <= 11
    ? agrupar(texto, [3, 3, 3, 2], ['.', '.', '-'])
    : agrupar(texto, [2, 3, 3, 4, 2], ['.', '.', '/', '-']);
}

export function formatarTelefone(valor) {
  const texto = digitos(valor).slice(0, 11);
  if (!texto) return '';
  if (texto.length <= 2) return '(' + texto;
  return '(' + texto.slice(0, 2) + ') '
    + agrupar(texto.slice(2), [texto.length === 11 ? 5 : 4, 4], ['-']);
}

const formatar = (tipo, valor) => tipo === 'documento' ? formatarDocumento(valor) : formatarTelefone(valor);

export function formatarValorInicial(tipo, valor) {
  const texto = String(valor ?? '');
  const quantidade = digitos(texto).length;
  const valido = tipo === 'documento'
    ? /^[\d.\s/-]*$/.test(texto) && [11, 14].includes(quantidade)
    : /^[\d()\s-]*$/.test(texto) && [10, 11].includes(quantidade);
  return valido ? formatar(tipo, texto) : texto;
}

function posicaoDoDigito(texto, quantidade) {
  if (quantidade <= 0) return 0;
  let encontrados = 0;
  for (let i = 0; i < texto.length; i++) {
    if (/\d/.test(texto[i]) && ++encontrados === quantidade) return i + 1;
  }
  return texto.length;
}

export function ajustarEntrada(tipo, valor, cursor) {
  const texto = formatar(tipo, valor);
  return { valor: texto, cursor: posicaoDoDigito(texto, digitos(valor.slice(0, cursor)).length) };
}

export function apagarNaMascara(tipo, valor, inicio, fim, direcao) {
  const texto = digitos(valor);
  let primeiro = digitos(valor.slice(0, inicio)).length;
  let ultimo = digitos(valor.slice(0, fim)).length;
  if (primeiro === ultimo) {
    if (direcao === 'Backspace') primeiro = Math.max(0, primeiro - 1);
    else ultimo = Math.min(texto.length, ultimo + 1);
  }
  const resultado = formatar(tipo, texto.slice(0, primeiro) + texto.slice(ultimo));
  return { valor: resultado, cursor: posicaoDoDigito(resultado, primeiro) };
}
