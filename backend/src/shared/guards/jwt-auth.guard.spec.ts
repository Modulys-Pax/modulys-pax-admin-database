import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

// Mock do AuthGuard
jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => {
    return class MockAuthGuard {
      canActivate(context: ExecutionContext) {
        return true;
      }
    };
  }),
}));

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  const createMockContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer valid-token',
          },
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  describe('canActivate', () => {
    it('deve estar definido', () => {
      expect(guard).toBeDefined();
    });

    it('deve chamar super.canActivate', () => {
      const context = createMockContext();

      // Como o AuthGuard está mockado para retornar true
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve ser uma instância de JwtAuthGuard', () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });
  });
});
