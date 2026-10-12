import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarDocumento, formatarTelefone, formatarValorInicial, ajustarEntrada, apagarNaMascara } from '../src/lib/mascaras.js';

for (const [entrada, esperado] of [
  ['', ''], ['0','0'], ['0123','012.3'], ['0123456','012.345.6'],
  ['0123456789','012.345.678-9'], ['01234567890','012.345.678-90'],
  ['012345678901','01.234.567/8901'], ['01234567890123','01.234.567/8901-23'],
  ['01.234.567/8901-234567','01.234.567/8901-23'], ['abc012x3','012.3'], ['abc',''],
]) test('documento: '+JSON.stringify(entrada), () => assert.equal(formatarDocumento(entrada), esperado));
for (const [entrada, esperado] of [
  ['', ''], ['1','(1'], ['11','(11'], ['113','(11) 3'], ['113456','(11) 3456'],
  ['1134567','(11) 3456-7'], ['1134567890','(11) 3456-7890'],
  ['11987654321','(11) 98765-4321'], ['(11) 98765-432199','(11) 98765-4321'], ['abc',''],
]) test('telefone: '+JSON.stringify(entrada), () => assert.equal(formatarTelefone(entrada), esperado));
test('inicializacao preserva legado e formata apenas dominio completo', () => {
  assert.equal(formatarValorInicial('documento','01234567890'),'012.345.678-90');
  assert.equal(formatarValorInicial('telefone','11987654321'),'(11) 98765-4321');
  for (const tipo of ['documento','telefone']) for (const valor of ['abc123','123','1'.repeat(30),'+5511987654321']) {
    assert.equal(formatarValorInicial(tipo,valor),valor);
  }
  assert.equal(formatarValorInicial('telefone',null),'');
});
test('cursor segue digitos na insercao e troca de mascara', () => {
  assert.deepEqual(ajustarEntrada('documento','0129345',4),{valor:'012.934.5',cursor:5});
  const resultado = ajustarEntrada('documento','012.345.678-901',15);
  assert.deepEqual(resultado,{valor:'01.234.567/8901',cursor:15});
});
test('exclusao ao redor de pontuacao e selecao', () => {
  assert.deepEqual(apagarNaMascara('documento','012.345',4,4,'Backspace'),{valor:'013.45',cursor:2});
  assert.deepEqual(apagarNaMascara('documento','012.345',3,3,'Delete'),{valor:'012.45',cursor:3});
  assert.deepEqual(apagarNaMascara('telefone','(11) 3456-7890',0,14,'Backspace'),{valor:'',cursor:0});
  assert.deepEqual(apagarNaMascara('documento','',0,0,'Delete'),{valor:'',cursor:0});
});
test('exclusao de cada digito e fronteira de pontuacao', () => {
  for (const [tipo, valor] of [['documento','01.234.567/8901-23'],['telefone','(11) 98765-4321']]) {
    const numeros = valor.replace(/\D/g,'');
    for (let posicao = 0; posicao <= valor.length; posicao++) {
      const anteriores = valor.slice(0,posicao).replace(/\D/g,'').length;
      const remover = (indice) => numeros.slice(0,indice)+numeros.slice(indice+1);
      const voltar = apagarNaMascara(tipo,valor,posicao,posicao,'Backspace');
      const avancar = apagarNaMascara(tipo,valor,posicao,posicao,'Delete');
      assert.equal(voltar.valor.replace(/\D/g,''),anteriores ? remover(anteriores-1) : numeros);
      assert.equal(avancar.valor.replace(/\D/g,''),anteriores < numeros.length ? remover(anteriores) : numeros);
      assert.ok(voltar.cursor <= voltar.valor.length);
      assert.ok(avancar.cursor <= avancar.valor.length);
    }
  }
});
test('substituicao parcial e colagem com excesso mantem limites e cursor', () => {
  assert.deepEqual(ajustarEntrada('documento','012.993.678-90',6),{valor:'012.993.678-90',cursor:6});
  assert.equal(ajustarEntrada('telefone','119876543219999',15).valor,'(11) 98765-4321');
  assert.equal(apagarNaMascara('documento','012.345.678-90',4,7,'Delete').valor,'012.678.90');
});
