import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('SalaryService', () => {
  let service: SalaryService;
  let prisma: PrismaMock;

  // Mock de data atual para testes de validação de período
  const mockCurrentDate = new Date(2024, 0, 15); // Janeiro 2024

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

  const mockEmployee = {
    id: 'employee-123',
    name: 'João Silva',
    companyId: 'company-123',
    branchId: 'branch-123',
    monthlySalary: 5000,
    active: true,
    deletedAt: null,
  };

  const mockSalary = {
    id: 'salary-123',
    employeeId: 'employee-123',
    amount: 5000,
    referenceMonth: 1,
    referenceYear: 2024,
    paymentDate: null,
    description: 'Salário Janeiro',
    companyId: 'company-123',
    branchId: 'branch-123',
    financialTransactionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
    employee: { name: 'João Silva' },
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SalaryService>(SalaryService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;

    // Mock de Date para controlar o "agora"
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('create', () => {
    const createDto = {
      employeeId: 'employee-123',
      referenceMonth: 1,
      referenceYear: 2024,
      branchId: 'branch-123',
    };

    it('deve criar salário com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.salary.findFirst.mockResolvedValue(null); // Não existe duplicado
      prisma.salary.create.mockResolvedValue(mockSalary);

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.amount).toBe(5000);
      expect(prisma.salary.create).toHaveBeenCalled();
    });

    it('deve usar salário do funcionário como padrão', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.salary.findFirst.mockResolvedValue(null);
      prisma.salary.create.mockResolvedValue(mockSalary);

      await service.create(createDto as any);

      expect(prisma.salary.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: expect.any(Object), // Prisma.Decimal
          }),
        }),
      );
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

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto as any)).rejects.toThrow('Funcionário não encontrado');
    });

    it('deve lançar ConflictException quando já existe salário para o período', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.salary.findFirst.mockResolvedValue(mockSalary);

      await expect(service.create(createDto as any)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto as any)).rejects.toThrow(
        /Já existe salário cadastrado/,
      );
    });

    it('deve lançar BadRequestException para mês futuro', async () => {
      const dtoPeriodoFuturo = {
        ...createDto,
        referenceMonth: 3, // Março (futuro em relação a Janeiro)
        referenceYear: 2024,
      };

      await expect(service.create(dtoPeriodoFuturo as any)).rejects.toThrow(BadRequestException);
      await expect(service.create(dtoPeriodoFuturo as any)).rejects.toThrow(/meses futuros/);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de salários', async () => {
      prisma.salary.findMany.mockResolvedValue([mockSalary]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]?.employeeId).toBe('employee-123');
    });

    it('deve filtrar por funcionário', async () => {
      prisma.salary.findMany.mockResolvedValue([mockSalary]);

      await service.findAll(undefined, undefined, 'employee-123');

      expect(prisma.salary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId: 'employee-123',
          }),
        }),
      );
    });

    it('deve filtrar por mês/ano de referência', async () => {
      prisma.salary.findMany.mockResolvedValue([mockSalary]);

      await service.findAll(undefined, undefined, undefined, 1, 2024);

      expect(prisma.salary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            referenceMonth: 1,
            referenceYear: 2024,
          }),
        }),
      );
    });

    it('deve ordenar por ano/mês de referência decrescente', async () => {
      prisma.salary.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.salary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([{ referenceYear: 'desc' }, { referenceMonth: 'desc' }]),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar salário por ID', async () => {
      prisma.salary.findFirst.mockResolvedValue(mockSalary);

      const result = await service.findOne('salary-123');

      expect(result.id).toBe(mockSalary.id);
      expect(result.amount).toBe(mockSalary.amount);
    });

    it('deve lançar NotFoundException quando salário não existe', async () => {
      prisma.salary.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Salário não encontrado');
    });
  });

  describe('update', () => {
    it('deve atualizar salário com sucesso', async () => {
      prisma.salary.findFirst.mockResolvedValue(mockSalary);
      prisma.salary.update.mockResolvedValue({
        ...mockSalary,
        amount: 6000,
      });

      const result = await service.update('salary-123', { amount: 6000 });

      expect(result.amount).toBe(6000);
    });

    it('deve lançar NotFoundException quando salário não existe', async () => {
      prisma.salary.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando salário já foi pago', async () => {
      prisma.salary.findFirst.mockResolvedValue({
        ...mockSalary,
        financialTransactionId: 'ft-123',
      });

      await expect(service.update('salary-123', { amount: 6000 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('salary-123', { amount: 6000 })).rejects.toThrow(
        'Não é possível editar salário que já foi pago',
      );
    });

    it('deve validar funcionário ao atualizar employeeId', async () => {
      prisma.salary.findFirst.mockResolvedValue(mockSalary);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.update('salary-123', { employeeId: 'invalid-employee' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando novo período já existe', async () => {
      prisma.salary.findFirst
        .mockResolvedValueOnce(mockSalary) // Salário atual
        .mockResolvedValueOnce({ ...mockSalary, id: 'other-salary' }); // Outro no mesmo período

      await expect(service.update('salary-123', { referenceMonth: 2 })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('pay', () => {
    it('deve pagar salário com sucesso', async () => {
      prisma.salary.findFirst.mockResolvedValue(mockSalary);
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          financialTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'ft-123' }),
          },
          salary: {
            update: jest.fn().mockResolvedValue({
              ...mockSalary,
              paymentDate: new Date(),
              financialTransactionId: 'ft-123',
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.pay('salary-123', {});

      expect(result.financialTransactionId).toBe('ft-123');
    });

    it('deve lançar NotFoundException quando salário não existe', async () => {
      prisma.salary.findFirst.mockResolvedValue(null);

      await expect(service.pay('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando salário já foi pago', async () => {
      prisma.salary.findFirst.mockResolvedValue({
        ...mockSalary,
        financialTransactionId: 'ft-123',
      });

      await expect(service.pay('salary-123', {})).rejects.toThrow(BadRequestException);
      await expect(service.pay('salary-123', {})).rejects.toThrow('Salário já foi pago');
    });

    it('deve usar data de pagamento fornecida', async () => {
      const paymentDate = '2024-01-15';
      prisma.salary.findFirst.mockResolvedValue(mockSalary);
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          financialTransaction: { create: jest.fn().mockResolvedValue({ id: 'ft-123' }) },
          salary: {
            update: jest.fn().mockResolvedValue({
              ...mockSalary,
              paymentDate: new Date(paymentDate),
              financialTransactionId: 'ft-123',
            }),
          },
        };
        return callback(tx);
      });

      await service.pay('salary-123', { paymentDate });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete do salário', async () => {
      prisma.salary.findFirst.mockResolvedValue(mockSalary);
      prisma.salary.update.mockResolvedValue({ ...mockSalary, deletedAt: new Date() });

      await service.remove('salary-123');

      expect(prisma.salary.update).toHaveBeenCalledWith({
        where: { id: 'salary-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando salário não existe', async () => {
      prisma.salary.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Salário não encontrado');
    });

    it('deve lançar BadRequestException quando salário já foi pago', async () => {
      prisma.salary.findFirst.mockResolvedValue({
        ...mockSalary,
        financialTransactionId: 'ft-123',
      });

      await expect(service.remove('salary-123')).rejects.toThrow(BadRequestException);
      await expect(service.remove('salary-123')).rejects.toThrow(
        'Não é possível excluir salário que já foi pago',
      );
    });
  });

  describe('processSalaries', () => {
    const processDto = {
      branchId: 'branch-123',
      referenceMonth: 1,
      referenceYear: 2024,
    };

    it('deve processar salários para todos funcionários', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.salary.findMany.mockResolvedValue([]); // Nenhum salário existente
      prisma.salary.create.mockResolvedValue(mockSalary);

      const result = await service.processSalaries(processDto as any);

      expect(result.totalEmployees).toBe(1);
      expect(result.created).toBe(1);
      expect(result.details).toHaveLength(1);
      expect(result.details[0]?.status).toBe('created');
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.processSalaries(processDto as any)).rejects.toThrow(NotFoundException);
      await expect(service.processSalaries(processDto as any)).rejects.toThrow(
        'Filial não encontrada',
      );
    });

    it('deve identificar salários já pendentes', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.salary.findMany.mockResolvedValue([mockSalary]); // Já existe pendente

      const result = await service.processSalaries(processDto as any);

      expect(result.alreadyPending).toBe(1);
      expect(result.details[0]?.status).toBe('already_pending');
    });

    it('deve identificar salários já pagos', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.salary.findMany.mockResolvedValue([
        {
          ...mockSalary,
          financialTransactionId: 'ft-123',
          paymentDate: new Date(),
        },
      ]);

      const result = await service.processSalaries(processDto as any);

      expect(result.alreadyPaid).toBe(1);
      expect(result.details[0]?.status).toBe('already_paid');
    });

    it('deve pular funcionários sem salário base definido', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([{ ...mockEmployee, monthlySalary: 0 }]);
      prisma.salary.findMany.mockResolvedValue([]);

      const result = await service.processSalaries(processDto as any);

      expect(result.skippedNoSalary).toBe(1);
      expect(result.details[0]?.status).toBe('skipped_no_salary');
    });

    it('deve lançar BadRequestException para mês futuro', async () => {
      const dtoPeriodoFuturo = {
        ...processDto,
        referenceMonth: 3, // Março (futuro)
        referenceYear: 2024,
      };

      await expect(service.processSalaries(dtoPeriodoFuturo as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException para período muito antigo', async () => {
      const dtoPeriodoAntigo = {
        ...processDto,
        referenceMonth: 10, // Outubro do ano anterior (mais de 1 mês atrás)
        referenceYear: 2023,
      };

      await expect(service.processSalaries(dtoPeriodoAntigo as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processSalaries(dtoPeriodoAntigo as any)).rejects.toThrow(
        /Período fora do limite permitido/,
      );
    });
  });
});
