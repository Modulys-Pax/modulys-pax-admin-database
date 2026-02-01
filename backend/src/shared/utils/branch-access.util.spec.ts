import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getBranchId, validateBranchAccess } from './branch-access.util';

describe('branch-access.util', () => {
  describe('getBranchId', () => {
    describe('admin user', () => {
      const adminUser = { branchId: 'admin-branch', role: { name: 'ADMIN' } };

      it('deve retornar branchId solicitado quando admin especifica', () => {
        const result = getBranchId('requested-branch', adminUser);
        expect(result).toBe('requested-branch');
      });

      it('deve retornar branchId do usuário quando admin não especifica', () => {
        const result = getBranchId(null, adminUser);
        expect(result).toBe('admin-branch');
      });

      it('deve retornar branchId do usuário quando undefined', () => {
        const result = getBranchId(undefined, adminUser);
        expect(result).toBe('admin-branch');
      });

      it('deve lançar erro quando admin não tem branchId e não especifica', () => {
        const adminWithoutBranch = { role: { name: 'ADMIN' } };
        expect(() => getBranchId(null, adminWithoutBranch)).toThrow(BadRequestException);
      });

      it('deve funcionar com role como string', () => {
        const adminWithRoleString = { branchId: 'branch-1', role: 'admin' };
        const result = getBranchId(null, adminWithRoleString);
        expect(result).toBe('branch-1');
      });
    });

    describe('non-admin user', () => {
      const regularUser = { branchId: 'user-branch', role: { name: 'USER' } };

      it('deve retornar branchId do usuário mesmo quando especifica outro', () => {
        const result = getBranchId('other-branch', regularUser);
        expect(result).toBe('user-branch');
      });

      it('deve retornar branchId do usuário quando não especifica', () => {
        const result = getBranchId(null, regularUser);
        expect(result).toBe('user-branch');
      });

      it('deve lançar erro quando usuário não tem branchId', () => {
        const userWithoutBranch = { role: { name: 'USER' } };
        expect(() => getBranchId(null, userWithoutBranch)).toThrow(BadRequestException);
        expect(() => getBranchId(null, userWithoutBranch)).toThrow(
          'Usuário não possui filial associada',
        );
      });
    });

    describe('edge cases', () => {
      it('deve lidar com user null', () => {
        expect(() => getBranchId('branch', null)).toThrow(BadRequestException);
      });

      it('deve lidar com user undefined', () => {
        expect(() => getBranchId('branch', undefined)).toThrow(BadRequestException);
      });

      it('deve lidar com role null', () => {
        const userWithNullRole = { branchId: 'branch-1', role: null };
        const result = getBranchId(null, userWithNullRole);
        expect(result).toBe('branch-1');
      });
    });
  });

  describe('validateBranchAccess', () => {
    describe('admin user', () => {
      it('deve permitir acesso a qualquer filial', () => {
        expect(() =>
          validateBranchAccess('branch-1', 'admin', 'branch-2', 'branch-3'),
        ).not.toThrow();
      });

      it('deve permitir acesso mesmo sem requestedBranchId', () => {
        expect(() => validateBranchAccess('branch-1', 'ADMIN')).not.toThrow();
      });
    });

    describe('non-admin user', () => {
      it('deve permitir acesso à própria filial', () => {
        expect(() =>
          validateBranchAccess('branch-1', 'user', 'branch-1', 'branch-1'),
        ).not.toThrow();
      });

      it('deve lançar erro quando requestedBranchId é diferente', () => {
        expect(() => validateBranchAccess('branch-1', 'user', 'branch-2')).toThrow(
          ForbiddenException,
        );
        expect(() => validateBranchAccess('branch-1', 'user', 'branch-2')).toThrow(
          'Acesso negado. Você só pode acessar dados da sua própria filial.',
        );
      });

      it('deve lançar erro quando entityBranchId é diferente', () => {
        expect(() => validateBranchAccess('branch-1', 'user', null, 'branch-2')).toThrow(
          ForbiddenException,
        );
        expect(() => validateBranchAccess('branch-1', 'user', null, 'branch-2')).toThrow(
          'Acesso negado. Este registro pertence a outra filial.',
        );
      });

      it('deve lançar erro quando usuário não tem branchId', () => {
        expect(() => validateBranchAccess(null, 'user')).toThrow(ForbiddenException);
        expect(() => validateBranchAccess(undefined, 'user')).toThrow(ForbiddenException);
      });

      it('deve permitir quando requestedBranchId é null/undefined', () => {
        expect(() => validateBranchAccess('branch-1', 'user', null, null)).not.toThrow();
        expect(() => validateBranchAccess('branch-1', 'user', undefined, undefined)).not.toThrow();
      });
    });
  });
});
