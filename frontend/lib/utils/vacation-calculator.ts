/**
 * Utilitário para cálculo de valores de férias
 * Baseado na legislação trabalhista brasileira
 */

/**
 * Tabela progressiva do INSS 2025
 */
const INSS_TABLE_2025 = [
  { min: 0, max: 1518.0, rate: 7.5, deduction: 0 },
  { min: 1518.01, max: 2793.88, rate: 9.0, deduction: 22.77 },
  { min: 2793.89, max: 4190.83, rate: 12.0, deduction: 106.59 },
  { min: 4190.84, max: 8157.41, rate: 14.0, deduction: 190.4 },
];

/**
 * Tabela progressiva do IRRF 2025
 * Base: Salário - INSS - Dependentes (R$ 189,59 por dependente)
 */
const IRRF_TABLE_2025 = [
  { min: 0, max: 2259.2, rate: 0, deduction: 0 },
  { min: 2259.21, max: 2826.65, rate: 7.5, deduction: 169.44 },
  { min: 2826.66, max: 3751.05, rate: 15.0, deduction: 381.44 },
  { min: 3751.06, max: 4664.68, rate: 22.5, deduction: 662.77 },
  { min: 4664.69, max: Infinity, rate: 27.5, deduction: 896.0 },
];

/**
 * Calcula o INSS sobre um valor
 */
function calculateINSS(value: number): number {
  if (value <= 0) return 0;

  // Para valores >= R$ 4.190,84, aplica 14%
  if (value >= 4190.84) {
    return Math.round((value * 14) / 100 * 100) / 100;
  }

  // Fórmula progressiva
  for (const bracket of INSS_TABLE_2025) {
    if (value >= bracket.min && value <= bracket.max) {
      const contribution = (value * bracket.rate) / 100 - bracket.deduction;
      return Math.max(0, Math.round(contribution * 100) / 100);
    }
  }

  return 0;
}

/**
 * Calcula o IRRF sobre um valor (já descontado INSS)
 * @param baseValue Valor base para cálculo (bruto - INSS)
 * @param dependents Número de dependentes (padrão 0)
 */
function calculateIRRF(baseValue: number, dependents = 0): number {
  // Desconto por dependente: R$ 189,59
  const dependentDeduction = dependents * 189.59;
  const taxableBase = baseValue - dependentDeduction;

  if (taxableBase <= 0) return 0;

  for (const bracket of IRRF_TABLE_2025) {
    if (taxableBase >= bracket.min && taxableBase <= bracket.max) {
      const tax = (taxableBase * bracket.rate) / 100 - bracket.deduction;
      return Math.max(0, Math.round(tax * 100) / 100);
    }
  }

  return 0;
}

/**
 * Calcula o FGTS sobre um valor (8%)
 */
function calculateFGTS(value: number): number {
  if (value <= 0) return 0;
  return Math.round((value * 8) / 100 * 100) / 100;
}

export interface VacationCalculationInput {
  monthlySalary: number; // Salário mensal bruto
  totalDays: number; // Total de dias de férias (normalmente 30)
  soldDays: number; // Dias vendidos (abono pecuniário, máx 10)
  advance13thSalary: boolean; // Antecipar 1ª parcela do 13º
  dependents?: number; // Número de dependentes para IRRF
}

export interface VacationCalculationResult {
  // Valores base
  monthlySalary: number;
  dailySalary: number;
  totalDays: number;
  vacationDays: number; // Dias efetivos de férias (total - vendidos)
  soldDays: number;

  // Férias (dias gozados)
  vacationBase: number; // Salário proporcional aos dias de férias
  vacationThird: number; // 1/3 constitucional
  vacationTotal: number; // Férias + 1/3

  // Abono pecuniário (dias vendidos)
  soldDaysBase: number; // Salário proporcional aos dias vendidos
  soldDaysThird: number; // 1/3 sobre abono
  soldDaysTotal: number; // Abono + 1/3

  // 13º salário (se antecipado)
  advance13th: number; // 50% do salário (1ª parcela)

  // Total bruto
  grossTotal: number;

  // Descontos
  inssBase: number; // Base de cálculo do INSS (férias + 1/3 + 13º - abono é isento)
  inss: number;
  irrfBase: number; // Base de cálculo do IRRF (bruto - INSS - abono é isento)
  irrf: number;
  totalDeductions: number;

  // Valor líquido
  netTotal: number;

  // FGTS (pago pela empresa, não descontado)
  fgts: number;

  // Custo total empresa
  employerCost: number;
}

/**
 * Calcula todos os valores relacionados às férias
 */
export function calculateVacation(
  input: VacationCalculationInput
): VacationCalculationResult {
  const { monthlySalary, totalDays, soldDays, advance13thSalary, dependents = 0 } = input;

  // Salário diário (base 30 dias)
  const dailySalary = monthlySalary / 30;

  // Dias efetivos de férias (descontando vendidos)
  const vacationDays = totalDays - soldDays;

  // === FÉRIAS (dias gozados) ===
  const vacationBase = dailySalary * vacationDays;
  const vacationThird = vacationBase / 3; // 1/3 constitucional
  const vacationTotal = vacationBase + vacationThird;

  // === ABONO PECUNIÁRIO (dias vendidos) ===
  const soldDaysBase = dailySalary * soldDays;
  const soldDaysThird = soldDaysBase / 3; // 1/3 sobre abono
  const soldDaysTotal = soldDaysBase + soldDaysThird;

  // === ADIANTAMENTO 13º (se marcado) ===
  const advance13th = advance13thSalary ? monthlySalary / 2 : 0;

  // === TOTAL BRUTO ===
  const grossTotal = vacationTotal + soldDaysTotal + advance13th;

  // === DESCONTOS ===
  // INSS: incide sobre férias + 1/3 + 13º (abono pecuniário é ISENTO de INSS)
  const inssBase = vacationTotal + advance13th;
  const inss = calculateINSS(inssBase);

  // IRRF: incide sobre (férias + 1/3 + 13º - INSS) (abono pecuniário é ISENTO de IRRF)
  const irrfBase = inssBase - inss;
  const irrf = calculateIRRF(irrfBase, dependents);

  const totalDeductions = inss + irrf;

  // === VALOR LÍQUIDO ===
  // Líquido = Bruto - Descontos
  // Abono pecuniário é 100% líquido (isento de INSS e IRRF)
  const netTotal = grossTotal - totalDeductions;

  // === FGTS (pago pela empresa) ===
  // FGTS: 8% sobre férias + 1/3 + 13º (abono não incide FGTS normalmente)
  const fgts = calculateFGTS(vacationTotal + advance13th);

  // === CUSTO TOTAL EMPRESA ===
  const employerCost = grossTotal + fgts;

  return {
    // Valores base
    monthlySalary: round(monthlySalary),
    dailySalary: round(dailySalary),
    totalDays,
    vacationDays,
    soldDays,

    // Férias
    vacationBase: round(vacationBase),
    vacationThird: round(vacationThird),
    vacationTotal: round(vacationTotal),

    // Abono
    soldDaysBase: round(soldDaysBase),
    soldDaysThird: round(soldDaysThird),
    soldDaysTotal: round(soldDaysTotal),

    // 13º
    advance13th: round(advance13th),

    // Totais
    grossTotal: round(grossTotal),

    // Descontos
    inssBase: round(inssBase),
    inss: round(inss),
    irrfBase: round(irrfBase),
    irrf: round(irrf),
    totalDeductions: round(totalDeductions),

    // Líquido
    netTotal: round(netTotal),

    // Empresa
    fgts: round(fgts),
    employerCost: round(employerCost),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
