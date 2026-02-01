/**
 * Arredondamento seguro para valores decimais (evitar perda de precisão por float no JSON).
 * Usar ao receber números do request e ao persistir em campos Decimal.
 */

/**
 * Arredonda um número para `decimals` casas decimais.
 */
export function roundDecimal(value: number | string | null | undefined, decimals: number): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(num)) return 0;
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}

/** Arredonda para 2 casas (moeda/custo). */
export function roundCurrency(value: number | string | null | undefined): number {
  return roundDecimal(value, 2);
}

/** Arredonda para 4 casas (quantidade). */
export function roundQuantity(value: number | string | null | undefined): number {
  return roundDecimal(value, 4);
}
