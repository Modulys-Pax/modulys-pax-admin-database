import {
  unformatCurrency,
  formatCurrency,
  formatCurrencyInput,
  formatCurrencyForInput,
} from '../currency';

describe('currency utils', () => {
  describe('unformatCurrency', () => {
    it('deve retornar 0 para string vazia', () => {
      expect(unformatCurrency('')).toBe(0);
    });

    it('deve converter R$ 1.234,56 para 1234.56', () => {
      expect(unformatCurrency('R$ 1.234,56')).toBe(1234.56);
    });

    it('deve converter 1234,56 para 1234.56', () => {
      expect(unformatCurrency('1234,56')).toBe(1234.56);
    });

    it('deve remover caracteres não numéricos', () => {
      expect(unformatCurrency('R$ 100,00')).toBe(100);
    });

    it('deve retornar 0 para string inválida', () => {
      expect(unformatCurrency('abc')).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar número para moeda brasileira', () => {
      expect(formatCurrency(1234.56)).toContain('1.234,56');
    });

    it('deve mostrar R$ 0,00 por padrão para null', () => {
      expect(formatCurrency(null)).toContain('0,00');
    });

    it('deve mostrar R$ 0,00 por padrão para undefined', () => {
      expect(formatCurrency(undefined)).toContain('0,00');
    });

    it('deve retornar string vazia quando showZero é false', () => {
      expect(formatCurrency(null, false)).toBe('');
      expect(formatCurrency(0, false)).toBe('');
    });

    it('deve converter string para número', () => {
      expect(formatCurrency('1234.56')).toContain('1.234,56');
    });

    it('deve retornar R$ 0,00 para string inválida', () => {
      expect(formatCurrency('invalid')).toContain('0,00');
    });

    it('deve formatar valores negativos', () => {
      expect(formatCurrency(-1234.56)).toContain('1.234,56');
    });
  });

  describe('formatCurrencyInput', () => {
    it('deve retornar string vazia para input vazio', () => {
      expect(formatCurrencyInput('')).toBe('');
    });

    it('deve formatar centavos corretamente', () => {
      expect(formatCurrencyInput('100')).toBe('1,00');
      expect(formatCurrencyInput('12345')).toBe('123,45');
    });

    it('deve remover caracteres não numéricos', () => {
      expect(formatCurrencyInput('abc')).toBe('');
    });

    it('deve formatar valores grandes', () => {
      expect(formatCurrencyInput('123456789')).toBe('1.234.567,89');
    });
  });

  describe('formatCurrencyForInput', () => {
    it('deve retornar string vazia para null', () => {
      expect(formatCurrencyForInput(null)).toBe('');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(formatCurrencyForInput(undefined)).toBe('');
    });

    it('deve retornar string vazia para zero', () => {
      expect(formatCurrencyForInput(0)).toBe('');
    });

    it('deve formatar valor para input', () => {
      expect(formatCurrencyForInput(1234.56)).toContain('1.234,56');
    });

    it('deve converter string para número', () => {
      expect(formatCurrencyForInput('1234.56')).toContain('1.234,56');
    });
  });
});
