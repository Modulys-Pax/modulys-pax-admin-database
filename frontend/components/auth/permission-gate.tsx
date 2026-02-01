'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/lib/contexts/permission-context';

interface PermissionGateProps {
  /**
   * Permissão requerida para mostrar o conteúdo
   */
  permission?: string;

  /**
   * Lista de permissões - usuário precisa ter TODAS
   */
  permissions?: string[];

  /**
   * Lista de permissões - usuário precisa ter PELO MENOS UMA
   */
  anyPermission?: string[];

  /**
   * Módulo - usuário precisa ter qualquer permissão do módulo
   */
  module?: string;

  /**
   * Conteúdo a ser mostrado se o usuário tiver permissão
   */
  children: ReactNode;

  /**
   * Conteúdo alternativo se o usuário NÃO tiver permissão
   * Se não fornecido, não renderiza nada
   */
  fallback?: ReactNode;
}

/**
 * Componente para controlar visibilidade baseada em permissões.
 * 
 * Uso:
 * 
 * ```tsx
 * // Permissão única
 * <PermissionGate permission="vehicles.create">
 *   <Button>Novo Veículo</Button>
 * </PermissionGate>
 * 
 * // Múltiplas permissões (precisa ter TODAS)
 * <PermissionGate permissions={['vehicles.view', 'vehicles.update']}>
 *   <EditButton />
 * </PermissionGate>
 * 
 * // Pelo menos uma permissão
 * <PermissionGate anyPermission={['vehicles.delete', 'vehicles.update']}>
 *   <ActionMenu />
 * </PermissionGate>
 * 
 * // Acesso ao módulo
 * <PermissionGate module="vehicles">
 *   <VehiclesSection />
 * </PermissionGate>
 * 
 * // Com fallback
 * <PermissionGate permission="vehicles.create" fallback={<span>Sem permissão</span>}>
 *   <Button>Novo Veículo</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  permissions,
  anyPermission,
  module,
  children,
  fallback = null,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    canAccessModule,
  } = usePermissions();

  let hasAccess = true;

  // Verificar permissão única
  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }

  // Verificar múltiplas permissões (todas)
  if (permissions && permissions.length > 0) {
    hasAccess = hasAccess && hasAllPermissions(permissions);
  }

  // Verificar múltiplas permissões (pelo menos uma)
  if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAccess && hasAnyPermission(anyPermission);
  }

  // Verificar acesso ao módulo
  if (module) {
    hasAccess = hasAccess && canAccessModule(module);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Alias para PermissionGate com nome mais curto
 */
export const Can = PermissionGate;
