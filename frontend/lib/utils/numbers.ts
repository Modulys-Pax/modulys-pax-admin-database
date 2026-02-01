/**
 * Arredondamento seguro para evitar perda de precisão por ponto flutuante.
 * Ex.: 10.1 + 20.2 em JS vira 30.299999999999997; roundDecimal(30.299999999999997, 2) = 30.30
 */

/**
 * Arredonda um número para `decimals` casas decimais.
 * Valores null/undefined/NaN retornam 0.
 */
export function roundDecimal(
  value: number | string | null | undefined,
  decimals: number,
): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return 0;
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}

/** Arredonda para 2 casas (moeda). */
export function roundCurrency(value: number | string | null | undefined): number {
  return roundDecimal(value, 2);
}

/** Arredonda para 4 casas (quantidade). */
export function roundQuantity(value: number | string | null | undefined): number {
  return roundDecimal(value, 4);
}

/** Arredonda para inteiro (ex.: KM). */
export function roundInteger(value: number | string | null | undefined): number {
  return Math.round(roundDecimal(value, 0));
}
