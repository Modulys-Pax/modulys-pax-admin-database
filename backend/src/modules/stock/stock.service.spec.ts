import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AccountPayableService } from '../account-payable/account-payable.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('StockService', () => {
  let service: StockService;
  let prisma: PrismaMock;

  const mockWarehouse = {
    id: 'warehouse-123',
    code: 'ALM-001',
    name: 'Almoxarifado Principal',
    description: 'Almoxarifado padrão',
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBranch = {
    id: 'branch-123',
    name: 'Test Branch',
    companyId: 'company-123',
    active: true,
    deletedAt: null,
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    code: 'PRD-001',
    companyId: 'company-123',
    branchId: 'branch-123',
    unitPrice: 100,
    active: true,
    deletedAt: null,
  };

  const mockStock = {
    id: 'stock-123',
    productId: 'product-123',
    warehouseId: 'warehouse-123',
    companyId: 'company-123',
    branchId: 'branch-123',
    quantity: 50,
    averageCost: 100,
    product: mockProduct,
    warehouse: mockWarehouse,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStockMovement = {
    id: 'movement-123',
    type: 'ENTRY',
    productId: 'product-123',
    quantity: 10,
    unitCost: 100,
    totalCost: 1000,
    companyId: 'company-123',
    branchId: 'branch-123',
    stockId: 'stock-123',
    createdAt: new Date(),
    product: mockProduct,
    Stock: mockStock,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const mockAccountPayableService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AccountPayableService,
          useValue: mockAccountPayableService,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompanyDefaultWarehouse', () => {
    it('deve retornar almoxarifado existente', async () => {
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);

      const result = await service.getCompanyDefaultWarehouse('company-123');

      expect(result.id).toBe(mockWarehouse.id);
      expect(result.code).toBe('ALM-001');
    });

    it('deve criar almoxarifado quando não existe', async () => {
      prisma.warehouse.findFirst
        .mockResolvedValueOnce(null) // getCompanyDefaultWarehouse
        .mockResolvedValueOnce(null); // ensureDefaultWarehouse
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.warehouse.create.mockResolvedValue(mockWarehouse);

      const result = await service.getCompanyDefaultWarehouse('company-123');

      expect(result.id).toBe(mockWarehouse.id);
      expect(prisma.warehouse.create).toHaveBeenCalled();
    });
  });

  describe('findAllWarehouses', () => {
    it('deve retornar lista de almoxarifados', async () => {
      prisma.warehouse.findMany.mockResolvedValue([mockWarehouse]);

      const result = await service.findAllWarehouses('company-123', 'branch-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockWarehouse.id);
    });

    it('deve criar almoxarifado quando lista está vazia', async () => {
      prisma.warehouse.findMany.mockResolvedValue([]);
      prisma.warehouse.findFirst.mockResolvedValue(null);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.warehouse.create.mockResolvedValue(mockWarehouse);

      const result = await service.findAllWarehouses('company-123');

      expect(result).toHaveLength(1);
      expect(prisma.warehouse.create).toHaveBeenCalled();
    });
  });

  describe('findAllStocks', () => {
    it('deve retornar lista paginada de estoques', async () => {
      prisma.stock.findMany.mockResolvedValue([mockStock]);
      prisma.stock.count.mockResolvedValue(1);

      const result = await service.findAllStocks('company-123', 'branch-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('deve filtrar por produto', async () => {
      prisma.stock.findMany.mockResolvedValue([mockStock]);
      prisma.stock.count.mockResolvedValue(1);

      await service.findAllStocks('company-123', undefined, undefined, 'product-123');

      expect(prisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productId: 'product-123',
          }),
        }),
      );
    });

    it('deve aplicar paginação corretamente', async () => {
      prisma.stock.findMany.mockResolvedValue([]);
      prisma.stock.count.mockResolvedValue(30);

      const result = await service.findAllStocks(
        'company-123',
        undefined,
        undefined,
        undefined,
        2,
        10,
      );

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(prisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findAllStockMovements', () => {
    it('deve retornar lista paginada de movimentações', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([mockStockMovement]);
      prisma.stockMovement.count.mockResolvedValue(1);

      const result = await service.findAllStockMovements('company-123', 'branch-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('deve filtrar por produto', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([mockStockMovement]);
      prisma.stockMovement.count.mockResolvedValue(1);

      await service.findAllStockMovements('company-123', 'branch-123', 'product-123');

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: 'company-123',
            branchId: 'branch-123',
            productId: 'product-123',
          }),
        }),
      );
    });

    it('deve filtrar por período de datas', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      await service.findAllStockMovements(
        'company-123',
        undefined,
        undefined,
        '2024-01-01',
        '2024-01-31',
      );

      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('deve retornar lista vazia quando não há movimentações', async () => {
      prisma.stockMovement.findMany.mockResolvedValue([]);
      prisma.stockMovement.count.mockResolvedValue(0);

      const result = await service.findAllStockMovements('company-123');

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOneStock', () => {
    it('deve retornar estoque por ID', async () => {
      prisma.stock.findUnique.mockResolvedValue(mockStock);

      const result = await service.findOneStock('stock-123');

      expect(result.id).toBe(mockStock.id);
      expect(prisma.stock.findUnique).toHaveBeenCalledWith({
        where: { id: 'stock-123' },
        include: { product: true, warehouse: true },
      });
    });

    it('deve lançar NotFoundException quando estoque não existe', async () => {
      prisma.stock.findUnique.mockResolvedValue(null);

      await expect(service.findOneStock('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOneStock('invalid-id')).rejects.toThrow('Estoque não encontrado');
    });
  });

  describe('findStockByProductAndWarehouse', () => {
    it('deve retornar estoque quando existe', async () => {
      prisma.stock.findUnique.mockResolvedValue(mockStock);

      const result = await service.findStockByProductAndWarehouse('product-123', 'warehouse-123');

      expect(result).not.toBeNull();
      expect(result?.productId).toBe('product-123');
    });

    it('deve retornar null quando não existe', async () => {
      prisma.stock.findUnique.mockResolvedValue(null);

      const result = await service.findStockByProductAndWarehouse('invalid', 'invalid');

      expect(result).toBeNull();
    });
  });

  describe('ensureDefaultWarehouse - edge cases', () => {
    it('deve lançar erro quando não há filiais', async () => {
      prisma.warehouse.findMany.mockResolvedValue([]);
      prisma.warehouse.findFirst.mockResolvedValue(null);
      prisma.branch.findFirst.mockResolvedValue(null);

      // Chama um método que internamente usa ensureDefaultWarehouse
      await expect(service.findAllWarehouses('company-without-branches')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllStocks - edge cases', () => {
    it('deve filtrar por warehouse', async () => {
      prisma.stock.findMany.mockResolvedValue([mockStock]);
      prisma.stock.count.mockResolvedValue(1);

      await service.findAllStocks('company-123', undefined, 'warehouse-123');

      expect(prisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            warehouseId: 'warehouse-123',
          }),
        }),
      );
    });

    it('deve retornar dados do estoque com propriedades esperadas', async () => {
      prisma.stock.findMany.mockResolvedValue([mockStock]);
      prisma.stock.count.mockResolvedValue(1);

      const result = await service.findAllStocks('company-123');

      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('quantity');
      expect(result.data[0]).toHaveProperty('averageCost');
      expect(result.data[0]).toHaveProperty('productId');
      expect(result.data[0]).toHaveProperty('warehouseId');
    });

    it('deve calcular totalPages corretamente', async () => {
      prisma.stock.findMany.mockResolvedValue([]);
      prisma.stock.count.mockResolvedValue(25);

      const result = await service.findAllStocks(
        'company-123',
        undefined,
        undefined,
        undefined,
        1,
        10,
      );

      expect(result.totalPages).toBe(3); // 25 / 10 = 2.5 -> 3
    });
  });

  describe('createStockMovement', () => {
    const mockCompany = {
      id: 'company-123',
      name: 'Test Company',
      deletedAt: null,
    };

    const createEntryDto = {
      productId: 'product-123',
      branchId: 'branch-123',
      quantity: 10,
      unitCost: 100,
      type: 'ENTRY',
      documentNumber: 'NF-001',
      notes: 'Entrada de estoque',
    };

    const createExitDto = {
      productId: 'product-123',
      branchId: 'branch-123',
      quantity: 5,
      type: 'EXIT',
      notes: 'Saída de estoque',
    };

    it('deve criar movimentação de entrada com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
      prisma.stockMovement.create.mockResolvedValue(mockStockMovement);
      prisma.stock.findUnique.mockResolvedValue(mockStock);
      prisma.stock.update.mockResolvedValue(mockStock);

      const result = await service.createStockMovement(createEntryDto as any, 'user-123');

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('ENTRY');
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.createStockMovement(createEntryDto as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createStockMovement(createEntryDto as any)).rejects.toThrow(
        'Empresa não encontrada',
      );
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.createStockMovement(createEntryDto as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createStockMovement(createEntryDto as any)).rejects.toThrow(
        'Filial não encontrada',
      );
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.createStockMovement(createEntryDto as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createStockMovement(createEntryDto as any)).rejects.toThrow(
        'Produto não encontrado',
      );
    });

    it('deve lançar BadRequestException quando entrada não tem custo unitário', async () => {
      const dtoWithoutCost = { ...createEntryDto, unitCost: undefined };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);

      await expect(service.createStockMovement(dtoWithoutCost as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createStockMovement(dtoWithoutCost as any)).rejects.toThrow(
        'Custo unitário é obrigatório para entrada',
      );
    });

    it('deve lançar BadRequestException quando saída tem estoque insuficiente', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.stock.findUnique.mockResolvedValue({
        ...mockStock,
        quantity: 2, // Estoque menor que o solicitado
      });

      await expect(service.createStockMovement(createExitDto as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createStockMovement(createExitDto as any)).rejects.toThrow(
        /Estoque insuficiente/,
      );
    });

    it('deve lançar BadRequestException quando saída não tem estoque', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.stock.findUnique.mockResolvedValue(null);

      await expect(service.createStockMovement(createExitDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve permitir entrada com custo zero', async () => {
      const dtoWithZeroCost = { ...createEntryDto, unitCost: 0 };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
      prisma.stockMovement.create.mockResolvedValue({
        ...mockStockMovement,
        unitCost: 0,
        totalCost: 0,
      });
      prisma.stock.findUnique.mockResolvedValue(null);
      prisma.stock.create.mockResolvedValue(mockStock);

      const result = await service.createStockMovement(dtoWithZeroCost as any);

      expect(result).toHaveProperty('id');
    });

    it('deve validar ordem de manutenção quando informada', async () => {
      const dtoWithMaintenance = {
        ...createExitDto,
        maintenanceOrderId: 'invalid-mo',
      };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.stock.findUnique.mockResolvedValue(mockStock);
      prisma.maintenanceOrder.findFirst.mockResolvedValue(null);

      await expect(service.createStockMovement(dtoWithMaintenance as any)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createStockMovement(dtoWithMaintenance as any)).rejects.toThrow(
        'Ordem de manutenção não encontrada',
      );
    });

    it('deve criar saída com sucesso quando tem estoque suficiente', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      prisma.stock.findUnique.mockResolvedValue(mockStock); // 50 unidades
      prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
      prisma.stockMovement.create.mockResolvedValue({
        ...mockStockMovement,
        type: 'EXIT',
        quantity: 5,
      });
      prisma.stock.update.mockResolvedValue({
        ...mockStock,
        quantity: 45,
      });

      const result = await service.createStockMovement(createExitDto as any);

      expect(result.type).toBe('EXIT');
    });
  });

  describe('findOneStockMovement', () => {
    it('deve retornar movimentação por ID', async () => {
      prisma.stockMovement.findUnique.mockResolvedValue(mockStockMovement);

      const result = await service.findOneStockMovement('movement-123');

      expect(result.id).toBe(mockStockMovement.id);
      expect(result.type).toBe('ENTRY');
    });

    it('deve lançar NotFoundException quando movimentação não existe', async () => {
      prisma.stockMovement.findUnique.mockResolvedValue(null);

      await expect(service.findOneStockMovement('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOneStockMovement('invalid-id')).rejects.toThrow(
        'Movimentação não encontrada',
      );
    });
  });
});
