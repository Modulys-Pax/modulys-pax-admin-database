import { roundDecimal, roundCurrency, roundQuantity } from './decimal.util';

describe('decimal.util', () => {
  describe('roundDecimal', () => {
    it('deve arredondar para o número de casas especificado', () => {
      expect(roundDecimal(3.14159, 2)).toBe(3.14);
      expect(roundDecimal(3.14159, 3)).toBe(3.142);
      expect(roundDecimal(3.14159, 4)).toBe(3.1416);
    });

    it('deve retornar 0 para null', () => {
      expect(roundDecimal(null, 2)).toBe(0);
    });

    it('deve retornar 0 para undefined', () => {
      expect(roundDecimal(undefined, 2)).toBe(0);
    });

    it('deve converter string para número', () => {
      expect(roundDecimal('3.14159', 2)).toBe(3.14);
    });

    it('deve retornar 0 para string inválida', () => {
      expect(roundDecimal('invalid', 2)).toBe(0);
    });

    it('deve funcionar com números inteiros', () => {
      expect(roundDecimal(5, 2)).toBe(5);
    });

    it('deve arredondar para cima quando necessário', () => {
      expect(roundDecimal(3.145, 2)).toBe(3.15);
    });
  });

  describe('roundCurrency', () => {
    it('deve arredondar para 2 casas decimais', () => {
      expect(roundCurrency(100.999)).toBe(101);
      expect(roundCurrency(99.994)).toBe(99.99);
      expect(roundCurrency(99.995)).toBe(100);
    });

    it('deve retornar 0 para valores inválidos', () => {
      expect(roundCurrency(null)).toBe(0);
      expect(roundCurrency(undefined)).toBe(0);
    });
  });

  describe('roundQuantity', () => {
    it('deve arredondar para 4 casas decimais', () => {
      expect(roundQuantity(3.14159265)).toBe(3.1416);
      expect(roundQuantity(2.71828)).toBe(2.7183);
    });

    it('deve retornar 0 para valores inválidos', () => {
      expect(roundQuantity(null)).toBe(0);
      expect(roundQuantity(undefined)).toBe(0);
    });
  });
});
