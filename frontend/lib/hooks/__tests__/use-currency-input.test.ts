import { renderHook, act } from '@testing-library/react';
import { useCurrencyInput } from '../use-currency-input';

describe('useCurrencyInput', () => {
  describe('inicialização', () => {
    it('deve inicializar com valor vazio', () => {
      const { result } = renderHook(() => useCurrencyInput());
      
      expect(result.current.displayValue).toBe('');
      expect(result.current.numericValue).toBeUndefined();
    });

    it('deve inicializar com valor numérico', () => {
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: 1234.56 })
      );
      
      expect(result.current.numericValue).toBe(1234.56);
      expect(result.current.displayValue).toBe('1.234,56');
    });

    it('deve inicializar com string numérica', () => {
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: '100.50' })
      );
      
      expect(result.current.numericValue).toBe(100.5);
    });

    it('deve tratar valor zero', () => {
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: 0 })
      );
      
      // Zero é arredondado mas displayValue fica vazio pois formatCurrencyValue retorna '' para 0
      expect(result.current.displayValue).toBe('');
      expect(result.current.numericValue).toBe(0);
    });
  });

  describe('handleChange', () => {
    it('deve formatar valor ao digitar', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => useCurrencyInput({ onChange }));

      act(() => {
        result.current.inputProps.onChange({
          target: { value: '12345' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe('123,45');
      expect(result.current.numericValue).toBe(123.45);
      expect(onChange).toHaveBeenCalledWith(123.45);
    });

    it('deve limpar campo quando valor for vazio', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: 100, onChange })
      );

      act(() => {
        result.current.inputProps.onChange({
          target: { value: '' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe('');
      expect(result.current.numericValue).toBeUndefined();
      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('deve ignorar caracteres não numéricos', () => {
      const { result } = renderHook(() => useCurrencyInput());

      act(() => {
        result.current.inputProps.onChange({
          target: { value: 'abc123def456' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe('1.234,56');
      expect(result.current.numericValue).toBe(1234.56);
    });

    it('deve lidar com centavos', () => {
      const { result } = renderHook(() => useCurrencyInput());

      act(() => {
        result.current.inputProps.onChange({
          target: { value: '50' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe('0,50');
      expect(result.current.numericValue).toBe(0.5);
    });
  });

  describe('handleBlur', () => {
    it('deve chamar onBlur com valor numérico', () => {
      const onBlur = jest.fn();
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: 100, onBlur })
      );

      act(() => {
        result.current.inputProps.onBlur({} as React.FocusEvent<HTMLInputElement>);
      });

      expect(onBlur).toHaveBeenCalledWith(100);
    });

    it('deve formatar valor ao perder foco', () => {
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: 1000 })
      );

      act(() => {
        result.current.inputProps.onBlur({} as React.FocusEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe('1.000,00');
    });
  });

  describe('setValue', () => {
    it('deve atualizar valor programaticamente', () => {
      const { result } = renderHook(() => useCurrencyInput());

      act(() => {
        result.current.setValue(500.25);
      });

      expect(result.current.numericValue).toBe(500.25);
      expect(result.current.displayValue).toBe('500,25');
    });

    it('deve limpar valor quando undefined', () => {
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: 100 })
      );

      act(() => {
        result.current.setValue(undefined);
      });

      expect(result.current.numericValue).toBeUndefined();
      expect(result.current.displayValue).toBe('');
    });

    it('deve limpar valor quando NaN', () => {
      const { result } = renderHook(() =>
        useCurrencyInput({ initialValue: 100 })
      );

      act(() => {
        result.current.setValue(NaN);
      });

      expect(result.current.numericValue).toBeUndefined();
      expect(result.current.displayValue).toBe('');
    });
  });

  describe('inputProps', () => {
    it('deve ter placeholder padrão', () => {
      const { result } = renderHook(() => useCurrencyInput());
      
      expect(result.current.inputProps.placeholder).toBe('0,00');
    });

    it('deve ter inputMode decimal', () => {
      const { result } = renderHook(() => useCurrencyInput());
      
      expect(result.current.inputProps.inputMode).toBe('decimal');
    });
  });

  describe('handleKeyDown', () => {
    it('deve permitir números', () => {
      const { result } = renderHook(() => useCurrencyInput());
      const preventDefault = jest.fn();

      act(() => {
        result.current.inputProps.onKeyDown({
          key: '5',
          preventDefault,
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('deve permitir teclas de navegação', () => {
      const { result } = renderHook(() => useCurrencyInput());
      const preventDefault = jest.fn();

      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      
      allowedKeys.forEach((key) => {
        act(() => {
          result.current.inputProps.onKeyDown({
            key,
            preventDefault,
          } as unknown as React.KeyboardEvent<HTMLInputElement>);
        });
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('deve permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X', () => {
      const { result } = renderHook(() => useCurrencyInput());
      const preventDefault = jest.fn();

      ['a', 'c', 'v', 'x'].forEach((key) => {
        act(() => {
          result.current.inputProps.onKeyDown({
            key,
            ctrlKey: true,
            preventDefault,
          } as unknown as React.KeyboardEvent<HTMLInputElement>);
        });
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('deve permitir Cmd+A em Mac', () => {
      const { result } = renderHook(() => useCurrencyInput());
      const preventDefault = jest.fn();

      act(() => {
        result.current.inputProps.onKeyDown({
          key: 'a',
          metaKey: true,
          preventDefault,
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      expect(preventDefault).not.toHaveBeenCalled();
    });

    it('deve bloquear letras', () => {
      const { result } = renderHook(() => useCurrencyInput());
      const preventDefault = jest.fn();

      act(() => {
        result.current.inputProps.onKeyDown({
          key: 'a',
          ctrlKey: false,
          metaKey: false,
          preventDefault,
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      expect(preventDefault).toHaveBeenCalled();
    });

    it('deve bloquear caracteres especiais', () => {
      const { result } = renderHook(() => useCurrencyInput());
      const preventDefault = jest.fn();

      act(() => {
        result.current.inputProps.onKeyDown({
          key: '@',
          ctrlKey: false,
          metaKey: false,
          preventDefault,
        } as unknown as React.KeyboardEvent<HTMLInputElement>);
      });

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('handleChange edge cases', () => {
    it('deve limpar quando valor contém apenas espaços', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => useCurrencyInput({ onChange }));

      act(() => {
        result.current.inputProps.onChange({
          target: { value: '   ' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe('');
      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    it('deve limpar quando valor contém apenas caracteres não numéricos', () => {
      const onChange = jest.fn();
      const { result } = renderHook(() => useCurrencyInput({ onChange }));

      act(() => {
        result.current.inputProps.onChange({
          target: { value: 'abc' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.displayValue).toBe('');
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('atualização de initialValue', () => {
    it('deve atualizar quando initialValue muda externamente', () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useCurrencyInput({ initialValue }),
        { initialProps: { initialValue: 100 } }
      );

      expect(result.current.numericValue).toBe(100);

      rerender({ initialValue: 200 });

      expect(result.current.numericValue).toBe(200);
      expect(result.current.displayValue).toBe('200,00');
    });

    it('deve limpar quando initialValue se torna undefined', () => {
      const { result, rerender } = renderHook(
        ({ initialValue }) => useCurrencyInput({ initialValue }),
        { initialProps: { initialValue: 100 as number | undefined } }
      );

      expect(result.current.numericValue).toBe(100);

      rerender({ initialValue: undefined });

      expect(result.current.numericValue).toBeUndefined();
      expect(result.current.displayValue).toBe('');
    });
  });
});
