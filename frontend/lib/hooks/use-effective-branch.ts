import { useBranch } from '../contexts/branch-context';
import { useAuth } from '../auth/auth-context';

/**
 * Hook para obter a filial efetiva a ser usada em formulários e queries
 * - Para admin: retorna a filial selecionada (pode ser null para "todas")
 * - Para não-admin: retorna a filial do perfil do usuário (sempre preenchida)
 */
export function useEffectiveBranch() {
  const { selectedBranchId, isAdmin } = useBranch();
  const { user } = useAuth();
  
  // Calcular filial efetiva diretamente aqui para garantir reatividade
  // Não usar useMemo para garantir que sempre recalcula quando selectedBranchId muda
  const effectiveBranchId = isAdmin ? selectedBranchId : (user?.branchId || null);

  return {
    branchId: effectiveBranchId,
    isAdmin,
    // Helper para usar em formulários (sempre retorna string, nunca null)
    getBranchIdForForm: () => {
      return effectiveBranchId || '';
    },
  };
}
