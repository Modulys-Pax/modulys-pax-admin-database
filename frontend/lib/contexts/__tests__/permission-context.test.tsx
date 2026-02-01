import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { PermissionProvider, usePermissions, useHasPermission, useCanAccessModule } from '../permission-context';

// Mock do auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '@/lib/auth/auth-context';
const mockUseAuth = useAuth as jest.Mock;

describe('permission-context', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PermissionProvider>{children}</PermissionProvider>
  );

  describe('PermissionProvider', () => {
    it('deve fornecer permissões do usuário', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view', 'users.create'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.permissions).toEqual(['users.view', 'users.create']);
      expect(result.current.isAdmin).toBe(false);
    });

    it('deve identificar admin corretamente', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: [],
          role: { name: 'ADMIN' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.isAdmin).toBe(true);
    });

    it('deve retornar array vazio quando não há usuário', () => {
      mockUseAuth.mockReturnValue({ user: null });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('deve retornar true para permissão existente', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasPermission('users.view')).toBe(true);
    });

    it('deve retornar false para permissão inexistente', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasPermission('users.delete')).toBe(false);
    });

    it('deve retornar true para admin independente da permissão', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: [],
          role: { name: 'ADMIN' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasPermission('any.permission')).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('deve retornar true quando tem todas as permissões', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view', 'users.create', 'users.update'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAllPermissions(['users.view', 'users.create'])).toBe(true);
    });

    it('deve retornar false quando falta alguma permissão', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAllPermissions(['users.view', 'users.delete'])).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('deve retornar true quando tem pelo menos uma permissão', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAnyPermission(['users.view', 'users.delete'])).toBe(true);
    });

    it('deve retornar false quando não tem nenhuma permissão', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['products.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.hasAnyPermission(['users.view', 'users.delete'])).toBe(false);
    });
  });

  describe('canAccessModule', () => {
    it('deve retornar true quando tem permissão do módulo', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view', 'users.create'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.canAccessModule('users')).toBe(true);
    });

    it('deve retornar false quando não tem permissão do módulo', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['products.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => usePermissions(), { wrapper });

      expect(result.current.canAccessModule('users')).toBe(false);
    });
  });

  describe('useHasPermission', () => {
    it('deve verificar permissão específica', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => useHasPermission('users.view'), { wrapper });

      expect(result.current).toBe(true);
    });
  });

  describe('useCanAccessModule', () => {
    it('deve verificar acesso ao módulo', () => {
      mockUseAuth.mockReturnValue({
        user: {
          permissions: ['users.view'],
          role: { name: 'USER' },
        },
      });

      const { result } = renderHook(() => useCanAccessModule('users'), { wrapper });

      expect(result.current).toBe(true);
    });
  });

  describe('usePermissions sem Provider', () => {
    it('deve lançar erro quando usado fora do Provider', () => {
      mockUseAuth.mockReturnValue({ user: null });

      expect(() => {
        renderHook(() => usePermissions());
      }).toThrow('usePermissions deve ser usado dentro de um PermissionProvider');
    });
  });
});
