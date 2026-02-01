import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { BranchFilterInterceptor } from './branch-filter.interceptor';

describe('BranchFilterInterceptor', () => {
  let interceptor: BranchFilterInterceptor;

  beforeEach(() => {
    interceptor = new BranchFilterInterceptor();
  });

  const createMockContext = (user: any, query: any = {}, body: any = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          query,
          body,
        }),
      }),
    }) as ExecutionContext;

  const createMockCallHandler = (): CallHandler => ({
    handle: () => of({ data: 'test' }),
  });

  describe('intercept', () => {
    it('deve passar sem alterações quando não há usuário', (done) => {
      const context = createMockContext(null, { branchId: 'branch-1' });
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      });
    });

    it('deve permitir qualquer branchId para admin', (done) => {
      const user = { role: 'ADMIN', branchId: 'admin-branch' };
      const query = { branchId: 'other-branch' };
      const context = createMockContext(user, query);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(query.branchId).toBe('other-branch'); // Não foi alterado
        done();
      });
    });

    it('deve forçar branchId do usuário no query para não-admin', (done) => {
      const user = { role: 'user', branchId: 'user-branch' };
      const query = { branchId: 'other-branch' };
      const context = createMockContext(user, query);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(query.branchId).toBe('user-branch');
        done();
      });
    });

    it('deve forçar branchId do usuário no body para não-admin', (done) => {
      const user = { role: 'user', branchId: 'user-branch' };
      const body = { branchId: 'other-branch', name: 'Test' };
      const context = createMockContext(user, {}, body);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(body.branchId).toBe('user-branch');
        done();
      });
    });

    it('não deve forçar branchId se usuário não tem branchId', (done) => {
      const user = { role: 'user' };
      const query = { branchId: 'other-branch' };
      const context = createMockContext(user, query);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(query.branchId).toBe('other-branch'); // Não foi alterado
        done();
      });
    });

    it('deve funcionar com admin em lowercase', (done) => {
      const user = { role: 'admin', branchId: 'admin-branch' };
      const query = { branchId: 'other-branch' };
      const context = createMockContext(user, query);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(query.branchId).toBe('other-branch'); // Não foi alterado
        done();
      });
    });

    it('deve funcionar quando não há query.branchId', (done) => {
      const user = { role: 'user', branchId: 'user-branch' };
      const query: any = { search: 'test' };
      const context = createMockContext(user, query);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(query.branchId).toBeUndefined();
        done();
      });
    });

    it('deve funcionar quando não há body.branchId', (done) => {
      const user = { role: 'user', branchId: 'user-branch' };
      const body: any = { name: 'Test' };
      const context = createMockContext(user, {}, body);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(body.branchId).toBeUndefined();
        done();
      });
    });
  });
});
