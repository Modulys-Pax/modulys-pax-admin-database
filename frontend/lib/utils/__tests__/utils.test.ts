import { cn } from '../../utils';

describe('cn (classnames utility)', () => {
  it('deve combinar múltiplas classes', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('deve filtrar valores falsy', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    expect(cn('class1', undefined, 'class3')).toBe('class1 class3');
    expect(cn('class1', null, 'class3')).toBe('class1 class3');
  });

  it('deve lidar com arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('deve lidar com objetos condicionais', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
  });

  it('deve fazer merge de classes Tailwind conflitantes', () => {
    // tw-merge resolve conflitos (última vence)
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('deve retornar string vazia para input vazio', () => {
    expect(cn()).toBe('');
  });

  it('deve lidar com mix de tipos', () => {
    const result = cn(
      'base-class',
      { conditional: true },
      ['array-class'],
      undefined,
      'final-class'
    );
    expect(result).toBe('base-class conditional array-class final-class');
  });
});
