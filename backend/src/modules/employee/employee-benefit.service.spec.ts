import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeeBenefitService } from './employee-benefit.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('EmployeeBenefitService', () => {
  let service: EmployeeBenefitService;
  let prisma: PrismaMock;

  const mockEmployee = {
    id: 'employee-123',
    name: 'João Silva',
    companyId: 'company-123',
    branchId: 'branch-123',
    deletedAt: null,
  };

  const mockBenefit = {
    id: 'benefit-123',
    name: 'Vale Refeição',
    dailyCost: 30,
    employeeValue: 5,
    includeWeekends: false,
    description: 'Vale para alimentação',
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    deletedAt: null,
  };

  const mockEmployeeBenefit = {
    id: 'eb-123',
    employeeId: 'employee-123',
    benefitId: 'benefit-123',
    active: true,
    startDate: new Date('2024-01-01'),
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
    benefit: mockBenefit,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeBenefitService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<EmployeeBenefitService>(EmployeeBenefitService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      employeeId: 'employee-123',
      benefitId: 'benefit-123',
      branchId: 'branch-123',
      companyId: 'company-123',
    };

    it('deve criar vínculo funcionário-benefício com sucesso', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.employeeBenefit.findFirst.mockResolvedValue(null); // Não existe duplicado
      prisma.employeeBenefit.create.mockResolvedValue(mockEmployeeBenefit);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(result.employeeId).toBe(createDto.employeeId);
      expect(result.benefitId).toBe(createDto.benefitId);
    });

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Funcionário não encontrado');
    });

    it('deve lançar NotFoundException quando benefício não existe', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.benefit.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Benefício não encontrado ou inativo',
      );
    });

    it('deve lançar ConflictException quando funcionário já tem benefício ativo', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.employeeBenefit.findFirst.mockResolvedValue(mockEmployeeBenefit);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Funcionário já possui este benefício ativo',
      );
    });

    it('deve criar com data de início', async () => {
      const dtoWithDate = { ...createDto, startDate: '2024-02-01' };

      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.employeeBenefit.findFirst.mockResolvedValue(null);
      prisma.employeeBenefit.create.mockResolvedValue({
        ...mockEmployeeBenefit,
        startDate: new Date('2024-02-01'),
      });

      const result = await service.create(dtoWithDate);

      expect(result.startDate).toBeDefined();
    });

    it('deve criar inativo quando especificado', async () => {
      const dtoInativo = { ...createDto, active: false };

      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.benefit.findFirst.mockResolvedValue(mockBenefit);
      prisma.employeeBenefit.findFirst.mockResolvedValue(null);
      prisma.employeeBenefit.create.mockResolvedValue({
        ...mockEmployeeBenefit,
        active: false,
      });

      const result = await service.create(dtoInativo);

      expect(result.active).toBe(false);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de benefícios do funcionário', async () => {
      prisma.employeeBenefit.findMany.mockResolvedValue([mockEmployeeBenefit]);

      const result = await service.findAll('employee-123');

      expect(result).toHaveLength(1);
      expect(result[0]?.employeeId).toBe('employee-123');
    });

    it('deve filtrar por filial', async () => {
      prisma.employeeBenefit.findMany.mockResolvedValue([mockEmployeeBenefit]);

      await service.findAll(undefined, 'branch-123');

      expect(prisma.employeeBenefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-123',
          }),
        }),
      );
    });

    it('deve filtrar por status ativo', async () => {
      prisma.employeeBenefit.findMany.mockResolvedValue([mockEmployeeBenefit]);

      await service.findAll(undefined, undefined, true);

      expect(prisma.employeeBenefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            active: true,
          }),
        }),
      );
    });

    it('deve ordenar por data de criação decrescente', async () => {
      prisma.employeeBenefit.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.employeeBenefit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('deve incluir dados do benefício', async () => {
      prisma.employeeBenefit.findMany.mockResolvedValue([mockEmployeeBenefit]);

      const result = await service.findAll();

      expect(result[0]?.benefit).toBeDefined();
      expect(result[0]?.benefit.name).toBe('Vale Refeição');
    });
  });

  describe('findOne', () => {
    it('deve retornar vínculo por ID', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(mockEmployeeBenefit);

      const result = await service.findOne('eb-123');

      expect(result.id).toBe(mockEmployeeBenefit.id);
      expect(result.benefit.name).toBe('Vale Refeição');
    });

    it('deve lançar NotFoundException quando vínculo não existe', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Benefício não encontrado');
    });
  });

  describe('update', () => {
    it('deve atualizar vínculo com sucesso', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(mockEmployeeBenefit);
      prisma.employeeBenefit.update.mockResolvedValue({
        ...mockEmployeeBenefit,
        active: false,
      });

      const result = await service.update('eb-123', { active: false });

      expect(result.active).toBe(false);
    });

    it('deve lançar NotFoundException quando vínculo não existe', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve validar novo benefício ao alterar benefitId', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(mockEmployeeBenefit);
      prisma.benefit.findFirst.mockResolvedValue(null);

      await expect(service.update('eb-123', { benefitId: 'invalid-benefit' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('eb-123', { benefitId: 'invalid-benefit' })).rejects.toThrow(
        'Benefício não encontrado ou inativo',
      );
    });

    it('deve atualizar data de início', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(mockEmployeeBenefit);
      prisma.employeeBenefit.update.mockResolvedValue({
        ...mockEmployeeBenefit,
        startDate: new Date('2024-03-01'),
      });

      const result = await service.update('eb-123', { startDate: '2024-03-01' });

      expect(result.startDate).toBeDefined();
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete do vínculo', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(mockEmployeeBenefit);
      prisma.employeeBenefit.update.mockResolvedValue({
        ...mockEmployeeBenefit,
        deletedAt: new Date(),
      });

      await service.remove('eb-123');

      expect(prisma.employeeBenefit.update).toHaveBeenCalledWith({
        where: { id: 'eb-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando vínculo não existe', async () => {
      prisma.employeeBenefit.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Benefício não encontrado');
    });
  });
});
