import {
  roundDecimal,
  roundCurrency,
  roundQuantity,
  roundInteger,
} from '../numbers';

describe('numbers utils', () => {
  describe('roundDecimal', () => {
    it('deve arredondar para número específico de casas', () => {
      expect(roundDecimal(1.2345, 2)).toBe(1.23);
      expect(roundDecimal(1.2345, 3)).toBe(1.235);
    });

    it('deve arredondar para cima corretamente', () => {
      expect(roundDecimal(1.235, 2)).toBe(1.24);
    });

    it('deve retornar 0 para null', () => {
      expect(roundDecimal(null, 2)).toBe(0);
    });

    it('deve retornar 0 para undefined', () => {
      expect(roundDecimal(undefined, 2)).toBe(0);
    });

    it('deve retornar 0 para NaN', () => {
      expect(roundDecimal(NaN, 2)).toBe(0);
    });

    it('deve aceitar string numérica', () => {
      expect(roundDecimal('1.2345', 2)).toBe(1.23);
    });

    it('deve retornar 0 para string inválida', () => {
      expect(roundDecimal('abc', 2)).toBe(0);
    });

    it('deve lidar com problema de ponto flutuante', () => {
      // 10.1 + 20.2 = 30.299999999999997 em JS
      expect(roundDecimal(30.299999999999997, 2)).toBe(30.3);
    });

    it('deve arredondar para 0 casas', () => {
      expect(roundDecimal(1.5, 0)).toBe(2);
      expect(roundDecimal(1.4, 0)).toBe(1);
    });

    it('deve lidar com números negativos', () => {
      expect(roundDecimal(-1.2345, 2)).toBe(-1.23);
    });
  });

  describe('roundCurrency', () => {
    it('deve arredondar para 2 casas decimais', () => {
      expect(roundCurrency(1234.567)).toBe(1234.57);
    });

    it('deve retornar 0 para null', () => {
      expect(roundCurrency(null)).toBe(0);
    });

    it('deve aceitar string', () => {
      expect(roundCurrency('1234.567')).toBe(1234.57);
    });

    it('deve lidar com centavos', () => {
      expect(roundCurrency(0.005)).toBe(0.01);
    });
  });

  describe('roundQuantity', () => {
    it('deve arredondar para 4 casas decimais', () => {
      expect(roundQuantity(1.23456)).toBe(1.2346);
    });

    it('deve retornar 0 para null', () => {
      expect(roundQuantity(null)).toBe(0);
    });

    it('deve aceitar string', () => {
      expect(roundQuantity('1.23456')).toBe(1.2346);
    });
  });

  describe('roundInteger', () => {
    it('deve arredondar para inteiro', () => {
      expect(roundInteger(1.5)).toBe(2);
      expect(roundInteger(1.4)).toBe(1);
    });

    it('deve retornar 0 para null', () => {
      expect(roundInteger(null)).toBe(0);
    });

    it('deve aceitar string', () => {
      expect(roundInteger('1.7')).toBe(2);
    });

    it('deve lidar com números negativos', () => {
      expect(roundInteger(-1.5)).toBe(-1);
    });
  });
});
