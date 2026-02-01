import {
  getPaginationParams,
  createPaginationMeta,
  paginateArray,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from './pagination.util';

describe('pagination.util', () => {
  describe('constants', () => {
    it('deve ter valores padrão corretos', () => {
      expect(DEFAULT_PAGE).toBe(1);
      expect(DEFAULT_LIMIT).toBe(10);
      expect(MAX_LIMIT).toBe(100);
    });
  });

  describe('getPaginationParams', () => {
    it('deve retornar valores padrão quando não há parâmetros', () => {
      const result = getPaginationParams();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0);
      expect(result.take).toBe(10);
    });

    it('deve usar parâmetros fornecidos', () => {
      const result = getPaginationParams({ page: 3, limit: 20 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(40); // (3-1) * 20
      expect(result.take).toBe(20);
    });

    it('deve garantir página mínima de 1', () => {
      const result = getPaginationParams({ page: 0 });
      expect(result.page).toBe(1);

      const result2 = getPaginationParams({ page: -5 });
      expect(result2.page).toBe(1);
    });

    it('deve usar defaultLimit quando limit é 0 ou negativo', () => {
      // Math.max(1, 0 || 10) = Math.max(1, 10) = 10
      const result = getPaginationParams({ limit: 0 });
      expect(result.limit).toBe(10);

      // Math.max(1, -10) = 1
      const result2 = getPaginationParams({ limit: -10 }, 5);
      expect(result2.limit).toBe(1);
    });

    it('deve limitar ao máximo de 100', () => {
      const result = getPaginationParams({ limit: 500 });
      expect(result.limit).toBe(100);
    });

    it('deve usar defaultLimit personalizado', () => {
      const result = getPaginationParams({}, 50);
      expect(result.limit).toBe(50);
    });

    it('deve calcular skip corretamente', () => {
      expect(getPaginationParams({ page: 1, limit: 10 }).skip).toBe(0);
      expect(getPaginationParams({ page: 2, limit: 10 }).skip).toBe(10);
      expect(getPaginationParams({ page: 5, limit: 20 }).skip).toBe(80);
    });
  });

  describe('createPaginationMeta', () => {
    it('deve criar metadados corretos', () => {
      const result = createPaginationMeta(100, 1, 10);

      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('deve calcular totalPages corretamente', () => {
      expect(createPaginationMeta(25, 1, 10).totalPages).toBe(3);
      expect(createPaginationMeta(30, 1, 10).totalPages).toBe(3);
      expect(createPaginationMeta(31, 1, 10).totalPages).toBe(4);
    });

    it('deve retornar totalPages = 1 quando total = 0', () => {
      const result = createPaginationMeta(0, 1, 10);
      expect(result.totalPages).toBe(1);
    });

    it('deve calcular hasNext corretamente', () => {
      expect(createPaginationMeta(100, 1, 10).hasNext).toBe(true);
      expect(createPaginationMeta(100, 10, 10).hasNext).toBe(false);
      expect(createPaginationMeta(100, 5, 10).hasNext).toBe(true);
    });

    it('deve calcular hasPrev corretamente', () => {
      expect(createPaginationMeta(100, 1, 10).hasPrev).toBe(false);
      expect(createPaginationMeta(100, 2, 10).hasPrev).toBe(true);
      expect(createPaginationMeta(100, 10, 10).hasPrev).toBe(true);
    });
  });

  describe('paginateArray', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));

    it('deve paginar array corretamente', () => {
      const result = paginateArray(items, 1, 10);

      expect(result.items).toHaveLength(10);
      expect(result.items[0].id).toBe(1);
      expect(result.items[9].id).toBe(10);
    });

    it('deve retornar página 2 corretamente', () => {
      const result = paginateArray(items, 2, 10);

      expect(result.items).toHaveLength(10);
      expect(result.items[0].id).toBe(11);
      expect(result.items[9].id).toBe(20);
    });

    it('deve retornar última página com menos itens', () => {
      const result = paginateArray(items, 4, 15);

      expect(result.items).toHaveLength(5); // 50 - 45 = 5 items
      expect(result.items[0].id).toBe(46);
    });

    it('deve incluir metadados corretos', () => {
      const result = paginateArray(items, 2, 10);

      expect(result.meta.total).toBe(50);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });

    it('deve usar valores padrão quando não fornecidos', () => {
      const result = paginateArray(items);

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('deve retornar array vazio para página além do total', () => {
      const result = paginateArray(items, 100, 10);

      expect(result.items).toHaveLength(0);
    });

    it('deve funcionar com array vazio', () => {
      const result = paginateArray([], 1, 10);

      expect(result.items).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(1);
    });
  });
});
