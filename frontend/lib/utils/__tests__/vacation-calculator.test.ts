import { calculateVacation, VacationCalculationInput } from '../vacation-calculator';

describe('vacation-calculator', () => {
  describe('calculateVacation', () => {
    const baseInput: VacationCalculationInput = {
      monthlySalary: 3000,
      totalDays: 30,
      soldDays: 0,
      advance13thSalary: false,
      dependents: 0,
    };

    describe('cálculos básicos de férias', () => {
      it('deve calcular férias de 30 dias corretamente', () => {
        const result = calculateVacation(baseInput);

        expect(result.monthlySalary).toBe(3000);
        expect(result.dailySalary).toBe(100);
        expect(result.vacationDays).toBe(30);
        expect(result.soldDays).toBe(0);
      });

      it('deve calcular 1/3 constitucional', () => {
        const result = calculateVacation(baseInput);

        expect(result.vacationBase).toBe(3000);
        expect(result.vacationThird).toBe(1000);
        expect(result.vacationTotal).toBe(4000);
      });

      it('deve calcular total bruto corretamente', () => {
        const result = calculateVacation(baseInput);

        expect(result.grossTotal).toBe(4000);
      });
    });

    describe('abono pecuniário (dias vendidos)', () => {
      it('deve calcular 10 dias vendidos corretamente', () => {
        const input: VacationCalculationInput = {
          ...baseInput,
          soldDays: 10,
        };
        const result = calculateVacation(input);

        expect(result.vacationDays).toBe(20);
        expect(result.soldDays).toBe(10);
        expect(result.soldDaysBase).toBe(1000); // 10 dias * R$100
        expect(result.soldDaysThird).toBeCloseTo(333.33, 1); // 1/3 do abono
      });

      it('deve somar abono ao total bruto', () => {
        const input: VacationCalculationInput = {
          ...baseInput,
          soldDays: 10,
        };
        const result = calculateVacation(input);

        // Férias (20 dias): 2000 + 666.67 = 2666.67
        // Abono (10 dias): 1000 + 333.33 = 1333.33
        // Total: 4000
        expect(result.grossTotal).toBeCloseTo(4000, 0);
      });
    });

    describe('adiantamento 13º salário', () => {
      it('deve calcular adiantamento do 13º (50% do salário)', () => {
        const input: VacationCalculationInput = {
          ...baseInput,
          advance13thSalary: true,
        };
        const result = calculateVacation(input);

        expect(result.advance13th).toBe(1500); // 50% de 3000
      });

      it('deve somar 13º ao total bruto', () => {
        const input: VacationCalculationInput = {
          ...baseInput,
          advance13thSalary: true,
        };
        const result = calculateVacation(input);

        // Férias: 4000 + 13º: 1500 = 5500
        expect(result.grossTotal).toBe(5500);
      });

      it('deve incluir 13º na base do INSS', () => {
        const input: VacationCalculationInput = {
          ...baseInput,
          advance13thSalary: true,
        };
        const result = calculateVacation(input);

        // INSS incide sobre férias + 1/3 + 13º (não sobre abono)
        expect(result.inssBase).toBe(5500);
      });
    });

    describe('descontos INSS', () => {
      it('deve calcular INSS corretamente', () => {
        const result = calculateVacation(baseInput);

        // Base: 4000 - aplica faixa de 12%
        expect(result.inss).toBeGreaterThan(0);
        expect(result.inss).toBeLessThan(result.inssBase * 0.15);
      });

      it('deve ter INSS zero para salário muito baixo', () => {
        const input: VacationCalculationInput = {
          ...baseInput,
          monthlySalary: 0,
        };
        const result = calculateVacation(input);

        expect(result.inss).toBe(0);
      });
    });

    describe('descontos IRRF', () => {
      it('deve calcular IRRF sobre base após INSS', () => {
        const result = calculateVacation(baseInput);

        // Base IRRF = bruto - INSS
        expect(result.irrfBase).toBe(result.inssBase - result.inss);
      });

      it('deve considerar dependentes no cálculo do IRRF', () => {
        const semDependentes = calculateVacation(baseInput);
        const comDependentes = calculateVacation({
          ...baseInput,
          dependents: 2,
        });

        // IRRF deve ser menor com dependentes
        expect(comDependentes.irrf).toBeLessThanOrEqual(semDependentes.irrf);
      });
    });

    describe('valor líquido', () => {
      it('deve calcular líquido = bruto - descontos', () => {
        const result = calculateVacation(baseInput);

        expect(result.netTotal).toBe(result.grossTotal - result.totalDeductions);
      });

      it('deve ter líquido menor que bruto', () => {
        const result = calculateVacation(baseInput);

        expect(result.netTotal).toBeLessThan(result.grossTotal);
      });
    });

    describe('FGTS', () => {
      it('deve calcular FGTS como 8% da base', () => {
        const result = calculateVacation(baseInput);

        // FGTS sobre férias + 1/3 + 13º
        const expectedFGTS = (result.vacationTotal + result.advance13th) * 0.08;
        expect(result.fgts).toBeCloseTo(expectedFGTS, 2);
      });

      it('deve incluir FGTS no custo do empregador', () => {
        const result = calculateVacation(baseInput);

        expect(result.employerCost).toBe(result.grossTotal + result.fgts);
      });
    });

    describe('cenários completos', () => {
      it('deve calcular férias completas com todos os benefícios', () => {
        const input: VacationCalculationInput = {
          monthlySalary: 5000,
          totalDays: 30,
          soldDays: 10,
          advance13thSalary: true,
          dependents: 1,
        };
        const result = calculateVacation(input);

        // Verifica estrutura completa
        expect(result).toHaveProperty('monthlySalary');
        expect(result).toHaveProperty('vacationTotal');
        expect(result).toHaveProperty('soldDaysTotal');
        expect(result).toHaveProperty('advance13th');
        expect(result).toHaveProperty('grossTotal');
        expect(result).toHaveProperty('netTotal');
        expect(result).toHaveProperty('employerCost');

        // Verifica consistência
        expect(result.vacationDays + result.soldDays).toBe(result.totalDays);
        // Usando toBeCloseTo para lidar com arredondamentos
        expect(result.grossTotal).toBeCloseTo(
          result.vacationTotal + result.soldDaysTotal + result.advance13th,
          1
        );
      });

      it('deve ter todos os valores arredondados para 2 casas decimais', () => {
        const input: VacationCalculationInput = {
          monthlySalary: 3333.33,
          totalDays: 30,
          soldDays: 7,
          advance13thSalary: true,
          dependents: 2,
        };
        const result = calculateVacation(input);

        // Verifica arredondamento
        const checkDecimals = (value: number) => {
          const decimals = value.toString().split('.')[1];
          return !decimals || decimals.length <= 2;
        };

        expect(checkDecimals(result.vacationBase)).toBe(true);
        expect(checkDecimals(result.vacationThird)).toBe(true);
        expect(checkDecimals(result.grossTotal)).toBe(true);
        expect(checkDecimals(result.netTotal)).toBe(true);
      });
    });
  });
});
