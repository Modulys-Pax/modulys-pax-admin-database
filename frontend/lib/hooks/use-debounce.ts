import { useState, useEffect } from 'react';

/**
 * Retorna um valor debounced: atualiza apenas após `delay` ms sem mudanças.
 * Útil para filtrar chamadas de API em inputs (ex.: data, busca).
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
