import { generateBreadcrumbs } from '../breadcrumb-utils';

describe('breadcrumb-utils', () => {
  describe('generateBreadcrumbs', () => {
    it('deve retornar Dashboard > Início para /dashboard', () => {
      const result = generateBreadcrumbs('/dashboard');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
      expect(result[1]).toEqual({ label: 'Início' });
    });

    it('deve retornar Dashboard > Início para /', () => {
      const result = generateBreadcrumbs('/');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
      expect(result[1]).toEqual({ label: 'Início' });
    });

    it('deve gerar breadcrumbs para página de listagem', () => {
      const result = generateBreadcrumbs('/dashboard/employees');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
      expect(result[1]).toEqual({ label: 'Funcionários' });
    });

    it('deve gerar breadcrumbs para página de detalhes com UUID', () => {
      const result = generateBreadcrumbs('/dashboard/employees/550e8400-e29b-41d4-a716-446655440000');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
      expect(result[1]).toEqual({ label: 'Funcionários', href: '/dashboard/employees' });
      expect(result[2]).toEqual({ label: 'Detalhes' });
    });

    it('deve gerar breadcrumbs para página new', () => {
      const result = generateBreadcrumbs('/dashboard/employees/new');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
      expect(result[1]).toEqual({ label: 'Funcionários', href: '/dashboard/employees' });
      expect(result[2]).toEqual({ label: 'Novo' });
    });

    it('deve traduzir rotas conhecidas', () => {
      const testCases = [
        { path: '/dashboard/vehicles', expected: 'Veículos' },
        { path: '/dashboard/products', expected: 'Produtos' },
        { path: '/dashboard/maintenance', expected: 'Manutenção' },
        { path: '/dashboard/branches', expected: 'Filiais' },
        { path: '/dashboard/accounts-payable', expected: 'Contas a Pagar' },
        { path: '/dashboard/accounts-receivable', expected: 'Contas a Receber' },
        { path: '/dashboard/stock', expected: 'Estoque' },
        { path: '/dashboard/audit', expected: 'Auditoria' },
      ];

      testCases.forEach(({ path, expected }) => {
        const result = generateBreadcrumbs(path);
        expect(result[result.length - 1].label).toBe(expected);
      });
    });

    it('deve remover query params', () => {
      const result = generateBreadcrumbs('/dashboard/employees?page=2&search=test');
      
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ label: 'Funcionários' });
    });

    it('deve remover hash', () => {
      const result = generateBreadcrumbs('/dashboard/employees#section');
      
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ label: 'Funcionários' });
    });

    it('deve formatar segmentos desconhecidos', () => {
      const result = generateBreadcrumbs('/dashboard/custom-page');
      
      expect(result).toHaveLength(2);
      expect(result[1].label).toBe('Custom Page');
    });

    it('deve lidar com ID numérico', () => {
      const result = generateBreadcrumbs('/dashboard/products/123');
      
      expect(result).toHaveLength(3);
      expect(result[2]).toEqual({ label: 'Detalhes' });
    });

    it('deve gerar path correto para subpáginas', () => {
      const result = generateBreadcrumbs('/dashboard/employees/123/payments');
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ label: 'Dashboard', href: '/dashboard' });
      expect(result[1]).toEqual({ label: 'Funcionários', href: '/dashboard/employees' });
      expect(result[2]).toEqual({ label: 'Detalhes', href: '/dashboard/employees/123' });
      expect(result[3]).toEqual({ label: 'Payments' });
    });

    it('deve tratar products/summary corretamente', () => {
      const result = generateBreadcrumbs('/dashboard/products/summary');
      
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({ label: 'Produtos', href: '/dashboard/products' });
      expect(result[2]).toEqual({ label: 'Resumo de Produtos' });
    });
  });
});
