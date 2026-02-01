import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('ProductService', () => {
  let service: ProductService;
  let prisma: PrismaMock;

  const mockCompany = {
    id: 'company-123',
    name: 'Test Company',
    deletedAt: null,
  };

  const mockBranch = {
    id: 'branch-123',
    name: 'Test Branch',
    companyId: 'company-123',
    deletedAt: null,
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Óleo Motor 5W30',
    code: 'OIL-001',
    description: 'Óleo sintético para motor',
    unit: 'LT',
    unitOfMeasurementId: null,
    unitOfMeasurement: null,
    unitPrice: 50,
    minQuantity: 10,
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Filtro de Ar',
      code: 'FIL-001',
      branchId: 'branch-123',
      unitPrice: 35,
    };

    it('deve criar produto com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(null); // Código não existe
      prisma.product.create.mockResolvedValue({ ...mockProduct, ...createDto });

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(prisma.product.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto as any)).rejects.toThrow('Empresa não encontrada');
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto as any)).rejects.toThrow('Filial não encontrada');
    });

    it('deve lançar ConflictException quando código já existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.findFirst.mockResolvedValue(mockProduct);

      await expect(service.create(createDto as any)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto as any)).rejects.toThrow(
        'Código já cadastrado para esta empresa/filial',
      );
    });

    it('deve criar produto sem código', async () => {
      const dtoSemCodigo = { name: 'Produto sem código', branchId: 'branch-123' };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.product.create.mockResolvedValue({ ...mockProduct, code: null });

      const result = await service.create(dtoSemCodigo as any);

      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de produtos', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);
      prisma.stock.findMany.mockResolvedValue([]);

      const result = await service.findAll('branch-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('deve filtrar por filial', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);
      prisma.stock.findMany.mockResolvedValue([]);

      await service.findAll('branch-123');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-123',
          }),
        }),
      );
    });

    it('deve incluir estoque total nos produtos', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);
      prisma.stock.findMany.mockResolvedValue([
        { productId: 'product-123', branchId: 'branch-123', quantity: 50 },
      ]);

      const result = await service.findAll('branch-123');

      expect(result.data[0]?.totalStock).toBe(50);
    });

    it('deve aplicar paginação corretamente', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(50);
      prisma.stock.findMany.mockResolvedValue([]);

      const result = await service.findAll(undefined, false, 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('deve incluir deletados quando solicitado', async () => {
      prisma.product.findMany.mockResolvedValue([{ ...mockProduct, deletedAt: new Date() }]);
      prisma.product.count.mockResolvedValue(1);
      prisma.stock.findMany.mockResolvedValue([]);

      await service.findAll(undefined, true);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar produto por ID', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.stock.findMany.mockResolvedValue([]);

      const result = await service.findOne('product-123');

      expect(result.id).toBe(mockProduct.id);
      expect(result.name).toBe(mockProduct.name);
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Produto não encontrado');
    });

    it('deve incluir estoque total', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.stock.findMany.mockResolvedValue([{ quantity: 30 }, { quantity: 20 }]);

      const result = await service.findOne('product-123');

      expect(result.totalStock).toBe(50);
    });
  });

  describe('update', () => {
    it('deve atualizar produto com sucesso', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Nome Atualizado',
      });

      const result = await service.update('product-123', { name: 'Nome Atualizado' });

      expect(result.name).toBe('Nome Atualizado');
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve validar empresa ao atualizar companyId', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.update('product-123', { companyId: 'invalid-company' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('product-123', { companyId: 'invalid-company' })).rejects.toThrow(
        'Empresa não encontrada',
      );
    });

    it('deve validar filial ao atualizar branchId', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.update('product-123', { branchId: 'invalid-branch' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('product-123', { branchId: 'invalid-branch' })).rejects.toThrow(
        'Filial não encontrada',
      );
    });

    it('deve lançar ConflictException quando novo código já existe', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce(mockProduct) // Produto atual
        .mockResolvedValueOnce({ ...mockProduct, id: 'other-product' }); // Outro com mesmo código

      await expect(service.update('product-123', { code: 'EXISTING-CODE' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete do produto', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, deletedAt: new Date() });

      await service.remove('product-123');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando produto não existe', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Produto não encontrado');
    });
  });

  describe('findLowStock', () => {
    it('deve retornar produtos com estoque baixo', async () => {
      const productLowStock = {
        ...mockProduct,
        minQuantity: 20,
        stocks: [{ quantity: 5 }],
      };

      prisma.product.findMany.mockResolvedValue([productLowStock]);

      const result = await service.findLowStock('branch-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.totalStock).toBeLessThan(result[0]?.minQuantity || 0);
    });

    it('deve retornar lista vazia quando não há produtos com estoque baixo', async () => {
      const productOkStock = {
        ...mockProduct,
        minQuantity: 5,
        stocks: [{ quantity: 50 }],
      };

      prisma.product.findMany.mockResolvedValue([productOkStock]);

      const result = await service.findLowStock();

      expect(result).toHaveLength(0);
    });
  });

  describe('getProductSummary', () => {
    it('deve retornar resumo de uso de produtos', async () => {
      const mockOrderWithMaterials = {
        createdAt: new Date(),
        materials: [
          {
            productId: 'product-123',
            quantity: 5,
            totalCost: 250,
            product: {
              name: 'Óleo Motor',
              unit: 'LT',
              unitOfMeasurement: null,
            },
          },
        ],
      };

      prisma.maintenanceOrder.findMany.mockResolvedValue([mockOrderWithMaterials]);

      const result = await service.getProductSummary('branch-123');

      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('totalProducts');
      expect(result).toHaveProperty('products');
      expect(result.products.data).toHaveLength(1);
    });

    it('deve retornar valores zerados quando não há ordens', async () => {
      prisma.maintenanceOrder.findMany.mockResolvedValue([]);

      const result = await service.getProductSummary();

      expect(result.totalCost).toBe(0);
      expect(result.totalProducts).toBe(0);
    });

    it('deve filtrar por período de datas', async () => {
      prisma.maintenanceOrder.findMany.mockResolvedValue([]);

      await service.getProductSummary(undefined, '2024-01-01', '2024-01-31');

      expect(prisma.maintenanceOrder.findMany).toHaveBeenCalledWith(
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
  });
});
