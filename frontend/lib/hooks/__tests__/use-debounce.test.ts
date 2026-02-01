import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve retornar valor inicial imediatamente', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('deve debounce mudanças de valor', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Mudar valor
    rerender({ value: 'updated' });
    
    // Ainda deve ser o valor inicial
    expect(result.current).toBe('initial');

    // Avançar o tempo
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Agora deve ter o novo valor
    expect(result.current).toBe('updated');
  });

  it('deve resetar timer em novas mudanças', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    // Primeira mudança
    rerender({ value: 'b' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Segunda mudança antes do timeout
    rerender({ value: 'c' });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Ainda deve ser 'a'
    expect(result.current).toBe('a');

    // Completar o segundo timer
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Agora deve ser 'c'
    expect(result.current).toBe('c');
  });

  it('deve funcionar com números', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 1 } }
    );

    rerender({ value: 42 });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it('deve funcionar com objetos', () => {
    const initialObj = { id: 1 };
    const newObj = { id: 2 };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: initialObj } }
    );

    rerender({ value: newObj });
    
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toEqual(newObj);
  });
});
