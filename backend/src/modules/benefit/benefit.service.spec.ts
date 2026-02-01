import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BenefitService } from './benefit.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('BenefitService', () => {
  let service: BenefitService;
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

  const mockBenefit = {
    id: 'benefit-123',
    name: 'Vale Refeição',
    dailyCost: 30,
    employeeValue: 5,
    includeWeekends: false,
    description: 'Vale para alimentação',
    active: true,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BenefitService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<BenefitService>(BenefitService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Vale Transporte',
      dailyCost: 15,
      employeeValue: 3,
      branchId: 'branch-123',
    };

    it('deve criar benefício com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.benefit.create.mockResolvedValue({ ...mockBenefit, ...createDto });

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(prisma.benefit.create).toHaveBeenCalled();
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

    it('deve criar benefício com includeWeekends', async () => {
      const dtoComWeekends = { ...createDto, includeWeekends: true };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.benefit.create.mockResolvedValue({
        ...mockBenefit,
        ...dtoComWeekends,
        includeWeekends: true,
      });

      const result = await service.create(dtoComWeekends as any);

      expect(result.includeWeekends).toBe(true);
    });

    it('deve criar benefício inativo quando especificado', async () => {
      const dtoInativo = { ...createDto, active: false };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.benefit.create.mockResolvedValue({ ...mockBenefit, active: false });

      const result = await service.create(dtoInativo as any);

      expect(result.active).toBe(false);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de benefícios', async () => {
      prisma.benefit.findMany.mockResolvedValue([mockBenefit]);
      prisma.benefit.count.mockResolvedValue(1);

      const result = await service.findAll('branch-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('deve filtrar por filial', async () => {
      prisma.benefit.findMany.mockResolvedValue([mockBenefit]);
      prisma.benefit.count.mockResolvedValue(1);

      await service.findAll('branch-123');

      expect(prisma.benefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-123',
          }),
        }),
      );
    });

    it('deve filtrar por status ativo', async () => {
      prisma.benefit.findMany.mockResolvedValue([mockBenefit]);
      prisma.benefit.count.mockResolvedValue(1);

      await service.findAll(undefined, true);

      expect(prisma.benefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
          }),
        }),
      );
    });

    it('deve aplicar paginação corretamente', async () => {
      prisma.benefit.findMany.mockResolvedValue([]);
      prisma.benefit.count.mockResolvedValue(50);

      const result = await service.findAll(undefined, undefined, 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(prisma.benefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('deve ordenar por nome ascendente', async () => {
      prisma.benefit.findMany.mockResolvedValue([mockBenefit]);
      prisma.benefit.count.mockResolvedValue(1);

      await service.findAll();

      expect(prisma.benefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar benefício por ID', async () => {
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);

      const result = await service.findOne('benefit-123');

      expect(result.id).toBe(mockBenefit.id);
      expect(result.name).toBe(mockBenefit.name);
    });

    it('deve lançar NotFoundException quando benefício não existe', async () => {
      prisma.benefit.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Benefício não encontrado');
    });
  });

  describe('update', () => {
    it('deve atualizar benefício com sucesso', async () => {
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.benefit.update.mockResolvedValue({
        ...mockBenefit,
        dailyCost: 40,
      });

      const result = await service.update('benefit-123', { dailyCost: 40 });

      expect(result.dailyCost).toBe(40);
    });

    it('deve lançar NotFoundException quando benefício não existe', async () => {
      prisma.benefit.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve atualizar valor do funcionário', async () => {
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.benefit.update.mockResolvedValue({
        ...mockBenefit,
        employeeValue: 10,
      });

      const result = await service.update('benefit-123', { employeeValue: 10 });

      expect(result.employeeValue).toBe(10);
    });

    it('deve atualizar descrição', async () => {
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.benefit.update.mockResolvedValue({
        ...mockBenefit,
        description: 'Nova descrição',
      });

      const result = await service.update('benefit-123', { description: 'Nova descrição' });

      expect(result.description).toBe('Nova descrição');
    });

    it('deve desativar benefício', async () => {
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.benefit.update.mockResolvedValue({
        ...mockBenefit,
        active: false,
      });

      const result = await service.update('benefit-123', { active: false });

      expect(result.active).toBe(false);
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete do benefício', async () => {
      prisma.benefit.findFirst.mockResolvedValue({
        ...mockBenefit,
        employeeBenefits: [],
      });
      prisma.benefit.update.mockResolvedValue({ ...mockBenefit, deletedAt: new Date() });

      await service.remove('benefit-123');

      expect(prisma.benefit.update).toHaveBeenCalledWith({
        where: { id: 'benefit-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando benefício não existe', async () => {
      prisma.benefit.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Benefício não encontrado');
    });

    it('deve lançar ConflictException quando benefício está em uso', async () => {
      prisma.benefit.findFirst.mockResolvedValue({
        ...mockBenefit,
        employeeBenefits: [{ id: 'eb-123' }], // Tem funcionário usando
      });

      await expect(service.remove('benefit-123')).rejects.toThrow(ConflictException);
      await expect(service.remove('benefit-123')).rejects.toThrow(
        /Não é possível excluir um benefício que está sendo usado/,
      );
    });
  });
});
