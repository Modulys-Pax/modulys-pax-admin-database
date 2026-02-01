/**
 * Utilitário para calcular dias úteis do mês
 * Considera: segunda a sexta (ou segunda a domingo se includeWeekends = true)
 * Exclui: feriados (pode ser expandido para buscar de uma tabela)
 */

export interface WorkingDaysOptions {
  year: number;
  month: number; // 1-12
  includeWeekends?: boolean; // Se true, conta sábados e domingos
  holidays?: Date[]; // Lista de feriados a excluir
}

/**
 * Calcula o número de dias úteis em um mês
 */
export function getWorkingDaysInMonth(options: WorkingDaysOptions): number {
  const { year, month, includeWeekends = false, holidays = [] } = options;

  // Criar data do primeiro dia do mês
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // Último dia do mês

  let workingDays = 0;

  // Iterar por todos os dias do mês
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(year, month - 1, day);
    const dayOfWeek = currentDate.getDay(); // 0 = domingo, 6 = sábado

    // Verificar se é feriado
    const isHoliday = holidays.some(
      (holiday) =>
        holiday.getFullYear() === year &&
        holiday.getMonth() === month - 1 &&
        holiday.getDate() === day,
    );

    if (isHoliday) {
      continue; // Pular feriados
    }

    // Verificar se é dia útil
    if (includeWeekends) {
      // Contar todos os dias exceto feriados
      workingDays++;
    } else {
      // Contar apenas segunda a sexta (1-5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
    }
  }

  return workingDays;
}

/**
 * Calcula dias úteis para o mês atual
 */
export function getCurrentMonthWorkingDays(includeWeekends = false, holidays: Date[] = []): number {
  const now = new Date();
  return getWorkingDaysInMonth({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    includeWeekends,
    holidays,
  });
}

/**
 * Calcula dias úteis para um mês específico
 */
export function getMonthWorkingDays(
  date: Date,
  includeWeekends = false,
  holidays: Date[] = [],
): number {
  return getWorkingDaysInMonth({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    includeWeekends,
    holidays,
  });
}
