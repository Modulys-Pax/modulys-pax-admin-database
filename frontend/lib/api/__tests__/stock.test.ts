import {
  warehouseApi,
  stockApi,
  stockMovementApi,
  Warehouse,
  Stock,
  StockMovement,
  CreateStockMovementDto,
  StockMovementType,
} from '../stock';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('Stock APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWarehouse: Warehouse = {
    id: 'warehouse-123',
    code: 'ALM001',
    name: 'Almoxarifado Principal',
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStock: Stock = {
    id: 'stock-123',
    productId: 'product-123',
    warehouseId: 'warehouse-123',
    quantity: 100,
    averageCost: 25.50,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMovement: StockMovement = {
    id: 'movement-123',
    type: StockMovementType.ENTRY,
    productId: 'product-123',
    quantity: 50,
    unitCost: 25.00,
    totalCost: 1250.00,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
  };

  describe('warehouseApi', () => {
    describe('getAll', () => {
      it('deve buscar todos os almoxarifados', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockWarehouse] });

        const result = await warehouseApi.getAll();

        expect(mockApi.get).toHaveBeenCalledWith('/stock/warehouses', {
          params: { companyId: undefined, branchId: undefined, includeDeleted: undefined },
        });
        expect(result).toEqual([mockWarehouse]);
      });

      it('deve filtrar por branchId', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

        await warehouseApi.getAll(undefined, 'branch-123');

        expect(mockApi.get).toHaveBeenCalledWith('/stock/warehouses', {
          params: { companyId: undefined, branchId: 'branch-123', includeDeleted: undefined },
        });
      });
    });

    describe('getCompanyDefault', () => {
      it('deve retornar almoxarifado padrão da empresa', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockWarehouse] });

        const result = await warehouseApi.getCompanyDefault('company-123');

        expect(mockApi.get).toHaveBeenCalledWith('/stock/warehouses', {
          params: { companyId: 'company-123', includeDeleted: false },
        });
        expect(result).toEqual(mockWarehouse);
      });

      it('deve retornar null se não existir almoxarifado', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

        const result = await warehouseApi.getCompanyDefault('company-123');

        expect(result).toBeNull();
      });
    });
  });

  describe('stockApi', () => {
    describe('getAll', () => {
      it('deve buscar estoque', async () => {
        const mockResponse = {
          data: [mockStock],
          total: 1,
          page: 1,
          limit: 15,
          totalPages: 1,
        };
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

        const result = await stockApi.getAll();

        expect(mockApi.get).toHaveBeenCalledWith('/stock/stocks', {
          params: {
            companyId: undefined,
            branchId: undefined,
            warehouseId: undefined,
            productId: undefined,
            page: 1,
            limit: 15,
          },
        });
        expect(result).toEqual(mockResponse);
      });

      it('deve filtrar por produto', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

        await stockApi.getAll(undefined, undefined, undefined, 'product-123');

        expect(mockApi.get).toHaveBeenCalledWith('/stock/stocks', {
          params: expect.objectContaining({ productId: 'product-123' }),
        });
      });
    });

    describe('getById', () => {
      it('deve buscar estoque por ID', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockStock });

        const result = await stockApi.getById('stock-123');

        expect(mockApi.get).toHaveBeenCalledWith('/stock/stocks/stock-123');
        expect(result).toEqual(mockStock);
      });
    });
  });

  describe('stockMovementApi', () => {
    describe('getAll', () => {
      it('deve buscar movimentações', async () => {
        const mockResponse = {
          data: [mockMovement],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        };
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

        const result = await stockMovementApi.getAll();

        expect(mockApi.get).toHaveBeenCalledWith('/stock/movements', {
          params: {
            companyId: undefined,
            branchId: undefined,
            productId: undefined,
            startDate: undefined,
            endDate: undefined,
            page: 1,
            limit: 10,
          },
        });
        expect(result).toEqual(mockResponse);
      });

      it('deve filtrar por período', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

        await stockMovementApi.getAll(undefined, undefined, undefined, '2024-01-01', '2024-12-31');

        expect(mockApi.get).toHaveBeenCalledWith('/stock/movements', {
          params: expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          }),
        });
      });
    });

    describe('getById', () => {
      it('deve buscar movimentação por ID', async () => {
        (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockMovement });

        const result = await stockMovementApi.getById('movement-123');

        expect(mockApi.get).toHaveBeenCalledWith('/stock/movements/movement-123');
        expect(result).toEqual(mockMovement);
      });
    });

    describe('create', () => {
      it('deve criar movimentação de entrada', async () => {
        const createDto: CreateStockMovementDto = {
          productId: 'product-123',
          quantity: 50,
          unitCost: 25.00,
          companyId: 'company-123',
          branchId: 'branch-123',
        };
        (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockMovement });

        const result = await stockMovementApi.create(createDto);

        expect(mockApi.post).toHaveBeenCalledWith('/stock/movements', createDto);
        expect(result).toEqual(mockMovement);
      });
    });
  });
});
