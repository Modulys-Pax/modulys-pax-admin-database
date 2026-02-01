import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth-context';

// Mock das APIs
jest.mock('../../api/auth', () => ({
  authApi: {
    login: jest.fn(),
    me: jest.fn(),
    refresh: jest.fn(),
  },
}));

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

import { authApi } from '../../api/auth';
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('auth-context', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    role: { id: 'role-1', name: 'ADMIN', description: null },
    permissions: ['users.view'],
  };

  const mockAuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('AuthProvider', () => {
    it('deve iniciar sem usuário', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('deve verificar token no localStorage ao iniciar', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      mockAuthApi.me.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken');
      expect(result.current.user).toEqual(mockUser);
    });

    it('deve limpar tokens quando me() falha e não há refresh token', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'invalid-token';
        return null;
      });
      mockAuthApi.me.mockRejectedValue(new Error('Token inválido'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      mockAuthApi.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@test.com', 'password');
      });

      expect(mockAuthApi.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password',
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(result.current.user).toBeDefined();
    });
  });

  describe('logout', () => {
    it('deve fazer logout e limpar tokens', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      mockAuthApi.me.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.logout();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshAuth', () => {
    it('deve lançar erro quando não há refresh token', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.refreshAuth()).rejects.toThrow('Nenhum refresh token disponível');
    });

    it('deve atualizar tokens com sucesso', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return 'refresh-token';
        return null;
      });
      mockAuthApi.refresh.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshAuth();
      });

      expect(mockAuthApi.refresh).toHaveBeenCalledWith('refresh-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
    });
  });

  describe('useAuth', () => {
    it('deve lançar erro quando usado fora do Provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth deve ser usado dentro de um AuthProvider');
    });
  });
});
