import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  it('deve extrair usuário do request', () => {
    const mockUser = { id: 'user-1', email: 'test@test.com', role: 'admin' };

    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as any;

    // Extrair a função factory do decorator
    function getParamDecoratorFactory(decorator: Function) {
      class Test {
        public test(@decorator() value: any) {}
      }
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
      return args[Object.keys(args)[0]].factory;
    }

    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory(null, mockContext);

    expect(result).toEqual(mockUser);
  });

  it('deve retornar undefined quando não há usuário', () => {
    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;

    function getParamDecoratorFactory(decorator: Function) {
      class Test {
        public test(@decorator() value: any) {}
      }
      const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
      return args[Object.keys(args)[0]].factory;
    }

    const factory = getParamDecoratorFactory(CurrentUser);
    const result = factory(null, mockContext);

    expect(result).toBeUndefined();
  });
});
