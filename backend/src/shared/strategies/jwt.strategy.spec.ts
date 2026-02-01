import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    active: true,
    companyId: 'company-1',
    branchId: 'branch-1',
    role: {
      id: 'role-1',
      name: 'ADMIN',
      permissions: [
        { permission: { name: 'users.view' } },
        { permission: { name: 'users.create' } },
      ],
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('deve retornar payload enriquecido para usuário válido', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate({ sub: 'user-1' });

      expect(result.sub).toBe('user-1');
      expect(result.email).toBe('test@test.com');
      expect(result.permissions).toContain('users.view');
    });

    it('deve lançar UnauthorizedException quando payload é null', async () => {
      await expect(strategy.validate(null)).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate(null)).rejects.toThrow('Token inválido');
    });

    it('deve lançar UnauthorizedException quando payload.sub é undefined', async () => {
      await expect(strategy.validate({})).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate({ sub: 'invalid-user' })).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate({ sub: 'invalid-user' })).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('deve lançar UnauthorizedException quando usuário está inativo', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });

      await expect(strategy.validate({ sub: 'user-1' })).rejects.toThrow(UnauthorizedException);
      await expect(strategy.validate({ sub: 'user-1' })).rejects.toThrow('Usuário inativo');
    });

    it('deve extrair todas as permissões do usuário', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate({ sub: 'user-1' });

      expect(result.permissions).toHaveLength(2);
      expect(result.permissions).toEqual(['users.view', 'users.create']);
    });

    it('deve incluir roleId e role no resultado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate({ sub: 'user-1' });

      expect(result.roleId).toBe('role-1');
      expect(result.role).toBe('ADMIN');
    });
  });
});
