import {
  calculateEmployeeINSS,
  calculateEmployerINSS,
  calculateFGTS,
  getEmployeeINSSBracketRate,
  INSS_TABLE_2025,
  INSS_MAX_CONTRIBUTION_2025,
  INSS_MAX_SALARY_2025,
} from './tax-calculator';

describe('tax-calculator', () => {
  describe('calculateEmployeeINSS', () => {
    it('deve retornar 0 para salário negativo', () => {
      expect(calculateEmployeeINSS(-1000)).toBe(0);
    });

    it('deve retornar 0 para salário zero', () => {
      expect(calculateEmployeeINSS(0)).toBe(0);
    });

    it('deve calcular 7.5% para salário até R$ 1.518,00', () => {
      // Faixa 1: R$ 1.518,00 × 7,5% = R$ 113,85
      const result = calculateEmployeeINSS(1518);
      expect(result).toBe(113.85);
    });

    it('deve calcular progressivamente para salário na faixa 2', () => {
      // R$ 2.000,00: (2000 × 9%) - 22,77 = 180 - 22,77 = 157,23
      const result = calculateEmployeeINSS(2000);
      expect(result).toBe(157.23);
    });

    it('deve calcular progressivamente para salário na faixa 3', () => {
      // R$ 3.500,00: (3500 × 12%) - 106,59 = 420 - 106,59 = 313,41
      const result = calculateEmployeeINSS(3500);
      expect(result).toBe(313.41);
    });

    it('deve calcular 14% para salário >= R$ 4.190,84', () => {
      // R$ 5.000,00: 5000 × 14% = 700
      const result = calculateEmployeeINSS(5000);
      expect(result).toBe(700);
    });

    it('deve calcular 14% para salário no teto', () => {
      // R$ 8.157,41 × 14% = 1142,04
      const result = calculateEmployeeINSS(8157.41);
      expect(result).toBeCloseTo(1142.04, 1);
    });

    it('deve calcular 14% para salário acima do teto', () => {
      // R$ 10.000,00 × 14% = 1400
      const result = calculateEmployeeINSS(10000);
      expect(result).toBe(1400);
    });

    it('deve calcular corretamente no limite da faixa 1', () => {
      const result = calculateEmployeeINSS(1518.0);
      expect(result).toBe(113.85);
    });

    it('deve calcular corretamente no início da faixa 2', () => {
      // R$ 1.518,01: (1518.01 × 9%) - 22,77 = 136.62 - 22.77 = 113.85
      const result = calculateEmployeeINSS(1518.01);
      expect(result).toBeCloseTo(113.85, 1);
    });
  });

  describe('getEmployeeINSSBracketRate', () => {
    it('deve retornar 0 para salário zero', () => {
      expect(getEmployeeINSSBracketRate(0)).toBe(0);
    });

    it('deve retornar 0 para salário negativo', () => {
      expect(getEmployeeINSSBracketRate(-100)).toBe(0);
    });

    it('deve retornar 7.5 para salário na faixa 1', () => {
      expect(getEmployeeINSSBracketRate(1000)).toBe(7.5);
      expect(getEmployeeINSSBracketRate(1518)).toBe(7.5);
    });

    it('deve retornar 9 para salário na faixa 2', () => {
      expect(getEmployeeINSSBracketRate(2000)).toBe(9);
      expect(getEmployeeINSSBracketRate(2793.88)).toBe(9);
    });

    it('deve retornar 12 para salário na faixa 3', () => {
      expect(getEmployeeINSSBracketRate(3000)).toBe(12);
      expect(getEmployeeINSSBracketRate(4190.83)).toBe(12);
    });

    it('deve retornar 14 para salário >= R$ 4.190,84', () => {
      expect(getEmployeeINSSBracketRate(4190.84)).toBe(14);
      expect(getEmployeeINSSBracketRate(5000)).toBe(14);
      expect(getEmployeeINSSBracketRate(10000)).toBe(14);
    });
  });

  describe('calculateEmployerINSS', () => {
    it('deve retornar 0 para salário zero', () => {
      expect(calculateEmployerINSS(0)).toBe(0);
    });

    it('deve retornar 0 para salário negativo', () => {
      expect(calculateEmployerINSS(-1000)).toBe(0);
    });

    it('deve calcular 20% do salário', () => {
      expect(calculateEmployerINSS(1000)).toBe(200);
      expect(calculateEmployerINSS(5000)).toBe(1000);
      expect(calculateEmployerINSS(10000)).toBe(2000);
    });
  });

  describe('calculateFGTS', () => {
    it('deve retornar 0 para salário zero', () => {
      expect(calculateFGTS(0)).toBe(0);
    });

    it('deve retornar 0 para salário negativo', () => {
      expect(calculateFGTS(-1000)).toBe(0);
    });

    it('deve calcular 8% do salário', () => {
      expect(calculateFGTS(1000)).toBe(80);
      expect(calculateFGTS(5000)).toBe(400);
      expect(calculateFGTS(10000)).toBe(800);
    });
  });

  describe('constants', () => {
    it('deve ter tabela INSS 2025 correta', () => {
      expect(INSS_TABLE_2025).toHaveLength(4);
      expect(INSS_TABLE_2025[0].rate).toBe(7.5);
      expect(INSS_TABLE_2025[3].rate).toBe(14);
    });

    it('deve ter teto previdenciário correto', () => {
      expect(INSS_MAX_SALARY_2025).toBe(8157.41);
    });

    it('deve ter contribuição máxima correta', () => {
      expect(INSS_MAX_CONTRIBUTION_2025).toBe(951.63);
    });
  });
});
