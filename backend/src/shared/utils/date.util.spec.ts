import {
  toEndOfDay,
  toStartOfDay,
  createDateFilter,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  isSameMonth,
  toISODateString,
} from './date.util';

describe('date.util', () => {
  describe('toEndOfDay', () => {
    it('deve ajustar para 23:59:59.999', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = toEndOfDay(date);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('não deve modificar a data original', () => {
      const original = new Date('2024-01-15T10:30:00Z');
      const originalHour = original.getHours();
      toEndOfDay(original);

      expect(original.getHours()).toBe(originalHour);
    });

    it('deve manter o mesmo dia', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = toEndOfDay(date);

      expect(result.getDate()).toBe(date.getDate());
      expect(result.getMonth()).toBe(date.getMonth());
      expect(result.getFullYear()).toBe(date.getFullYear());
    });
  });

  describe('toStartOfDay', () => {
    it('deve ajustar para 00:00:00.000', () => {
      const date = new Date('2024-01-15T10:30:45.123Z');
      const result = toStartOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('não deve modificar a data original', () => {
      const original = new Date('2024-01-15T10:30:00Z');
      const originalHour = original.getHours();
      toStartOfDay(original);

      expect(original.getHours()).toBe(originalHour);
    });
  });

  describe('createDateFilter', () => {
    it('deve retornar undefined quando não há datas', () => {
      expect(createDateFilter()).toBeUndefined();
      expect(createDateFilter(null, null)).toBeUndefined();
      expect(createDateFilter(undefined, undefined)).toBeUndefined();
    });

    it('deve criar filtro apenas com startDate', () => {
      const result = createDateFilter('2024-01-01');

      expect(result).toBeDefined();
      expect(result?.createdAt.gte).toBeInstanceOf(Date);
      expect(result?.createdAt.lte).toBeUndefined();
    });

    it('deve criar filtro apenas com endDate', () => {
      const result = createDateFilter(null, '2024-12-31');

      expect(result).toBeDefined();
      expect(result?.createdAt.gte).toBeUndefined();
      expect(result?.createdAt.lte).toBeInstanceOf(Date);
    });

    it('deve criar filtro com ambas as datas', () => {
      const result = createDateFilter('2024-01-01', '2024-12-31');

      expect(result).toBeDefined();
      expect(result?.createdAt.gte).toBeInstanceOf(Date);
      expect(result?.createdAt.lte).toBeInstanceOf(Date);
    });

    it('deve usar fieldName personalizado', () => {
      const result = createDateFilter('2024-01-01', null, 'dueDate');

      expect(result).toBeDefined();
      expect(result?.dueDate).toBeDefined();
    });

    it('deve aceitar Date objects', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = createDateFilter(start, end);

      expect(result).toBeDefined();
      expect(result?.createdAt.gte).toBeInstanceOf(Date);
      expect(result?.createdAt.lte).toBeInstanceOf(Date);
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('deve retornar primeiro dia do mês', () => {
      const result = getFirstDayOfMonth(2024, 1);

      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0); // Janeiro = 0
      expect(result.getFullYear()).toBe(2024);
    });

    it('deve retornar primeiro dia de dezembro', () => {
      const result = getFirstDayOfMonth(2024, 12);

      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(11); // Dezembro = 11
    });

    it('deve ter hora zerada', () => {
      const result = getFirstDayOfMonth(2024, 6);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('getLastDayOfMonth', () => {
    it('deve retornar último dia de janeiro', () => {
      const result = getLastDayOfMonth(2024, 1);

      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0);
    });

    it('deve retornar 29 para fevereiro em ano bissexto', () => {
      const result = getLastDayOfMonth(2024, 2);

      expect(result.getDate()).toBe(29);
    });

    it('deve retornar 28 para fevereiro em ano não-bissexto', () => {
      const result = getLastDayOfMonth(2023, 2);

      expect(result.getDate()).toBe(28);
    });

    it('deve retornar 30 para abril', () => {
      const result = getLastDayOfMonth(2024, 4);

      expect(result.getDate()).toBe(30);
    });

    it('deve ter hora ajustada para fim do dia', () => {
      const result = getLastDayOfMonth(2024, 1);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });
  });

  describe('isSameMonth', () => {
    it('deve retornar true para mesmo mês e ano', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-28');

      expect(isSameMonth(date1, date2)).toBe(true);
    });

    it('deve retornar false para meses diferentes', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-02-15');

      expect(isSameMonth(date1, date2)).toBe(false);
    });

    it('deve retornar false para anos diferentes', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2023-01-15');

      expect(isSameMonth(date1, date2)).toBe(false);
    });
  });

  describe('toISODateString', () => {
    it('deve formatar data para YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = toISODateString(date);

      expect(result).toBe('2024-01-15');
    });

    it('deve funcionar com diferentes datas', () => {
      expect(toISODateString(new Date('2024-12-31'))).toBe('2024-12-31');
      expect(toISODateString(new Date('2023-06-01'))).toBe('2023-06-01');
    });
  });
});
