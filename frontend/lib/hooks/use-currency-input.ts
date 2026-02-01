import { useState, useCallback, useEffect } from 'react';
import { roundCurrency } from '@/lib/utils/numbers';

interface UseCurrencyInputOptions {
  initialValue?: number | string;
  onChange?: (value: number | undefined) => void;
  onBlur?: (value: number | undefined) => void;
}

/**
 * Hook para gerenciar input de moeda com formatação automática.
 * Valores numéricos são arredondados a 2 decimais para evitar perda por ponto flutuante.
 */
export function useCurrencyInput(options: UseCurrencyInputOptions = {}) {
  const { initialValue, onChange, onBlur } = options;

  const [displayValue, setDisplayValue] = useState<string>('');
  const [numericValue, setNumericValue] = useState<number | undefined>(
    initialValue !== undefined && initialValue !== null && initialValue !== ''
      ? roundCurrency(typeof initialValue === 'string' ? parseFloat(initialValue) : initialValue)
      : undefined
  );

  // Inicializar display quando initialValue mudar externamente
  useEffect(() => {
    if (initialValue !== undefined && initialValue !== null && initialValue !== '') {
      const num = roundCurrency(typeof initialValue === 'string' ? parseFloat(initialValue) : initialValue);
      if (!isNaN(num) && num > 0) {
        const formatted = formatCurrencyValue(num);
        // Só atualiza se o valor formatado for diferente do atual
        if (formatted !== displayValue) {
          setNumericValue(num);
          setDisplayValue(formatted);
        }
      }
    } else if ((initialValue === undefined || initialValue === null || initialValue === '') && displayValue !== '') {
      setDisplayValue('');
      setNumericValue(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const formatCurrencyValue = useCallback((value: number): string => {
    if (isNaN(value) || value === 0) return '';
    
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const parseInputValue = (value: string): number | undefined => {
    if (!value) return undefined;

    const numbers = value.replace(/\D/g, '');
    if (!numbers) return undefined;

    const num = roundCurrency(parseInt(numbers, 10) / 100);
    return isNaN(num) ? undefined : num;
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permite limpar o campo
    if (!inputValue || inputValue.trim() === '') {
      setDisplayValue('');
      setNumericValue(undefined);
      onChange?.(undefined);
      return;
    }
    
    // Remove caracteres não numéricos
    const numbers = inputValue.replace(/\D/g, '');
    
    if (!numbers) {
      setDisplayValue('');
      setNumericValue(undefined);
      onChange?.(undefined);
      return;
    }
    
    // Converte para número (centavos) e arredonda a 2 decimais para evitar float
    const num = roundCurrency(parseInt(numbers, 10) / 100);

    if (isNaN(num)) {
      setDisplayValue('');
      setNumericValue(undefined);
      onChange?.(undefined);
      return;
    }

    setDisplayValue(formatCurrencyValue(num));
    setNumericValue(num);
    onChange?.(num);
  }, [onChange, formatCurrencyValue]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Garante que sempre tenha 2 casas decimais ao perder o foco
    if (numericValue !== undefined) {
      const formatted = formatCurrencyValue(numericValue);
      setDisplayValue(formatted);
    }
    onBlur?.(numericValue);
  }, [numericValue, onBlur, formatCurrencyValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite navegação e edição
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];
    
    // Permite Ctrl/Cmd + A, C, V, X
    if (e.ctrlKey || e.metaKey) {
      if (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
    }
    
    // Permite números
    if (e.key >= '0' && e.key <= '9') {
      return;
    }
    
    // Bloqueia outras teclas
    if (!allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  }, []);

  return {
    displayValue,
    numericValue,
    inputProps: {
      value: displayValue,
      onChange: handleChange,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      placeholder: '0,00',
      inputMode: 'decimal' as const,
    },
    setValue: (value: number | undefined) => {
      if (value === undefined || value === null || isNaN(value)) {
        setDisplayValue('');
        setNumericValue(undefined);
      } else {
        const rounded = roundCurrency(value);
        setNumericValue(rounded);
        setDisplayValue(formatCurrencyValue(rounded));
      }
    },
  };
}
