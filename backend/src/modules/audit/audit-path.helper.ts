/**
 * Lógica pura de paths para auditoria. Usado pelo AuditInterceptor e por testes
 * de verificação de endpoints. Mantém shouldSkip, entityType e descrições
 * alinhados com os controllers.
 */

export function shouldSkip(path: string, method: string): boolean {
  if (method === 'POST' && path === '/audit') return true;
  if (method === 'POST' && path === '/auth/refresh') return true;
  return false;
}

export function isStateChangePath(path: string): boolean {
  const statePaths = ['/start', '/pause', '/complete', '/cancel', '/receive', '/pay'];
  return statePaths.some((s) => path.endsWith(s));
}

export function getEntityType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const entitySegment = segments[0] ?? 'Unknown';
  const base = entitySegment.charAt(0).toUpperCase() + entitySegment.slice(1).replace(/s$/, '');
  if (entitySegment === 'accounts-receivable') return 'AccountReceivable';
  if (entitySegment === 'accounts-payable') return 'AccountPayable';
  if (entitySegment === 'financial-transactions') return 'FinancialTransaction';
  if (entitySegment === 'units-of-measurement') return 'UnitOfMeasurement';
  if (entitySegment === 'vehicle-brands') return 'VehicleBrand';
  if (entitySegment === 'vehicle-models') return 'VehicleModel';
  if (entitySegment === 'employees' && segments[1] === 'benefits') return 'EmployeeBenefit';
  if (entitySegment === 'stock' && segments[1] === 'warehouses') return 'Warehouse';
  if (entitySegment === 'stock' && segments[1] === 'movements') return 'StockMovement';
  if (entitySegment === 'companies') return 'Company';
  if (entitySegment === 'branches') return 'Branch';
  if (entitySegment === 'salaries') return 'Salary';
  return base;
}

export function getSubRouteDescription(path: string): string | null {
  if (path.endsWith('/start')) return 'Ordem de manutenção iniciada';
  if (path.endsWith('/pause')) return 'Ordem de manutenção pausada';
  if (path.endsWith('/complete')) return 'Ordem de manutenção concluída';
  if (path.includes('/maintenance/') && path.endsWith('/cancel'))
    return 'Ordem de manutenção cancelada';
  if (path.includes('/accounts-receivable/') && path.endsWith('/cancel'))
    return 'Conta a receber cancelada';
  if (path.includes('/accounts-payable/') && path.endsWith('/cancel'))
    return 'Conta a pagar cancelada';
  if (path.endsWith('/receive')) return 'Conta a receber recebida';
  if (path.includes('/salaries/') && path.endsWith('/pay')) return 'Salário pago';
  if (path.includes('/accounts-payable/') && path.endsWith('/pay')) return 'Conta a pagar paga';
  return null;
}

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN';

export function getActionFromMethodAndPath(method: string, path: string): AuditActionType {
  if (['PATCH', 'PUT'].includes(method)) return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  if (isStateChangePath(path)) return 'UPDATE';
  return 'CREATE';
}

/** Indica se o path+method devem ser auditados pelo interceptor (não skip, não GET). */
export function shouldAuditByInterceptor(method: string, path: string): boolean {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) return false;
  if (shouldSkip(path, method)) return false;
  return true;
}
