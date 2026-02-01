/**
 * Verificação de auditoria por endpoint.
 * Garante que shouldSkip, shouldAuditByInterceptor, getEntityType e getSubRouteDescription
 * estão corretos para todos os endpoints de mutação mapeados em docs/audit-endpoints-verification.md.
 */
import {
  shouldSkip,
  shouldAuditByInterceptor,
  getEntityType,
  getSubRouteDescription,
  getActionFromMethodAndPath,
} from './audit-path.helper';

describe('AuditPathHelper', () => {
  describe('shouldSkip', () => {
    it('skips POST /audit', () => {
      expect(shouldSkip('/audit', 'POST')).toBe(true);
    });
    it('skips POST /auth/refresh', () => {
      expect(shouldSkip('/auth/refresh', 'POST')).toBe(true);
    });
    it('does not skip POST /auth/login', () => {
      expect(shouldSkip('/auth/login', 'POST')).toBe(false);
    });
    it('does not skip POST /users', () => {
      expect(shouldSkip('/users', 'POST')).toBe(false);
    });
    it('does not skip PATCH /audit (method differs)', () => {
      expect(shouldSkip('/audit', 'PATCH')).toBe(false);
    });
  });

  describe('shouldAuditByInterceptor', () => {
    it('returns false for GET', () => {
      expect(shouldAuditByInterceptor('GET', '/users')).toBe(false);
      expect(shouldAuditByInterceptor('GET', '/reports/financial')).toBe(false);
    });
    it('returns false for POST /audit and POST /auth/refresh', () => {
      expect(shouldAuditByInterceptor('POST', '/audit')).toBe(false);
      expect(shouldAuditByInterceptor('POST', '/auth/refresh')).toBe(false);
    });
    it('returns true for POST /auth/login', () => {
      expect(shouldAuditByInterceptor('POST', '/auth/login')).toBe(true);
    });
    it('returns true for mutation endpoints', () => {
      expect(shouldAuditByInterceptor('POST', '/users')).toBe(true);
      expect(shouldAuditByInterceptor('PATCH', '/users/123')).toBe(true);
      expect(shouldAuditByInterceptor('DELETE', '/users/123')).toBe(true);
      expect(shouldAuditByInterceptor('POST', '/maintenance/abc/start')).toBe(true);
      expect(shouldAuditByInterceptor('PUT', '/accounts-payable/xyz/pay')).toBe(true);
      expect(shouldAuditByInterceptor('POST', '/stock/warehouses')).toBe(true);
      expect(shouldAuditByInterceptor('POST', '/stock/movements')).toBe(true);
      expect(shouldAuditByInterceptor('POST', '/employees/benefits')).toBe(true);
    });
  });

  describe('getEntityType', () => {
    it('maps simple resources', () => {
      expect(getEntityType('/users')).toBe('User');
      expect(getEntityType('/users/123')).toBe('User');
      expect(getEntityType('/companies')).toBe('Company');
      expect(getEntityType('/branches')).toBe('Branch');
      expect(getEntityType('/products')).toBe('Product');
      expect(getEntityType('/employees')).toBe('Employee');
      expect(getEntityType('/benefits')).toBe('Benefit');
      expect(getEntityType('/vehicles')).toBe('Vehicle');
      expect(getEntityType('/maintenance')).toBe('Maintenance');
      expect(getEntityType('/maintenance/abc/start')).toBe('Maintenance');
      expect(getEntityType('/roles')).toBe('Role');
      expect(getEntityType('/vacations')).toBe('Vacation');
      expect(getEntityType('/expenses')).toBe('Expense');
    });
    it('maps compound paths', () => {
      expect(getEntityType('/accounts-receivable')).toBe('AccountReceivable');
      expect(getEntityType('/accounts-receivable/123/receive')).toBe('AccountReceivable');
      expect(getEntityType('/accounts-payable')).toBe('AccountPayable');
      expect(getEntityType('/accounts-payable/123/pay')).toBe('AccountPayable');
      expect(getEntityType('/financial-transactions')).toBe('FinancialTransaction');
      expect(getEntityType('/units-of-measurement')).toBe('UnitOfMeasurement');
      expect(getEntityType('/vehicle-brands')).toBe('VehicleBrand');
      expect(getEntityType('/vehicle-models')).toBe('VehicleModel');
    });
    it('maps employees/benefits', () => {
      expect(getEntityType('/employees/benefits')).toBe('EmployeeBenefit');
      expect(getEntityType('/employees/benefits/456')).toBe('EmployeeBenefit');
    });
    it('maps stock/warehouses and stock/movements', () => {
      expect(getEntityType('/stock/warehouses')).toBe('Warehouse');
      expect(getEntityType('/stock/warehouses/789')).toBe('Warehouse');
      expect(getEntityType('/stock/movements')).toBe('StockMovement');
    });
    it('maps salaries', () => {
      expect(getEntityType('/salaries')).toBe('Salary');
      expect(getEntityType('/salaries/111/pay')).toBe('Salary');
    });
  });

  describe('getSubRouteDescription', () => {
    it('maintenance state changes', () => {
      expect(getSubRouteDescription('/maintenance/abc/start')).toBe('Ordem de manutenção iniciada');
      expect(getSubRouteDescription('/maintenance/abc/pause')).toBe('Ordem de manutenção pausada');
      expect(getSubRouteDescription('/maintenance/abc/complete')).toBe(
        'Ordem de manutenção concluída',
      );
      expect(getSubRouteDescription('/maintenance/abc/cancel')).toBe(
        'Ordem de manutenção cancelada',
      );
    });
    it('accounts-receivable', () => {
      expect(getSubRouteDescription('/accounts-receivable/123/receive')).toBe(
        'Conta a receber recebida',
      );
      expect(getSubRouteDescription('/accounts-receivable/123/cancel')).toBe(
        'Conta a receber cancelada',
      );
    });
    it('accounts-payable', () => {
      expect(getSubRouteDescription('/accounts-payable/123/pay')).toBe('Conta a pagar paga');
      expect(getSubRouteDescription('/accounts-payable/123/cancel')).toBe(
        'Conta a pagar cancelada',
      );
    });
    it('salaries pay', () => {
      expect(getSubRouteDescription('/salaries/456/pay')).toBe('Salário pago');
    });
    it('returns null for generic PATCH/POST', () => {
      expect(getSubRouteDescription('/users/123')).toBe(null);
      expect(getSubRouteDescription('/products')).toBe(null);
    });
  });

  describe('getActionFromMethodAndPath', () => {
    it('CREATE for POST (except state change)', () => {
      expect(getActionFromMethodAndPath('POST', '/users')).toBe('CREATE');
      expect(getActionFromMethodAndPath('POST', '/products')).toBe('CREATE');
    });
    it('UPDATE for PATCH/PUT', () => {
      expect(getActionFromMethodAndPath('PATCH', '/users/123')).toBe('UPDATE');
      expect(getActionFromMethodAndPath('PUT', '/accounts-payable/123/pay')).toBe('UPDATE');
    });
    it('UPDATE for POST state change', () => {
      expect(getActionFromMethodAndPath('POST', '/maintenance/abc/start')).toBe('UPDATE');
    });
    it('DELETE for DELETE', () => {
      expect(getActionFromMethodAndPath('DELETE', '/users/123')).toBe('DELETE');
    });
  });
});
