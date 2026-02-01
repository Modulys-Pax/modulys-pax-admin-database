import { renderHook } from '@testing-library/react';
import { useEffectiveBranch } from '../use-effective-branch';

// Mock dos contexts
jest.mock('../../contexts/branch-context', () => ({
  useBranch: jest.fn(),
}));

jest.mock('../../auth/auth-context', () => ({
  useAuth: jest.fn(),
}));

import { useBranch } from '../../contexts/branch-context';
import { useAuth } from '../../auth/auth-context';

const mockUseBranch = useBranch as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

describe('useEffectiveBranch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('quando usuário é admin', () => {
    it('deve retornar a filial selecionada', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: 'branch-selected',
        isAdmin: true,
      });
      mockUseAuth.mockReturnValue({
        user: { branchId: 'branch-user' },
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.branchId).toBe('branch-selected');
      expect(result.current.isAdmin).toBe(true);
    });

    it('deve retornar null quando nenhuma filial está selecionada', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: null,
        isAdmin: true,
      });
      mockUseAuth.mockReturnValue({
        user: { branchId: 'branch-user' },
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.branchId).toBeNull();
    });

    it('getBranchIdForForm deve retornar string vazia quando branchId é null', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: null,
        isAdmin: true,
      });
      mockUseAuth.mockReturnValue({
        user: { branchId: 'branch-user' },
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.getBranchIdForForm()).toBe('');
    });

    it('getBranchIdForForm deve retornar o branchId quando definido', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: 'branch-123',
        isAdmin: true,
      });
      mockUseAuth.mockReturnValue({
        user: { branchId: 'branch-user' },
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.getBranchIdForForm()).toBe('branch-123');
    });
  });

  describe('quando usuário NÃO é admin', () => {
    it('deve retornar a filial do usuário', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: 'branch-selected',
        isAdmin: false,
      });
      mockUseAuth.mockReturnValue({
        user: { branchId: 'branch-user' },
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.branchId).toBe('branch-user');
      expect(result.current.isAdmin).toBe(false);
    });

    it('deve retornar null se usuário não tem filial', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: 'branch-selected',
        isAdmin: false,
      });
      mockUseAuth.mockReturnValue({
        user: { branchId: undefined },
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.branchId).toBeNull();
    });

    it('deve retornar null se não há usuário', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: 'branch-selected',
        isAdmin: false,
      });
      mockUseAuth.mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.branchId).toBeNull();
    });

    it('getBranchIdForForm deve retornar a filial do usuário', () => {
      mockUseBranch.mockReturnValue({
        selectedBranchId: null,
        isAdmin: false,
      });
      mockUseAuth.mockReturnValue({
        user: { branchId: 'branch-user' },
      });

      const { result } = renderHook(() => useEffectiveBranch());

      expect(result.current.getBranchIdForForm()).toBe('branch-user');
    });
  });
});
