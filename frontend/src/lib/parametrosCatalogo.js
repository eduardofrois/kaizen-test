export function atualizarParametroCatalogo(parametros, chave, valor) {
  const proximos = new URLSearchParams(parametros);
  if (valor === null || valor === '' || valor === false) proximos.delete(chave);
  else proximos.set(chave, String(valor));
  if (chave !== 'pagina') proximos.delete('pagina');
  return proximos;
}
