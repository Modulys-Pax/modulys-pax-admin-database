import {
  getWorkingDaysInMonth,
  getCurrentMonthWorkingDays,
  getMonthWorkingDays,
} from './working-days.util';

describe('working-days.util', () => {
  describe('getWorkingDaysInMonth', () => {
    it('deve calcular dias úteis corretamente para janeiro 2024', () => {
      // Janeiro 2024: 31 dias, 23 dias úteis (seg-sex)
      const result = getWorkingDaysInMonth({ year: 2024, month: 1 });
      expect(result).toBe(23);
    });

    it('deve calcular dias úteis para fevereiro 2024 (bissexto)', () => {
      // Fevereiro 2024: 29 dias, 21 dias úteis
      const result = getWorkingDaysInMonth({ year: 2024, month: 2 });
      expect(result).toBe(21);
    });

    it('deve contar todos os dias quando includeWeekends é true', () => {
      // Janeiro 2024: 31 dias
      const result = getWorkingDaysInMonth({ year: 2024, month: 1, includeWeekends: true });
      expect(result).toBe(31);
    });

    it('deve excluir feriados', () => {
      // Janeiro 2024 com 1 feriado (Ano Novo)
      const holidays = [new Date(2024, 0, 1)]; // 1 de janeiro
      const result = getWorkingDaysInMonth({ year: 2024, month: 1, holidays });
      expect(result).toBe(22); // 23 - 1 feriado
    });

    it('deve excluir múltiplos feriados', () => {
      // Dezembro 2024 com Natal e Ano Novo próximo
      const holidays = [
        new Date(2024, 11, 25), // Natal
      ];
      const result = getWorkingDaysInMonth({ year: 2024, month: 12, holidays });
      // Dezembro 2024: 22 dias úteis, menos 1 feriado = 21
      expect(result).toBe(21);
    });

    it('deve ignorar feriados de outros meses', () => {
      const holidays = [
        new Date(2024, 1, 15), // Fevereiro
      ];
      const result = getWorkingDaysInMonth({ year: 2024, month: 1, holidays });
      expect(result).toBe(23); // Não afeta janeiro
    });

    it('deve calcular corretamente para mês com 30 dias', () => {
      // Abril 2024: 30 dias, 22 dias úteis
      const result = getWorkingDaysInMonth({ year: 2024, month: 4 });
      expect(result).toBe(22);
    });

    it('deve funcionar com feriados em fim de semana', () => {
      // Se o feriado cai num fim de semana, não afeta a contagem de dias úteis
      // 1 de Janeiro 2023 foi domingo
      const holidays = [new Date(2023, 0, 1)];
      const result = getWorkingDaysInMonth({ year: 2023, month: 1, holidays });
      // O feriado caiu no domingo, então não afeta
      expect(result).toBe(22); // Janeiro 2023 teve 22 dias úteis
    });
  });

  describe('getCurrentMonthWorkingDays', () => {
    it('deve retornar número de dias úteis do mês atual', () => {
      const result = getCurrentMonthWorkingDays();
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(23); // Máximo possível
    });

    it('deve aceitar parâmetro includeWeekends', () => {
      const withWeekends = getCurrentMonthWorkingDays(true);
      const withoutWeekends = getCurrentMonthWorkingDays(false);

      expect(withWeekends).toBeGreaterThanOrEqual(withoutWeekends);
    });

    it('deve aceitar lista de feriados', () => {
      const now = new Date();
      const holidays = [new Date(now.getFullYear(), now.getMonth(), 15)];
      const result = getCurrentMonthWorkingDays(false, holidays);

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getMonthWorkingDays', () => {
    it('deve calcular dias úteis para uma data específica', () => {
      const date = new Date(2024, 0, 15); // Janeiro 2024
      const result = getMonthWorkingDays(date);
      expect(result).toBe(23);
    });

    it('deve aceitar parâmetro includeWeekends', () => {
      const date = new Date(2024, 0, 15);
      const result = getMonthWorkingDays(date, true);
      expect(result).toBe(31);
    });

    it('deve aceitar lista de feriados', () => {
      const date = new Date(2024, 0, 15);
      const holidays = [new Date(2024, 0, 1)];
      const result = getMonthWorkingDays(date, false, holidays);
      expect(result).toBe(22);
    });
  });
});
