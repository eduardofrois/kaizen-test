import { useLayoutEffect, useRef } from 'react';
import { ajustarEntrada, apagarNaMascara } from '../lib/mascaras.js';
import { Campo } from './ui.jsx';

export function CampoComMascara({ tipoMascara, value, onChange, name, id = name, erro, rotulo, dica, ...props }) {
  const input = useRef(null);
  const selecao = useRef(null);
  const antesDaEdicao = useRef(null);

  useLayoutEffect(() => {
    if (selecao.current !== null && document.activeElement === input.current) {
      input.current.setSelectionRange(selecao.current, selecao.current);
      selecao.current = null;
    }
  });

  function publicar(resultado) {
    selecao.current = resultado.cursor;
    onChange({ target: { name, value: resultado.valor } });
    if (resultado.valor === value) {
      input.current.value = value;
      input.current.setSelectionRange(resultado.cursor, resultado.cursor);
      selecao.current = null;
    }
  }

  function mudar(evento) {
    if (evento.nativeEvent.isComposing) return;
    const anterior = antesDaEdicao.current;
    antesDaEdicao.current = null;
    const tipo = evento.nativeEvent.inputType;
    if (anterior && ['deleteContentBackward', 'deleteContentForward'].includes(tipo)
      && evento.target.value.replace(/\D/g, '') === String(value).replace(/\D/g, '')) {
      publicar(apagarNaMascara(tipoMascara, value, anterior.inicio, anterior.fim,
        tipo === 'deleteContentBackward' ? 'Backspace' : 'Delete'));
    } else {
      publicar(ajustarEntrada(tipoMascara, evento.target.value, evento.target.selectionStart ?? evento.target.value.length));
    }
  }

  function tecla(evento) {
    if (evento.isComposing || evento.nativeEvent.isComposing || evento.ctrlKey || evento.metaKey || evento.altKey
      || !['Backspace', 'Delete'].includes(evento.key)) return;
    evento.preventDefault();
    antesDaEdicao.current = null;
    publicar(apagarNaMascara(tipoMascara, value, evento.target.selectionStart, evento.target.selectionEnd, evento.key));
  }

  return (
    <Campo id={id} rotulo={rotulo} erro={erro} dica={dica}>
      <input
        {...props}
        ref={input}
        id={id}
        name={name}
        value={value}
        inputMode="numeric"
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        onChange={mudar}
        onKeyDown={tecla}
        onBeforeInput={evento => {
          antesDaEdicao.current = { inicio: evento.target.selectionStart, fim: evento.target.selectionEnd };
        }}
        onCompositionEnd={evento => {
          publicar(ajustarEntrada(tipoMascara, evento.target.value, evento.target.selectionStart ?? evento.target.value.length));
        }}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-tinta-900
          placeholder:text-tinta-400 focus:outline-none focus:ring-2
          ${erro ? 'border-red-400 bg-red-50 focus:ring-red-200'
            : 'border-tinta-300 bg-white focus:border-marca-500 focus:ring-marca-100'}`}
      />
    </Campo>
  );
}
