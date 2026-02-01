import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyInput } from '../currency-input';

// Mock do hook useCurrencyInput
jest.mock('@/lib/hooks/use-currency-input', () => ({
  useCurrencyInput: jest.fn(({ initialValue, onChange, onBlur }) => {
    const [value, setValue] = React.useState(initialValue);
    const [displayValue, setDisplayValue] = React.useState(
      initialValue ? `${initialValue}` : ''
    );

    return {
      displayValue,
      numericValue: value,
      inputProps: {
        value: displayValue,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value.replace(/\D/g, '');
          const num = val ? parseFloat(val) / 100 : undefined;
          setValue(num);
          setDisplayValue(val ? `${num?.toFixed(2)}` : '');
          onChange?.(num);
        },
        onBlur: () => {
          onBlur?.(value);
        },
      },
      setValue: (newVal: number | undefined) => {
        setValue(newVal);
        setDisplayValue(newVal !== undefined ? `${newVal.toFixed(2)}` : '');
      },
    };
  }),
}));

describe('CurrencyInput', () => {
  it('deve renderizar o componente', () => {
    render(<CurrencyInput data-testid="currency-input" />);

    expect(screen.getByTestId('currency-input')).toBeInTheDocument();
  });

  it('deve exibir o prefixo R$', () => {
    render(<CurrencyInput />);

    expect(screen.getByText('R$')).toBeInTheDocument();
  });

  it('deve aceitar valor inicial', () => {
    render(<CurrencyInput value={100} data-testid="currency-input" />);

    const input = screen.getByTestId('currency-input');
    expect(input).toBeInTheDocument();
  });

  it('deve chamar onChange quando valor muda', () => {
    const handleChange = jest.fn();
    render(
      <CurrencyInput onChange={handleChange} data-testid="currency-input" />
    );

    const input = screen.getByTestId('currency-input');
    fireEvent.change(input, { target: { value: '10000' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('deve chamar onBlur quando perde foco', () => {
    const handleBlur = jest.fn();
    render(<CurrencyInput onBlur={handleBlur} data-testid="currency-input" />);

    const input = screen.getByTestId('currency-input');
    fireEvent.blur(input);

    expect(handleBlur).toHaveBeenCalled();
  });

  it('deve aplicar classe de erro quando error=true', () => {
    render(<CurrencyInput error data-testid="currency-input" />);

    const input = screen.getByTestId('currency-input');
    expect(input).toHaveClass('border-destructive');
  });

  it('deve aceitar className customizada', () => {
    render(
      <CurrencyInput className="custom-class" data-testid="currency-input" />
    );

    const input = screen.getByTestId('currency-input');
    expect(input).toHaveClass('custom-class');
  });

  it('deve estar desabilitado quando disabled=true', () => {
    render(<CurrencyInput disabled data-testid="currency-input" />);

    const input = screen.getByTestId('currency-input');
    expect(input).toBeDisabled();
  });

  it('deve aceitar placeholder', () => {
    render(
      <CurrencyInput placeholder="Digite o valor" data-testid="currency-input" />
    );

    const input = screen.getByTestId('currency-input');
    expect(input).toHaveAttribute('placeholder', 'Digite o valor');
  });
});
