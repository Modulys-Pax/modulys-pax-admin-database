/**
 * Utilitário centralizado para manipulação de datas
 * Timezone padrão: America/Sao_Paulo (Brasil)
 */

// Timezone padrão do sistema
export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// Locale padrão
export const DEFAULT_LOCALE = 'pt-BR';

/**
 * Converte uma string de data para Date sem problema de timezone
 * Adiciona T12:00:00 para evitar que a conversão UTC cause diferença de 1 dia
 */
export function parseDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;

  if (dateString instanceof Date) {
    return dateString;
  }

  // Remove a parte do tempo se existir e adiciona meio-dia
  const dateOnly = dateString.split('T')[0];
  return new Date(dateOnly + 'T12:00:00');
}

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const parsedDate = parseDate(date);
  if (!parsedDate || isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
  });
}

/**
 * Formata uma data com hora (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  // Para datetime, usamos a data original sem ajuste
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata uma data por extenso (Ex: 15 de janeiro de 2024)
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const parsedDate = parseDate(date);
  if (!parsedDate || isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formata uma data curta (DD/MM)
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const parsedDate = parseDate(date);
  if (!parsedDate || isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Formata mês e ano (Janeiro/2024)
 */
export function formatMonthYear(date: string | Date | null | undefined): string {
  if (!date) return '-';

  const parsedDate = parseDate(date);
  if (!parsedDate || isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Converte uma data para string no formato ISO (YYYY-MM-DD) para inputs
 */
export function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return '';

  const parsedDate = parseDate(date);
  if (!parsedDate || isNaN(parsedDate.getTime())) return '';

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  const now = new Date();
  return toInputDate(now);
}

/**
 * Calcula a diferença em dias entre duas datas
 */
export function diffInDays(
  startDate: string | Date,
  endDate: string | Date
): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return 0;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma data é válida
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  const parsedDate = parseDate(date);
  return parsedDate !== null && !isNaN(parsedDate.getTime());
}

/**
 * Array com nomes dos meses em português
 */
export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Retorna o nome do mês (1-12)
 */
export function getMonthName(month: number): string {
  if (month < 1 || month > 12) return '';
  return MONTH_NAMES[month - 1];
}
