import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('ExpenseService', () => {
  let service: ExpenseService;
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

  const mockEmployee = {
    id: 'employee-123',
    name: 'João Silva',
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    deletedAt: null,
  };

  const mockExpense = {
    id: 'expense-123',
    employeeId: 'employee-123',
    type: 'TRAVEL',
    amount: 500,
    description: 'Viagem para cliente',
    expenseDate: new Date('2024-01-15'),
    documentNumber: 'NF-001',
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
        ExpenseService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ExpenseService>(ExpenseService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      type: 'TRAVEL',
      amount: 500,
      description: 'Viagem para cliente',
      expenseDate: '2024-01-15',
      branchId: 'branch-123',
    };

    it('deve criar despesa com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          expense: {
            create: jest.fn().mockResolvedValue(mockExpense),
            update: jest.fn().mockResolvedValue({
              ...mockExpense,
              financialTransactionId: 'ft-123',
            }),
          },
          financialTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'ft-123' }),
          },
        };
        return callback(tx);
      });

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.amount).toBe(500);
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

    it('deve validar funcionário quando informado', async () => {
      const dtoWithEmployee = { ...createDto, employeeId: 'invalid-employee' };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.create(dtoWithEmployee as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(dtoWithEmployee as any)).rejects.toThrow(
        'Funcionário não encontrado',
      );
    });

    it('deve criar despesa com funcionário vinculado', async () => {
      const dtoWithEmployee = { ...createDto, employeeId: 'employee-123' };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          expense: {
            create: jest.fn().mockResolvedValue(mockExpense),
            update: jest.fn().mockResolvedValue(mockExpense),
          },
          financialTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'ft-123' }),
          },
        };
        return callback(tx);
      });

      const result = await service.create(dtoWithEmployee as any);

      expect(result.employeeId).toBe('employee-123');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de despesas', async () => {
      prisma.expense.findMany.mockResolvedValue([mockExpense]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('TRAVEL');
    });

    it('deve filtrar por funcionário', async () => {
      prisma.expense.findMany.mockResolvedValue([mockExpense]);

      await service.findAll(undefined, undefined, 'employee-123');

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId: 'employee-123',
          }),
        }),
      );
    });

    it('deve filtrar por tipo', async () => {
      prisma.expense.findMany.mockResolvedValue([mockExpense]);

      await service.findAll(undefined, undefined, undefined, 'TRAVEL');

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'TRAVEL',
          }),
        }),
      );
    });

    it('deve filtrar por período de datas', async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      await service.findAll(undefined, undefined, undefined, undefined, '2024-01-01', '2024-01-31');

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expenseDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('deve ordenar por data de despesa decrescente', async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { expenseDate: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar despesa por ID', async () => {
      prisma.expense.findFirst.mockResolvedValue(mockExpense);

      const result = await service.findOne('expense-123');

      expect(result.id).toBe(mockExpense.id);
      expect(result.amount).toBe(mockExpense.amount);
    });

    it('deve lançar NotFoundException quando despesa não existe', async () => {
      prisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Despesa não encontrada');
    });
  });

  describe('update', () => {
    it('deve atualizar despesa com sucesso', async () => {
      prisma.expense.findFirst.mockResolvedValue(mockExpense);
      prisma.expense.update.mockResolvedValue({
        ...mockExpense,
        amount: 750,
      });

      const result = await service.update('expense-123', { amount: 750 });

      expect(result.amount).toBe(750);
    });

    it('deve lançar NotFoundException quando despesa não existe', async () => {
      prisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando despesa já foi processada', async () => {
      prisma.expense.findFirst.mockResolvedValue({
        ...mockExpense,
        financialTransactionId: 'ft-123',
      });

      await expect(service.update('expense-123', { amount: 750 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('expense-123', { amount: 750 })).rejects.toThrow(
        'Não é possível editar despesa que já foi processada financeiramente',
      );
    });

    it('deve validar funcionário ao atualizar employeeId', async () => {
      prisma.expense.findFirst.mockResolvedValue(mockExpense);
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(
        service.update('expense-123', { employeeId: 'invalid-employee' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete da despesa', async () => {
      prisma.expense.findFirst.mockResolvedValue(mockExpense);
      prisma.expense.update.mockResolvedValue({ ...mockExpense, deletedAt: new Date() });

      await service.remove('expense-123');

      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: 'expense-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando despesa não existe', async () => {
      prisma.expense.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Despesa não encontrada');
    });

    it('deve lançar BadRequestException quando despesa já foi processada', async () => {
      prisma.expense.findFirst.mockResolvedValue({
        ...mockExpense,
        financialTransactionId: 'ft-123',
      });

      await expect(service.remove('expense-123')).rejects.toThrow(BadRequestException);
      await expect(service.remove('expense-123')).rejects.toThrow(
        'Não é possível excluir despesa que já foi processada financeiramente',
      );
    });
  });
});
