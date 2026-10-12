import test from 'node:test';
import assert from 'node:assert/strict';
import { paraCentavos, paraReais } from '../src/lib/dinheiro.js';

for (const [entrada, esperado] of [
  [0, 0], [1, 100], [0.29, 29], [1.15, 115], [4.10, 410],
  [19.99, 1999], [156.8, 15680], ['1.15', 115], ['19.99', 1999],
]) {
  test('converte ' + JSON.stringify(entrada) + ' sem perder centavos', () => {
    assert.equal(paraCentavos(entrada), esperado);
    assert.ok(Number.isSafeInteger(paraCentavos(entrada)));
  });
}

test('ida e volta conserva faixa representativa de centavos', () => {
  for (let centavos = 0; centavos <= 100000; centavos++) {
    assert.equal(paraCentavos(paraReais(centavos)), centavos, 'centavos=' + centavos);
  }
});
