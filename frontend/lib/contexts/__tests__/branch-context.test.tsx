import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BranchProvider, useBranch } from '../branch-context';

// Mock do auth context
jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '@/lib/auth/auth-context';
const mockUseAuth = useAuth as jest.Mock;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('branch-context', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BranchProvider>{children}</BranchProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('BranchProvider', () => {
    it('deve identificar admin corretamente', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'admin' }, branchId: 'branch-1' },
      });

      const { result } = renderHook(() => useBranch(), { wrapper });

      expect(result.current.isAdmin).toBe(true);
    });

    it('deve identificar não-admin corretamente', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'user' }, branchId: 'branch-1' },
      });

      const { result } = renderHook(() => useBranch(), { wrapper });

      expect(result.current.isAdmin).toBe(false);
    });

    it('deve carregar branchId do localStorage para admin', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'admin' } },
      });
      localStorageMock.getItem.mockReturnValue('stored-branch');

      const { result } = renderHook(() => useBranch(), { wrapper });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('selectedBranchId');
    });

    it('deve limpar localStorage para não-admin', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'user' }, branchId: 'branch-1' },
      });

      renderHook(() => useBranch(), { wrapper });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedBranchId');
    });
  });

  describe('setSelectedBranchId', () => {
    it('deve salvar no localStorage quando há branchId', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'admin' } },
      });

      const { result } = renderHook(() => useBranch(), { wrapper });

      act(() => {
        result.current.setSelectedBranchId('new-branch');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedBranchId', 'new-branch');
    });

    it('deve remover do localStorage quando branchId é null', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'admin' } },
      });

      const { result } = renderHook(() => useBranch(), { wrapper });

      act(() => {
        result.current.setSelectedBranchId(null);
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('selectedBranchId');
    });
  });

  describe('getEffectiveBranchId', () => {
    it('deve retornar branchId selecionada para admin', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'admin' } },
      });

      const { result } = renderHook(() => useBranch(), { wrapper });

      act(() => {
        result.current.setSelectedBranchId('selected-branch');
      });

      expect(result.current.getEffectiveBranchId()).toBe('selected-branch');
    });

    it('deve retornar branchId do usuário para não-admin', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'user' }, branchId: 'user-branch' },
      });

      const { result } = renderHook(() => useBranch(), { wrapper });

      expect(result.current.getEffectiveBranchId()).toBe('user-branch');
    });

    it('deve retornar null quando não-admin não tem branchId', () => {
      mockUseAuth.mockReturnValue({
        user: { role: { name: 'user' } },
      });

      const { result } = renderHook(() => useBranch(), { wrapper });

      expect(result.current.getEffectiveBranchId()).toBeNull();
    });
  });

  describe('useBranch sem Provider', () => {
    it('deve lançar erro quando usado fora do Provider', () => {
      mockUseAuth.mockReturnValue({ user: null });

      expect(() => {
        renderHook(() => useBranch());
      }).toThrow('useBranch must be used within a BranchProvider');
    });
  });
});
