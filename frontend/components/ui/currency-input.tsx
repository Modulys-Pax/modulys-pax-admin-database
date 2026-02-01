'use client';

import React from 'react';
import { Input } from './input';
import { useCurrencyInput } from '@/lib/hooks/use-currency-input';
import { roundCurrency } from '@/lib/utils/numbers';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
  onBlur?: (value: number | undefined) => void;
  error?: boolean;
}

/**
 * Componente de input com máscara de moeda brasileira (R$)
 * Formata automaticamente enquanto o usuário digita
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, error, className, ...props }, ref) => {
    const { displayValue, inputProps, setValue } = useCurrencyInput({
      initialValue: value,
      onChange,
      onBlur,
    });

    // Sincronizar com value externo (arredondado a 2 decimais)
    React.useEffect(() => {
      if (value !== undefined && value !== null && value !== '') {
        const num = roundCurrency(typeof value === 'string' ? parseFloat(value) : value);
        if (!isNaN(num) && num > 0) {
          setValue(num);
        } else if (num === 0 || isNaN(num)) {
          setValue(undefined);
        }
      } else {
        setValue(undefined);
      }
    }, [value, setValue]);

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          R$
        </span>
        <Input
          ref={ref}
          {...props}
          {...inputProps}
          className={cn(
            'pl-9 rounded-xl',
            error && 'border-destructive',
            className
          )}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
