import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { toSelectOptions, useSearchableSelect } from '../use-searchable-select';

describe('use-searchable-select', () => {
  describe('useSearchableSelect', () => {
    it('deve retornar value, onChange e error do controller', () => {
      const { result: formResult } = renderHook(() => 
        useForm<{ field: string }>({
          defaultValues: { field: 'test-value' },
        })
      );

      const { result } = renderHook(() =>
        useSearchableSelect(formResult.current.control, 'field')
      );

      expect(result.current.value).toBe('test-value');
      expect(result.current.onChange).toBeDefined();
      expect(result.current.error).toBe(false);
    });

    it('deve retornar string vazia quando value é undefined', () => {
      const { result: formResult } = renderHook(() => 
        useForm<{ field: string }>()
      );

      const { result } = renderHook(() =>
        useSearchableSelect(formResult.current.control, 'field')
      );

      expect(result.current.value).toBe('');
    });

    it('deve propagar erro do field', () => {
      const { result: formResult } = renderHook(() => 
        useForm<{ field: string }>({
          defaultValues: { field: '' },
        })
      );

      // Set error manually
      formResult.current.setError('field', { type: 'required', message: 'Required' });

      const { result } = renderHook(() =>
        useSearchableSelect(formResult.current.control, 'field')
      );

      expect(result.current.error).toBe(true);
    });
  });

  describe('toSelectOptions', () => {
    interface TestItem {
      id: string;
      name: string;
      active: boolean;
    }

    const testItems: TestItem[] = [
      { id: '1', name: 'Item 1', active: true },
      { id: '2', name: 'Item 2', active: false },
      { id: '3', name: 'Item 3', active: true },
    ];

    it('deve converter array de objetos em opções', () => {
      const options = toSelectOptions(
        testItems,
        (item) => item.id,
        (item) => item.name
      );

      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({
        value: '1',
        label: 'Item 1',
        disabled: false,
      });
    });

    it('deve aplicar função getDisabled corretamente', () => {
      const options = toSelectOptions(
        testItems,
        (item) => item.id,
        (item) => item.name,
        (item) => !item.active
      );

      expect(options[0].disabled).toBe(false); // active: true
      expect(options[1].disabled).toBe(true);  // active: false
      expect(options[2].disabled).toBe(false); // active: true
    });

    it('deve retornar array vazio para array vazio', () => {
      const options = toSelectOptions(
        [],
        (item: TestItem) => item.id,
        (item: TestItem) => item.name
      );

      expect(options).toEqual([]);
    });

    it('deve preservar ordem dos itens', () => {
      const items = [
        { id: 'c', name: 'C' },
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ];

      const options = toSelectOptions(
        items,
        (item) => item.id,
        (item) => item.name
      );

      expect(options[0].value).toBe('c');
      expect(options[1].value).toBe('a');
      expect(options[2].value).toBe('b');
    });

    it('deve funcionar com tipos diferentes', () => {
      const employees = [
        { cpf: '12345678900', fullName: 'João Silva' },
        { cpf: '98765432100', fullName: 'Maria Santos' },
      ];

      const options = toSelectOptions(
        employees,
        (e) => e.cpf,
        (e) => e.fullName
      );

      expect(options).toEqual([
        { value: '12345678900', label: 'João Silva', disabled: false },
        { value: '98765432100', label: 'Maria Santos', disabled: false },
      ]);
    });
  });
});
