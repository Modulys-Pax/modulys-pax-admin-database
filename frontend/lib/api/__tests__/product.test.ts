import { productApi, Product, CreateProductDto, ProductSummaryResponse } from '../product';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('productApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockProduct: Product = {
    id: 'product-123',
    name: 'Óleo Motor 15W40',
    code: 'OLM001',
    description: 'Óleo lubrificante para motor diesel',
    unit: 'L',
    unitPrice: 25.50,
    minQuantity: 10,
    totalStock: 50,
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todos os produtos', async () => {
      const mockResponse = {
        data: [mockProduct],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await productApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: { branchId: undefined, includeDeleted: undefined, page: 1, limit: 15 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar por branchId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await productApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: { branchId: 'branch-123', includeDeleted: undefined, page: 1, limit: 15 },
      });
    });

    it('deve incluir deletados', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await productApi.getAll(undefined, true);

      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: { branchId: undefined, includeDeleted: true, page: 1, limit: 15 },
      });
    });
  });

  describe('getById', () => {
    it('deve buscar produto por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockProduct });

      const result = await productApi.getById('product-123');

      expect(mockApi.get).toHaveBeenCalledWith('/products/product-123');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('create', () => {
    it('deve criar produto', async () => {
      const createDto: CreateProductDto = {
        name: 'Filtro de Óleo',
        code: 'FLT001',
        unitPrice: 45.00,
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockProduct });

      const result = await productApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/products', createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('deve atualizar produto', async () => {
      const updateData = { unitPrice: 30.00 };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockProduct, unitPrice: 30.00 },
      });

      const result = await productApi.update('product-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/products/product-123', updateData);
      expect(result.unitPrice).toBe(30.00);
    });
  });

  describe('delete', () => {
    it('deve deletar produto', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await productApi.delete('product-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/products/product-123');
    });
  });

  describe('getSummary', () => {
    it('deve buscar resumo de produtos', async () => {
      const mockSummary: ProductSummaryResponse = {
        totalCost: 10000,
        totalQuantityByUnit: [{ unit: 'L', totalQuantity: 100 }],
        totalProducts: 20,
        totalUsages: 50,
        products: {
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 0,
        },
        periods: [],
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockSummary });

      const result = await productApi.getSummary('branch-123', '2024-01-01', '2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/products/summary/statistics', {
        params: {
          branchId: 'branch-123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          page: 1,
          limit: 15,
        },
      });
      expect(result.totalCost).toBe(10000);
    });

    it('deve buscar resumo sem filtros', async () => {
      const mockSummary: ProductSummaryResponse = {
        totalCost: 5000,
        totalQuantityByUnit: [],
        totalProducts: 10,
        totalUsages: 25,
        products: { data: [], total: 0, page: 1, limit: 15, totalPages: 0 },
        periods: [],
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockSummary });

      const result = await productApi.getSummary();

      expect(mockApi.get).toHaveBeenCalledWith('/products/summary/statistics', {
        params: {
          branchId: undefined,
          startDate: undefined,
          endDate: undefined,
          page: 1,
          limit: 15,
        },
      });
      expect(result.totalProducts).toBe(10);
    });
  });
});
