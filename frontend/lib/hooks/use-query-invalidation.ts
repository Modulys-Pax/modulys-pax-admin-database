import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook para invalidação de queries de forma consistente.
 * Garante que as queries sejam invalidadas e refetched imediatamente.
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalida e refetcha queries de forma consistente
   * @param queryKeys - Lista de query keys para invalidar
   */
  const invalidateAndRefetch = useCallback(
    async (queryKeys: string[][]) => {
      await Promise.all(
        queryKeys.map(async (queryKey) => {
          // Invalida todas as queries que começam com esta key
          await queryClient.invalidateQueries({
            queryKey,
            refetchType: 'all', // Força refetch de queries ativas e inativas
          });
        })
      );
    },
    [queryClient]
  );

  /**
   * Invalida queries relacionadas a uma entidade
   * Útil para invalidar listagens, métricas e detalhes de uma entidade
   * @param entity - Nome da entidade (ex: 'vehicles', 'products')
   */
  const invalidateEntity = useCallback(
    async (entity: string) => {
      await queryClient.invalidateQueries({
        queryKey: [entity],
        refetchType: 'all',
      });
      // Também invalida queries de métricas relacionadas
      await queryClient.invalidateQueries({
        queryKey: [`${entity}-metrics`],
        refetchType: 'all',
      });
    },
    [queryClient]
  );

  /**
   * Invalida múltiplas entidades de uma vez
   * @param entities - Lista de nomes de entidades
   */
  const invalidateMultiple = useCallback(
    async (entities: string[]) => {
      await Promise.all(entities.map((entity) => invalidateEntity(entity)));
    },
    [invalidateEntity]
  );

  return {
    invalidateAndRefetch,
    invalidateEntity,
    invalidateMultiple,
    queryClient,
  };
}

/**
 * Constantes de query keys para manter consistência
 */
export const QUERY_KEYS = {
  // Veículos
  vehicles: ['vehicles'],
  vehicleBrands: ['vehicle-brands'],
  vehicleModels: ['vehicle-models'],
  vehicleCosts: ['vehicle-costs'],
  
  // Funcionários
  employees: ['employees'],
  employeeCosts: ['employee-costs'],
  benefits: ['benefits'],
  
  // Estoque
  products: ['products'],
  stock: ['stock'],
  stockMovements: ['stockMovements'],
  
  // Manutenção
  maintenance: ['maintenance'],
  maintenanceLabels: ['maintenanceLabels'],
  maintenanceDue: ['maintenanceDue'],
  
  // Financeiro
  accountPayable: ['account-payable'],
  accountReceivable: ['account-receivable'],
  wallet: ['wallet'],
  payroll: ['payroll'],
  vacations: ['vacations'],
  expenses: ['expenses'],
  
  // Configurações
  branches: ['branches'],
  roles: ['roles'],
  users: ['users'],
  units: ['units-of-measurement'],
} as const;
