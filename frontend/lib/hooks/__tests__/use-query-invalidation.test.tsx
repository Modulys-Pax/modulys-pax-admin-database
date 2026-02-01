import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useQueryInvalidation, QUERY_KEYS } from '../use-query-invalidation';

describe('useQueryInvalidation', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    Wrapper.displayName = 'TestWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('invalidateAndRefetch', () => {
    it('deve invalidar múltiplas query keys', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateAndRefetch([['vehicles'], ['products']]);
      });

      expect(invalidateSpy).toHaveBeenCalledTimes(2);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['vehicles'],
        refetchType: 'all',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['products'],
        refetchType: 'all',
      });
    });

    it('deve funcionar com array vazio', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateAndRefetch([]);
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('deve invalidar query key única', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateAndRefetch([['employees']]);
      });

      expect(invalidateSpy).toHaveBeenCalledTimes(1);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['employees'],
        refetchType: 'all',
      });
    });
  });

  describe('invalidateEntity', () => {
    it('deve invalidar entidade e métricas relacionadas', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateEntity('vehicles');
      });

      expect(invalidateSpy).toHaveBeenCalledTimes(2);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['vehicles'],
        refetchType: 'all',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['vehicles-metrics'],
        refetchType: 'all',
      });
    });

    it('deve invalidar entidade de funcionários', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateEntity('employees');
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['employees'],
        refetchType: 'all',
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['employees-metrics'],
        refetchType: 'all',
      });
    });
  });

  describe('invalidateMultiple', () => {
    it('deve invalidar múltiplas entidades', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateMultiple(['vehicles', 'products', 'employees']);
      });

      // Cada entidade chama invalidate 2x (entity + metrics)
      expect(invalidateSpy).toHaveBeenCalledTimes(6);
    });

    it('deve funcionar com array vazio', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateMultiple([]);
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('deve invalidar entidade única', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.invalidateMultiple(['wallet']);
      });

      expect(invalidateSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('queryClient', () => {
    it('deve expor queryClient', () => {
      const { result } = renderHook(() => useQueryInvalidation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.queryClient).toBeDefined();
      expect(result.current.queryClient).toBe(queryClient);
    });
  });
});

describe('QUERY_KEYS', () => {
  it('deve conter todas as keys de veículos', () => {
    expect(QUERY_KEYS.vehicles).toEqual(['vehicles']);
    expect(QUERY_KEYS.vehicleBrands).toEqual(['vehicle-brands']);
    expect(QUERY_KEYS.vehicleModels).toEqual(['vehicle-models']);
    expect(QUERY_KEYS.vehicleCosts).toEqual(['vehicle-costs']);
  });

  it('deve conter todas as keys de funcionários', () => {
    expect(QUERY_KEYS.employees).toEqual(['employees']);
    expect(QUERY_KEYS.employeeCosts).toEqual(['employee-costs']);
    expect(QUERY_KEYS.benefits).toEqual(['benefits']);
  });

  it('deve conter todas as keys de estoque', () => {
    expect(QUERY_KEYS.products).toEqual(['products']);
    expect(QUERY_KEYS.stock).toEqual(['stock']);
    expect(QUERY_KEYS.stockMovements).toEqual(['stockMovements']);
  });

  it('deve conter todas as keys de manutenção', () => {
    expect(QUERY_KEYS.maintenance).toEqual(['maintenance']);
    expect(QUERY_KEYS.maintenanceLabels).toEqual(['maintenanceLabels']);
    expect(QUERY_KEYS.maintenanceDue).toEqual(['maintenanceDue']);
  });

  it('deve conter todas as keys financeiras', () => {
    expect(QUERY_KEYS.accountPayable).toEqual(['account-payable']);
    expect(QUERY_KEYS.accountReceivable).toEqual(['account-receivable']);
    expect(QUERY_KEYS.wallet).toEqual(['wallet']);
    expect(QUERY_KEYS.payroll).toEqual(['payroll']);
    expect(QUERY_KEYS.vacations).toEqual(['vacations']);
    expect(QUERY_KEYS.expenses).toEqual(['expenses']);
  });

  it('deve conter todas as keys de configurações', () => {
    expect(QUERY_KEYS.branches).toEqual(['branches']);
    expect(QUERY_KEYS.roles).toEqual(['roles']);
    expect(QUERY_KEYS.users).toEqual(['users']);
    expect(QUERY_KEYS.units).toEqual(['units-of-measurement']);
  });
});
