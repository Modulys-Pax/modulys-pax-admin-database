import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  const createMockContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    }) as ExecutionContext;

  describe('intercept', () => {
    it('deve transformar resposta com data e timestamp', (done) => {
      const context = createMockContext();
      const handler: CallHandler = {
        handle: () => of({ id: 1, name: 'Test' }),
      };

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('timestamp');
        expect(result.data).toEqual({ id: 1, name: 'Test' });
        expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        done();
      });
    });

    it('deve funcionar com array', (done) => {
      const context = createMockContext();
      const handler: CallHandler = {
        handle: () => of([{ id: 1 }, { id: 2 }]),
      };

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result.data).toHaveLength(2);
        expect(result.timestamp).toBeDefined();
        done();
      });
    });

    it('deve funcionar com null', (done) => {
      const context = createMockContext();
      const handler: CallHandler = {
        handle: () => of(null),
      };

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result.data).toBeNull();
        expect(result.timestamp).toBeDefined();
        done();
      });
    });

    it('deve funcionar com valor primitivo', (done) => {
      const context = createMockContext();
      const handler: CallHandler = {
        handle: () => of('test string'),
      };

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result.data).toBe('test string');
        expect(result.timestamp).toBeDefined();
        done();
      });
    });
  });
});
