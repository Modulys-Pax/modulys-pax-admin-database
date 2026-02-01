/**
 * Utilitário para validação de acesso por filial
 * Garante que usuários não-admin só acessam dados da própria filial
 */

import { ForbiddenException, BadRequestException } from '@nestjs/common';

/**
 * Obtém o branchId efetivo baseado no usuário e parâmetro opcional
 * - Admin: usa branchId do parâmetro ou do usuário
 * - Não-admin: sempre usa branchId do próprio usuário
 *
 * @param requestedBranchId - branchId solicitado (query param ou body)
 * @param user - objeto do usuário autenticado
 * @returns branchId efetivo a ser usado
 * @throws BadRequestException se não houver branchId disponível
 */
export function getBranchId(
  requestedBranchId: string | null | undefined,
  user: { branchId?: string | null; role?: { name?: string } | string | null } | null | undefined,
): string {
  const userBranchId = user?.branchId;
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
  const isAdmin = roleName?.toLowerCase() === 'admin';

  // Admin pode usar o branchId solicitado ou seu próprio
  if (isAdmin) {
    const effectiveBranchId = requestedBranchId || userBranchId;
    if (!effectiveBranchId) {
      throw new BadRequestException('branchId é obrigatório');
    }
    return effectiveBranchId;
  }

  // Não-admin sempre usa seu próprio branchId
  if (!userBranchId) {
    throw new BadRequestException('Usuário não possui filial associada');
  }

  return userBranchId;
}

/**
 * Valida se o usuário tem acesso ao branchId especificado
 *
 * @param userBranchId - branchId do usuário autenticado
 * @param userRole - role do usuário (em minúsculo)
 * @param requestedBranchId - branchId sendo acessado/criado
 * @param entityBranchId - branchId do registro (para findOne/update/delete)
 *
 * @throws ForbiddenException se não-admin tentar acessar outra filial
 */
export function validateBranchAccess(
  userBranchId: string | null | undefined,
  userRole: string | null | undefined,
  requestedBranchId?: string | null,
  entityBranchId?: string | null,
): void {
  const isAdmin = userRole?.toLowerCase() === 'admin';

  // Admin pode acessar qualquer filial
  if (isAdmin) {
    return;
  }

  // Não-admin deve ter branchId
  if (!userBranchId) {
    throw new ForbiddenException('Usuário não possui filial associada. Acesso negado.');
  }

  // Validar branchId em query params ou body (requestedBranchId)
  if (requestedBranchId && requestedBranchId !== userBranchId) {
    throw new ForbiddenException(
      'Acesso negado. Você só pode acessar dados da sua própria filial.',
    );
  }

  // Validar branchId do registro (entityBranchId)
  if (entityBranchId && entityBranchId !== userBranchId) {
    throw new ForbiddenException('Acesso negado. Este registro pertence a outra filial.');
  }
}
