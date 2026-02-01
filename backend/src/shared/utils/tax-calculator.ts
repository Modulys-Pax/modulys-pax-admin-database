/**
 * Utilitário para cálculos de impostos trabalhistas
 * Baseado na legislação brasileira vigente
 */

/**
 * Tabela progressiva do INSS 2025
 * Fonte: Portaria Interministerial MPS/MF nº 6, de 13 de janeiro de 2025
 * Site oficial: https://www.gov.br/inss/pt-br/noticias/confira-como-ficaram-as-aliquotas-de-contribuicao-ao-inss
 */
export interface INSSBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}

export const INSS_TABLE_2025: INSSBracket[] = [
  {
    min: 0,
    max: 1518.0,
    rate: 7.5,
    deduction: 0,
  },
  {
    min: 1518.01,
    max: 2793.88,
    rate: 9.0,
    deduction: 22.77,
  },
  {
    min: 2793.89,
    max: 4190.83,
    rate: 12.0,
    deduction: 106.59,
  },
  {
    min: 4190.84,
    max: 8157.41,
    rate: 14.0,
    deduction: 190.4,
  },
];

/**
 * Teto de contribuição do INSS 2025
 * Fonte: Portaria Interministerial MPS/MF nº 6, de 13 de janeiro de 2025
 * Teto previdenciário: R$ 8.157,41
 * Desconto máximo: R$ 951,63 (calculado sobre o teto)
 */
export const INSS_MAX_CONTRIBUTION_2025 = 951.63; // Valor máximo de desconto em 2025
export const INSS_MAX_SALARY_2025 = 8157.41; // Teto salarial para contribuição

/**
 * Calcula o INSS descontado do funcionário baseado na tabela progressiva
 * Para salários >= R$ 4.190,84, aplica 14% sobre o salário total (sem teto)
 * Para salários abaixo de R$ 4.190,84, usa a fórmula progressiva: INSS = (Salário × Alíquota da Faixa) - Parcela a Deduzir
 * Fonte: Portaria Interministerial MPS/MF nº 6, de 13 de janeiro de 2025
 * @param salary Salário bruto do funcionário
 * @returns Valor do INSS a ser descontado
 */
export function calculateEmployeeINSS(salary: number): number {
  if (salary <= 0) return 0;

  // Para salários >= R$ 4.190,84, aplicar 14% sobre o salário total
  if (salary >= 4190.84) {
    const contribution = (salary * 14) / 100;
    return Math.round(contribution * 100) / 100; // Arredonda para 2 casas decimais
  }

  // Para salários abaixo de R$ 4.190,84, usa a fórmula progressiva
  for (const bracket of INSS_TABLE_2025) {
    if (salary >= bracket.min && salary <= bracket.max) {
      // Fórmula: (salário × alíquota) - parcela a deduzir
      const contribution = (salary * bracket.rate) / 100 - bracket.deduction;
      return Math.max(0, Math.round(contribution * 100) / 100); // Garante que não seja negativo e arredonda para 2 casas
    }
  }

  return 0;
}

/**
 * Retorna a alíquota da faixa (7,5, 9, 12 ou 14) usada no cálculo do INSS do funcionário.
 * @param salary Salário bruto do funcionário
 * @returns Alíquota em percentual (ex.: 9) ou 0 se salário <= 0
 */
export function getEmployeeINSSBracketRate(salary: number): number {
  if (salary <= 0) return 0;
  if (salary >= 4190.84) return 14;
  for (const bracket of INSS_TABLE_2025) {
    if (salary >= bracket.min && salary <= bracket.max) return bracket.rate;
  }
  return 0;
}

/**
 * Calcula o INSS patronal (fixo em 20%)
 * @param salary Salário bruto do funcionário
 * @returns Valor do INSS patronal
 */
export function calculateEmployerINSS(salary: number): number {
  if (salary <= 0) return 0;
  return (salary * 20) / 100;
}

/**
 * Calcula o FGTS (fixo em 8%)
 * @param salary Salário bruto do funcionário
 * @returns Valor do FGTS
 */
export function calculateFGTS(salary: number): number {
  if (salary <= 0) return 0;
  return (salary * 8) / 100;
}
