import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: ProductService;

  const mockProductService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findLowStock: jest.fn(),
    getProductSummary: jest.fn(),
  };

  const mockProduct = {
    id: 'product-1',
    name: 'Óleo Motor',
    code: 'OL001',
    branchId: 'branch-1',
  };

  const mockCurrentUser = { sub: 'admin-1', branchId: 'branch-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: mockProductService }],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um produto', async () => {
      const createDto = {
        name: 'Óleo',
        code: 'OL001',
        branchId: 'branch-1',
        companyId: 'company-1',
      };
      mockProductService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockProduct);
      expect(productService.create).toHaveBeenCalledWith(createDto, 'admin-1', mockCurrentUser);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const response = { data: [mockProduct], meta: { page: 1, limit: 50, total: 1 } };
      mockProductService.findAll.mockResolvedValue(response);

      const result = await controller.findAll('branch-1', 'false', '1', '50');

      expect(result).toEqual(response);
    });
  });

  describe('findLowStock', () => {
    it('deve retornar produtos com estoque baixo', async () => {
      mockProductService.findLowStock.mockResolvedValue([mockProduct]);

      const result = await controller.findLowStock('branch-1');

      expect(result).toEqual([mockProduct]);
    });
  });

  describe('getSummary', () => {
    it('deve retornar resumo de produtos', async () => {
      const summary = { totalProducts: 10, totalValue: 5000 };
      mockProductService.getProductSummary.mockResolvedValue(summary);

      const result = await controller.getSummary('branch-1', undefined, undefined, '1', '15');

      expect(result).toEqual(summary);
    });
  });

  describe('findOne', () => {
    it('deve retornar um produto', async () => {
      mockProductService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('product-1', mockCurrentUser);

      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('deve atualizar um produto', async () => {
      const updateDto = { name: 'Óleo Atualizado' };
      mockProductService.update.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await controller.update('product-1', updateDto, mockCurrentUser);

      expect(result.name).toBe('Óleo Atualizado');
    });
  });

  describe('remove', () => {
    it('deve remover um produto', async () => {
      mockProductService.remove.mockResolvedValue(undefined);

      await controller.remove('product-1', mockCurrentUser);

      expect(productService.remove).toHaveBeenCalledWith('product-1', mockCurrentUser);
    });
  });
});
