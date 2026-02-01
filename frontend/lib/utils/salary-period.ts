/**
 * Utilitário para cálculo de período permitido para salários.
 * Regra: Somente mês atual ou 1 mês no passado. Meses futuros não são permitidos.
 */

export interface AllowedPeriod {
  month: number;
  year: number;
  label: string;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Retorna os períodos (mês/ano) permitidos para criar ou apurar salários.
 * Regra: Mês atual + 1 mês anterior.
 */
export function getAllowedSalaryPeriods(): AllowedPeriod[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  const periods: AllowedPeriod[] = [];

  // Mês atual + 1 mês anterior (total de 2 períodos)
  for (let i = 0; i < 2; i++) {
    let month = currentMonth - i;
    let year = currentYear;

    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    periods.push({
      month,
      year,
      label: `${MONTH_NAMES[month - 1]}/${year}`,
    });
  }

  return periods;
}

/**
 * Verifica se um mês/ano está dentro do período permitido.
 */
export function isValidSalaryPeriod(month: number, year: number): boolean {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentTotalMonths = currentYear * 12 + currentMonth;
  const referenceTotalMonths = year * 12 + month;
  const monthsDiff = currentTotalMonths - referenceTotalMonths;

  // Não permite futuro nem mais de 1 mês no passado
  return monthsDiff >= 0 && monthsDiff <= 1;
}

/**
 * Retorna opções de mês filtradas com base no ano selecionado.
 */
export function getFilteredMonthOptions(selectedYear: number): { value: string; label: string }[] {
  const allowedPeriods = getAllowedSalaryPeriods();
  
  return allowedPeriods
    .filter((p) => p.year === selectedYear)
    .map((p) => ({
      value: p.month.toString(),
      label: MONTH_NAMES[p.month - 1],
    }));
}

/**
 * Retorna opções de ano disponíveis (anos que possuem pelo menos um mês permitido).
 */
export function getFilteredYearOptions(): { value: string; label: string }[] {
  const allowedPeriods = getAllowedSalaryPeriods();
  const years = [...new Set(allowedPeriods.map((p) => p.year))];

  return years.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));
}
