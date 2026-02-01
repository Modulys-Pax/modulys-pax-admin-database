/**
 * Utilitários para paginação consistente em todo o sistema
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Valores padrão de paginação
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

/**
 * Calcula os parâmetros de paginação para queries Prisma
 *
 * @param params - Parâmetros de paginação (page, limit)
 * @param defaultLimit - Limite padrão (default: 10)
 * @returns Objeto com skip, take, page e limit normalizados
 *
 * @example
 * const { skip, take } = getPaginationParams({ page: 2, limit: 20 });
 * // skip = 20, take = 20
 */
export function getPaginationParams(
  params: PaginationParams = {},
  defaultLimit: number = DEFAULT_LIMIT,
): PaginationResult {
  const page = Math.max(1, params.page || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit || defaultLimit));
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit,
  };
}

/**
 * Cria os metadados de paginação para a resposta
 *
 * @param total - Total de registros
 * @param page - Página atual
 * @param limit - Limite por página
 * @returns Metadados de paginação
 */
export function createPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Aplica paginação a um array em memória
 *
 * @param items - Array de itens
 * @param page - Página atual
 * @param limit - Limite por página
 * @returns Objeto com items paginados e metadados
 */
export function paginateArray<T>(
  items: T[],
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
): { items: T[]; meta: PaginationMeta } {
  const total = items.length;
  const { skip } = getPaginationParams({ page, limit });
  const paginatedItems = items.slice(skip, skip + limit);

  return {
    items: paginatedItems,
    meta: createPaginationMeta(total, page, limit),
  };
}
