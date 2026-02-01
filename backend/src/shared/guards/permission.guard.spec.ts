import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  describe('canActivate', () => {
    it('deve permitir acesso quando não há permissão requerida', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const context = createMockContext({ id: 'user-1' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve lançar ForbiddenException quando não há usuário autenticado', () => {
      mockReflector.getAllAndOverride.mockReturnValue('employees.view');

      const context = createMockContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Usuário não autenticado');
    });

    it('deve permitir acesso para usuário ADMIN', () => {
      mockReflector.getAllAndOverride.mockReturnValue('employees.view');

      const context = createMockContext({
        id: 'user-1',
        role: 'ADMIN',
        permissions: [],
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve permitir acesso quando usuário tem a permissão requerida', () => {
      mockReflector.getAllAndOverride.mockReturnValue('employees.view');

      const context = createMockContext({
        id: 'user-1',
        role: 'USER',
        permissions: ['employees.view', 'employees.create'],
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('deve negar acesso quando usuário não tem a permissão requerida', () => {
      mockReflector.getAllAndOverride.mockReturnValue('employees.delete');

      const context = createMockContext({
        id: 'user-1',
        role: 'USER',
        permissions: ['employees.view', 'employees.create'],
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Você não tem permissão para realizar esta ação. Permissão necessária: employees.delete',
      );
    });

    it('deve negar acesso quando usuário não tem permissões definidas', () => {
      mockReflector.getAllAndOverride.mockReturnValue('employees.view');

      const context = createMockContext({
        id: 'user-1',
        role: 'USER',
        permissions: undefined,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('deve negar acesso com array de permissões vazio', () => {
      mockReflector.getAllAndOverride.mockReturnValue('employees.view');

      const context = createMockContext({
        id: 'user-1',
        role: 'USER',
        permissions: [],
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('deve verificar permissão exata (case sensitive)', () => {
      mockReflector.getAllAndOverride.mockReturnValue('employees.VIEW');

      const context = createMockContext({
        id: 'user-1',
        role: 'USER',
        permissions: ['employees.view'],
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('deve usar getAllAndOverride do reflector com handler e class', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const mockHandler = jest.fn();
      const mockClass = jest.fn();

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ user: { id: 'user-1' } }),
        }),
        getHandler: () => mockHandler,
        getClass: () => mockClass,
      } as unknown as ExecutionContext;

      guard.canActivate(context);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSION_KEY, [
        mockHandler,
        mockClass,
      ]);
    });
  });
});
