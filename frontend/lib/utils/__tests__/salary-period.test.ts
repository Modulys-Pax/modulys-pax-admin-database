import {
  getAllowedSalaryPeriods,
  isValidSalaryPeriod,
  getFilteredMonthOptions,
  getFilteredYearOptions,
} from '../salary-period';

describe('salary-period utils', () => {
  // Mock de data atual para testes consistentes
  const mockDate = new Date(2024, 5, 15); // 15 de Junho de 2024

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getAllowedSalaryPeriods', () => {
    it('deve retornar 2 períodos permitidos', () => {
      const periods = getAllowedSalaryPeriods();
      expect(periods).toHaveLength(2);
    });

    it('deve incluir mês atual', () => {
      const periods = getAllowedSalaryPeriods();
      const currentPeriod = periods.find((p) => p.month === 6 && p.year === 2024);
      expect(currentPeriod).toBeDefined();
      expect(currentPeriod?.label).toBe('Junho/2024');
    });

    it('deve incluir mês anterior', () => {
      const periods = getAllowedSalaryPeriods();
      const previousPeriod = periods.find((p) => p.month === 5 && p.year === 2024);
      expect(previousPeriod).toBeDefined();
      expect(previousPeriod?.label).toBe('Maio/2024');
    });

    it('deve ter mês atual como primeiro período', () => {
      const periods = getAllowedSalaryPeriods();
      expect(periods[0].month).toBe(6);
      expect(periods[0].year).toBe(2024);
    });
  });

  describe('getAllowedSalaryPeriods - virada de ano', () => {
    it('deve lidar com Janeiro (mês anterior é Dezembro do ano passado)', () => {
      jest.setSystemTime(new Date(2024, 0, 15)); // 15 de Janeiro de 2024
      
      const periods = getAllowedSalaryPeriods();
      
      expect(periods).toContainEqual(
        expect.objectContaining({ month: 1, year: 2024 })
      );
      expect(periods).toContainEqual(
        expect.objectContaining({ month: 12, year: 2023 })
      );
    });
  });

  describe('isValidSalaryPeriod', () => {
    it('deve retornar true para mês atual', () => {
      expect(isValidSalaryPeriod(6, 2024)).toBe(true);
    });

    it('deve retornar true para mês anterior', () => {
      expect(isValidSalaryPeriod(5, 2024)).toBe(true);
    });

    it('deve retornar false para 2 meses atrás', () => {
      expect(isValidSalaryPeriod(4, 2024)).toBe(false);
    });

    it('deve retornar false para mês futuro', () => {
      expect(isValidSalaryPeriod(7, 2024)).toBe(false);
    });

    it('deve retornar false para ano futuro', () => {
      expect(isValidSalaryPeriod(6, 2025)).toBe(false);
    });

    it('deve retornar false para ano muito passado', () => {
      expect(isValidSalaryPeriod(6, 2023)).toBe(false);
    });
  });

  describe('getFilteredMonthOptions', () => {
    it('deve retornar meses do ano atual', () => {
      const options = getFilteredMonthOptions(2024);
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some((o) => o.label === 'Junho')).toBe(true);
    });

    it('deve retornar array vazio para ano sem períodos permitidos', () => {
      const options = getFilteredMonthOptions(2023);
      
      // Em junho de 2024, não há meses de 2023 permitidos
      expect(options).toHaveLength(0);
    });

    it('deve ter estrutura correta', () => {
      const options = getFilteredMonthOptions(2024);
      
      if (options.length > 0) {
        expect(options[0]).toHaveProperty('value');
        expect(options[0]).toHaveProperty('label');
      }
    });
  });

  describe('getFilteredYearOptions', () => {
    it('deve retornar anos com períodos permitidos', () => {
      const options = getFilteredYearOptions();
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some((o) => o.value === '2024')).toBe(true);
    });

    it('deve ter estrutura correta', () => {
      const options = getFilteredYearOptions();
      
      expect(options[0]).toHaveProperty('value');
      expect(options[0]).toHaveProperty('label');
    });

    it('deve retornar anos únicos', () => {
      const options = getFilteredYearOptions();
      const years = options.map((o) => o.value);
      const uniqueYears = [...new Set(years)];
      
      expect(years).toEqual(uniqueYears);
    });
  });

  describe('getFilteredYearOptions - virada de ano', () => {
    it('deve incluir dois anos em Janeiro', () => {
      jest.setSystemTime(new Date(2024, 0, 15)); // 15 de Janeiro de 2024
      
      const options = getFilteredYearOptions();
      
      expect(options.some((o) => o.value === '2024')).toBe(true);
      expect(options.some((o) => o.value === '2023')).toBe(true);
    });
  });
});
