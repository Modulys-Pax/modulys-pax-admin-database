import { roundCurrency } from './numbers';

/**
 * Utilitários para formatação e manipulação de valores monetários (R$)
 */

/**
 * Remove formatação de moeda e retorna apenas números (arredondado a 2 decimais).
 * Ex: "R$ 1.234,56" -> 1234.56
 */
export function unformatCurrency(value: string): number {
  if (!value) return 0;

  // Remove tudo exceto números e vírgula/ponto
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '') // Remove pontos (separadores de milhar)
    .replace(',', '.'); // Converte vírgula em ponto decimal

  const num = parseFloat(cleaned) || 0;
  return isNaN(num) ? 0 : roundCurrency(num);
}

/**
 * Formata número para moeda brasileira
 * Ex: 1234.56 -> "R$ 1.234,56"
 * @param value - Valor a ser formatado
 * @param showZero - Se true, mostra "R$ 0,00" para valores zero (default: true)
 */
export function formatCurrency(
  value: number | string | undefined | null,
  showZero: boolean = true
): string {
  if (value === undefined || value === null || value === '') {
    return showZero ? 'R$ 0,00' : '';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return showZero ? 'R$ 0,00' : '';
  }

  if (num === 0 && !showZero) {
    return '';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundCurrency(num));
}

/**
 * Formata valor enquanto o usuário digita (sem símbolo R$)
 * Ex: 1234.56 -> "1.234,56"
 */
export function formatCurrencyInput(value: string): string {
  if (!value) return '';
  
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número e divide por 100 para ter centavos; arredonda para evitar float
  const num = roundCurrency(parseInt(numbers, 10) / 100);

  // Formata com separadores brasileiros
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata valor para exibição em input (com R$)
 * Ex: 1234.56 -> "R$ 1.234,56"
 */
export function formatCurrencyForInput(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';

  const num = roundCurrency(typeof value === 'string' ? parseFloat(value) : value);
  if (isNaN(num) || num === 0) return '';

  return formatCurrency(num);
}
