import { Test, TestingModule } from '@nestjs/testing';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

describe('StockController', () => {
  let controller: StockController;
  let stockService: StockService;

  const mockStockService = {
    findAllWarehouses: jest.fn(),
    findAllStocks: jest.fn(),
    findOneStock: jest.fn(),
    createStockMovement: jest.fn(),
    findAllStockMovements: jest.fn(),
    findOneStockMovement: jest.fn(),
  };

  const mockStock = { id: 'stock-1', quantity: 100, productId: 'product-1' };
  const mockMovement = { id: 'mov-1', quantity: 10, type: 'IN' };
  const mockCurrentUser = { sub: 'user-1', branchId: 'branch-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: mockStockService }],
    }).compile();

    controller = module.get<StockController>(StockController);
    stockService = module.get<StockService>(StockService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllWarehouses', () => {
    it('deve retornar lista de almoxarifados', async () => {
      const warehouses = [{ id: 'wh-1', name: 'Principal' }];
      mockStockService.findAllWarehouses.mockResolvedValue(warehouses);

      const result = await controller.findAllWarehouses('company-1', 'branch-1');

      expect(result).toEqual(warehouses);
    });
  });

  describe('findAllStocks', () => {
    it('deve retornar lista paginada de estoques', async () => {
      const response = { data: [mockStock], meta: { page: 1, total: 1 } };
      mockStockService.findAllStocks.mockResolvedValue(response);

      const result = await controller.findAllStocks('company-1', 'branch-1');

      expect(result).toEqual(response);
    });
  });

  describe('findOneStock', () => {
    it('deve retornar um estoque', async () => {
      mockStockService.findOneStock.mockResolvedValue(mockStock);

      const result = await controller.findOneStock('stock-1', mockCurrentUser);

      expect(result).toEqual(mockStock);
    });
  });

  describe('createStockMovement', () => {
    it('deve criar uma movimentação', async () => {
      const createDto = {
        productId: 'product-1',
        quantity: 10,
        type: 'IN' as any,
        branchId: 'branch-1',
        companyId: 'company-1',
      };
      mockStockService.createStockMovement.mockResolvedValue(mockMovement);

      const result = await controller.createStockMovement(createDto, mockCurrentUser);

      expect(result).toEqual(mockMovement);
    });
  });

  describe('findAllStockMovements', () => {
    it('deve retornar lista paginada de movimentações', async () => {
      const response = { data: [mockMovement], meta: { page: 1, total: 1 } };
      mockStockService.findAllStockMovements.mockResolvedValue(response);

      const result = await controller.findAllStockMovements();

      expect(result).toEqual(response);
    });

    it('deve filtrar por datas', async () => {
      mockStockService.findAllStockMovements.mockResolvedValue({ data: [], meta: {} });

      await controller.findAllStockMovements(
        undefined,
        undefined,
        undefined,
        '2024-01-01',
        '2024-12-31',
      );

      expect(stockService.findAllStockMovements).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        '2024-01-01',
        '2024-12-31',
        1,
        10,
      );
    });
  });

  describe('findOneStockMovement', () => {
    it('deve retornar uma movimentação', async () => {
      mockStockService.findOneStockMovement.mockResolvedValue(mockMovement);

      const result = await controller.findOneStockMovement('mov-1', mockCurrentUser);

      expect(result).toEqual(mockMovement);
    });
  });
});
