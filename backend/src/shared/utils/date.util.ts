/**
 * Utilitários para manipulação de datas consistente em todo o sistema
 */

/**
 * Ajusta uma data de fim de período para incluir o dia inteiro
 * Define a hora para 23:59:59.999
 *
 * @param date - Data a ser ajustada
 * @returns Nova data com hora ajustada para fim do dia
 *
 * @example
 * const endDate = toEndOfDay(new Date('2024-01-15'));
 * // 2024-01-15T23:59:59.999Z
 */
export function toEndOfDay(date: Date): Date {
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  return endDate;
}

/**
 * Ajusta uma data de início de período para o início do dia
 * Define a hora para 00:00:00.000
 *
 * @param date - Data a ser ajustada
 * @returns Nova data com hora ajustada para início do dia
 */
export function toStartOfDay(date: Date): Date {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

/**
 * Cria um filtro de data para queries Prisma
 *
 * @param startDate - Data de início (opcional)
 * @param endDate - Data de fim (opcional)
 * @param fieldName - Nome do campo de data (default: 'createdAt')
 * @returns Objeto de filtro para Prisma ou undefined
 */
export function createDateFilter(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
  fieldName: string = 'createdAt',
): Record<string, { gte?: Date; lte?: Date }> | undefined {
  if (!startDate && !endDate) {
    return undefined;
  }

  const filter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    filter.gte = toStartOfDay(new Date(startDate));
  }

  if (endDate) {
    filter.lte = toEndOfDay(new Date(endDate));
  }

  return { [fieldName]: filter };
}

/**
 * Obtém o primeiro dia do mês
 *
 * @param year - Ano
 * @param month - Mês (1-12)
 * @returns Data do primeiro dia do mês
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

/**
 * Obtém o último dia do mês
 *
 * @param year - Ano
 * @param month - Mês (1-12)
 * @returns Data do último dia do mês (23:59:59.999)
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  const lastDay = new Date(year, month, 0);
  return toEndOfDay(lastDay);
}

/**
 * Verifica se duas datas estão no mesmo mês e ano
 *
 * @param date1 - Primeira data
 * @param date2 - Segunda data
 * @returns true se estiverem no mesmo mês e ano
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

/**
 * Formata data para ISO string (YYYY-MM-DD)
 *
 * @param date - Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
