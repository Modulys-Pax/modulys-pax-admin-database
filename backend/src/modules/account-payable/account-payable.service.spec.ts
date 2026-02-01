import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountPayableService } from './account-payable.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('AccountPayableService', () => {
  let service: AccountPayableService;
  let prisma: PrismaMock;
  let walletService: jest.Mocked<WalletService>;

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

  const mockAccountPayable = {
    id: 'ap-123',
    description: 'Conta de teste',
    amount: 1000,
    dueDate: new Date('2024-02-15'),
    paymentDate: null,
    status: 'PENDING',
    originType: null,
    originId: null,
    documentNumber: 'DOC-001',
    notes: 'Teste',
    companyId: 'company-123',
    branchId: 'branch-123',
    financialTransactionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
  };

  const mockFinancialTransaction = {
    id: 'ft-123',
    type: 'EXPENSE',
    amount: 1000,
    description: 'Conta de teste',
    transactionDate: new Date(),
    companyId: 'company-123',
    branchId: 'branch-123',
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const mockWalletService = {
      checkSufficientBalance: jest.fn(),
      updateBalance: jest.fn(),
      getOrCreateBranchBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountPayableService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: WalletService,
          useValue: mockWalletService,
        },
      ],
    }).compile();

    service = module.get<AccountPayableService>(AccountPayableService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
    walletService = module.get(WalletService) as jest.Mocked<WalletService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      description: 'Nova conta',
      amount: 500,
      dueDate: '2024-02-20',
      branchId: 'branch-123',
    };

    it('deve criar conta a pagar com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.accountPayable.create.mockResolvedValue({
        ...mockAccountPayable,
        ...createDto,
      });

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('PENDING');
      expect(prisma.accountPayable.create).toHaveBeenCalled();
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

    it('deve criar com campos opcionais', async () => {
      const dtoWithOptionals = {
        ...createDto,
        originType: 'STOCK',
        originId: 'origin-123',
        documentNumber: 'DOC-002',
        notes: 'Nota importante',
      };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.accountPayable.create.mockResolvedValue({
        ...mockAccountPayable,
        ...dtoWithOptionals,
      });

      const result = await service.create(dtoWithOptionals as any);

      expect(result.originType).toBe('STOCK');
      expect(result.documentNumber).toBe('DOC-002');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de contas a pagar', async () => {
      prisma.accountPayable.findMany.mockResolvedValue([mockAccountPayable]);

      const result = await service.findAll('company-123', 'branch-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockAccountPayable.id);
    });

    it('deve filtrar por status', async () => {
      prisma.accountPayable.findMany.mockResolvedValue([mockAccountPayable]);

      await service.findAll('company-123', undefined, 'PENDING');

      expect(prisma.accountPayable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });

    it('deve filtrar por período de datas', async () => {
      prisma.accountPayable.findMany.mockResolvedValue([]);

      await service.findAll('company-123', undefined, undefined, '2024-01-01', '2024-01-31');

      expect(prisma.accountPayable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('deve retornar lista vazia quando não há contas', async () => {
      prisma.accountPayable.findMany.mockResolvedValue([]);

      const result = await service.findAll('company-123');

      expect(result).toHaveLength(0);
    });

    it('deve ordenar por vencimento ascendente', async () => {
      prisma.accountPayable.findMany.mockResolvedValue([mockAccountPayable]);

      await service.findAll('company-123');

      expect(prisma.accountPayable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dueDate: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar conta a pagar por ID', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);

      const result = await service.findOne('ap-123');

      expect(result.id).toBe(mockAccountPayable.id);
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Conta a pagar não encontrada');
    });
  });

  describe('update', () => {
    it('deve atualizar conta a pagar com sucesso', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);
      prisma.accountPayable.update.mockResolvedValue({
        ...mockAccountPayable,
        description: 'Descrição atualizada',
      });

      const result = await service.update('ap-123', { description: 'Descrição atualizada' });

      expect(result.description).toBe('Descrição atualizada');
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi paga', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue({
        ...mockAccountPayable,
        status: 'PAID',
      });

      await expect(service.update('ap-123', { description: 'Nova' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('ap-123', { description: 'Nova' })).rejects.toThrow(
        'Não é possível editar conta a pagar já paga',
      );
    });

    it('deve atualizar múltiplos campos', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);
      prisma.accountPayable.update.mockResolvedValue({
        ...mockAccountPayable,
        description: 'Nova descrição',
        amount: 2000,
        notes: 'Novas notas',
      });

      await service.update('ap-123', {
        description: 'Nova descrição',
        amount: 2000,
        notes: 'Novas notas',
      });

      expect(prisma.accountPayable.update).toHaveBeenCalled();
    });
  });

  describe('pay', () => {
    it('deve pagar conta a pagar com sucesso', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);
      walletService.checkSufficientBalance.mockResolvedValue({
        sufficient: true,
        currentBalance: 5000,
      });
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.financialTransaction.create.mockResolvedValue(mockFinancialTransaction);
      prisma.accountPayable.update.mockResolvedValue({
        ...mockAccountPayable,
        status: 'PAID',
        paymentDate: new Date(),
        financialTransaction: mockFinancialTransaction,
      });
      walletService.updateBalance.mockResolvedValue(undefined);

      const result = await service.pay('ap-123', {}, 'user-123');

      expect(result.status).toBe('PAID');
      expect(walletService.updateBalance).toHaveBeenCalledWith('branch-123', 1000, false);
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(null);

      await expect(service.pay('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi paga', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue({
        ...mockAccountPayable,
        status: 'PAID',
      });

      await expect(service.pay('ap-123', {})).rejects.toThrow(BadRequestException);
      await expect(service.pay('ap-123', {})).rejects.toThrow('Conta a pagar já foi paga');
    });

    it('deve lançar BadRequestException quando conta está cancelada', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue({
        ...mockAccountPayable,
        status: 'CANCELLED',
      });

      await expect(service.pay('ap-123', {})).rejects.toThrow(BadRequestException);
      await expect(service.pay('ap-123', {})).rejects.toThrow('Conta a pagar está cancelada');
    });

    it('deve lançar BadRequestException quando saldo insuficiente', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);
      walletService.checkSufficientBalance.mockResolvedValue({
        sufficient: false,
        currentBalance: 500,
      });

      await expect(service.pay('ap-123', {})).rejects.toThrow(BadRequestException);
      await expect(service.pay('ap-123', {})).rejects.toThrow(/Saldo insuficiente/);
    });

    it('deve usar data de pagamento fornecida', async () => {
      const paymentDate = '2024-02-10';
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);
      walletService.checkSufficientBalance.mockResolvedValue({
        sufficient: true,
        currentBalance: 5000,
      });
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.financialTransaction.create.mockResolvedValue(mockFinancialTransaction);
      prisma.accountPayable.update.mockResolvedValue({
        ...mockAccountPayable,
        status: 'PAID',
        paymentDate: new Date(paymentDate),
      });

      await service.pay('ap-123', { paymentDate }, 'user-123');

      expect(prisma.financialTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionDate: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('cancel', () => {
    it('deve cancelar conta a pagar com sucesso', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);
      prisma.accountPayable.update.mockResolvedValue({
        ...mockAccountPayable,
        status: 'CANCELLED',
      });

      const result = await service.cancel('ap-123');

      expect(result.status).toBe('CANCELLED');
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(null);

      await expect(service.cancel('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi paga', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue({
        ...mockAccountPayable,
        status: 'PAID',
      });

      await expect(service.cancel('ap-123')).rejects.toThrow(BadRequestException);
      await expect(service.cancel('ap-123')).rejects.toThrow(
        'Não é possível cancelar conta a pagar já paga',
      );
    });

    it('deve lançar BadRequestException quando conta já está cancelada', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue({
        ...mockAccountPayable,
        status: 'CANCELLED',
      });

      await expect(service.cancel('ap-123')).rejects.toThrow(BadRequestException);
      await expect(service.cancel('ap-123')).rejects.toThrow('Conta a pagar já está cancelada');
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete da conta a pagar', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(mockAccountPayable);
      prisma.accountPayable.update.mockResolvedValue({
        ...mockAccountPayable,
        deletedAt: new Date(),
      });

      await service.remove('ap-123');

      expect(prisma.accountPayable.update).toHaveBeenCalledWith({
        where: { id: 'ap-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi paga', async () => {
      prisma.accountPayable.findFirst.mockResolvedValue({
        ...mockAccountPayable,
        status: 'PAID',
      });

      await expect(service.remove('ap-123')).rejects.toThrow(BadRequestException);
      await expect(service.remove('ap-123')).rejects.toThrow(
        'Não é possível excluir conta a pagar já paga',
      );
    });
  });

  describe('getAccountPayableSummary', () => {
    const mockAggregateResult = (sum: number, count: number) => ({
      _sum: { amount: sum },
      _count: count,
    });

    it('deve retornar resumo de contas a pagar', async () => {
      prisma.accountPayable.aggregate
        .mockResolvedValueOnce(mockAggregateResult(5000, 3)) // PENDING
        .mockResolvedValueOnce(mockAggregateResult(3000, 2)) // PAID
        .mockResolvedValueOnce(mockAggregateResult(1000, 1)); // CANCELLED
      prisma.accountPayable.findMany.mockResolvedValue([mockAccountPayable]);
      prisma.accountPayable.count.mockResolvedValue(6);

      const result = await service.getAccountPayableSummary('branch-123');

      expect(result.summary.totalPayablePending).toBe(5000);
      expect(result.summary.totalPayablePaid).toBe(3000);
      expect(result.summary.totalPayableCancelled).toBe(1000);
      expect(result.summary.totalPayable).toBe(9000);
      expect(result.summary.countPayablePending).toBe(3);
    });

    it('deve retornar valores zerados quando não há contas', async () => {
      prisma.accountPayable.aggregate
        .mockResolvedValueOnce(mockAggregateResult(null as any, 0))
        .mockResolvedValueOnce(mockAggregateResult(null as any, 0))
        .mockResolvedValueOnce(mockAggregateResult(null as any, 0));
      prisma.accountPayable.findMany.mockResolvedValue([]);
      prisma.accountPayable.count.mockResolvedValue(0);

      const result = await service.getAccountPayableSummary();

      expect(result.summary.totalPayable).toBe(0);
    });

    it('deve filtrar por status quando fornecido', async () => {
      prisma.accountPayable.aggregate.mockResolvedValue(mockAggregateResult(5000, 3));
      prisma.accountPayable.findMany.mockResolvedValue([mockAccountPayable]);
      prisma.accountPayable.count.mockResolvedValue(3);

      await service.getAccountPayableSummary('branch-123', undefined, undefined, 'PENDING');

      // A lista deve filtrar por status
      expect(prisma.accountPayable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });
  });

  describe('getFinancialAccountsSummary', () => {
    const mockAggregateResult = (sum: number, count: number) => ({
      _sum: { amount: sum },
      _count: count,
    });

    it('deve retornar resumo financeiro completo', async () => {
      // Contas a pagar
      prisma.accountPayable.aggregate
        .mockResolvedValueOnce(mockAggregateResult(5000, 3)) // PENDING
        .mockResolvedValueOnce(mockAggregateResult(3000, 2)) // PAID
        .mockResolvedValueOnce(mockAggregateResult(1000, 1)); // CANCELLED

      // Contas a receber
      prisma.accountReceivable.aggregate
        .mockResolvedValueOnce(mockAggregateResult(8000, 4)) // PENDING
        .mockResolvedValueOnce(mockAggregateResult(5000, 3)) // RECEIVED
        .mockResolvedValueOnce(mockAggregateResult(500, 1)); // CANCELLED

      prisma.accountPayable.findMany.mockResolvedValue([mockAccountPayable]);
      prisma.accountReceivable.findMany.mockResolvedValue([]);
      prisma.accountPayable.count.mockResolvedValue(6);
      prisma.accountReceivable.count.mockResolvedValue(8);

      const result = await service.getFinancialAccountsSummary('branch-123');

      expect(result.summary.totalPayable).toBe(9000);
      expect(result.summary.totalReceivable).toBe(13500);
      expect(result.summary.netBalance).toBe(4500); // 13500 - 9000
    });

    it('deve retornar paginação correta para ambas as listas', async () => {
      prisma.accountPayable.aggregate.mockResolvedValue(mockAggregateResult(0, 0));
      prisma.accountReceivable.aggregate.mockResolvedValue(mockAggregateResult(0, 0));
      prisma.accountPayable.findMany.mockResolvedValue([]);
      prisma.accountReceivable.findMany.mockResolvedValue([]);
      prisma.accountPayable.count.mockResolvedValue(30);
      prisma.accountReceivable.count.mockResolvedValue(45);

      const result = await service.getFinancialAccountsSummary(
        'branch-123',
        undefined,
        undefined,
        2,
        3,
        10,
      );

      expect(result.accountsPayable.page).toBe(2);
      expect(result.accountsPayable.totalPages).toBe(3);
      expect(result.accountsReceivable.page).toBe(3);
      expect(result.accountsReceivable.totalPages).toBe(5);
    });
  });

  describe('validateReferencePeriod (via processPayroll)', () => {
    it('deve permitir mês atual', async () => {
      const now = new Date();
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.accountPayable.findMany.mockResolvedValue([]);

      const result = await service.processPayroll({
        branchId: 'branch-123',
        companyId: 'company-123',
        referenceMonth: now.getMonth() + 1,
        referenceYear: now.getFullYear(),
      } as any);

      expect(result.totalEmployees).toBe(0);
    });

    it('deve permitir 1 mês no passado', async () => {
      const now = new Date();
      let pastMonth = now.getMonth(); // 0-indexed, então getMonth() já é mês anterior
      let pastYear = now.getFullYear();

      if (pastMonth === 0) {
        pastMonth = 12;
        pastYear -= 1;
      }

      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.accountPayable.findMany.mockResolvedValue([]);

      const result = await service.processPayroll({
        branchId: 'branch-123',
        companyId: 'company-123',
        referenceMonth: pastMonth,
        referenceYear: pastYear,
      } as any);

      expect(result.totalEmployees).toBe(0);
    });

    it('deve rejeitar mais de 1 mês no passado', async () => {
      const now = new Date();
      let pastMonth = now.getMonth() - 1; // 2 meses atrás
      let pastYear = now.getFullYear();

      if (pastMonth <= 0) {
        pastMonth += 12;
        pastYear -= 1;
      }

      await expect(
        service.processPayroll({
          branchId: 'branch-123',
          companyId: 'company-123',
          referenceMonth: pastMonth,
          referenceYear: pastYear,
        } as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processPayroll({
          branchId: 'branch-123',
          companyId: 'company-123',
          referenceMonth: pastMonth,
          referenceYear: pastYear,
        } as any),
      ).rejects.toThrow(/Período fora do limite permitido/);
    });

    it('deve rejeitar ano anterior (mais de 1 mês)', async () => {
      const now = new Date();
      // 6 meses atrás é sempre inválido
      let pastMonth = now.getMonth() - 5;
      let pastYear = now.getFullYear();

      if (pastMonth <= 0) {
        pastMonth += 12;
        pastYear -= 1;
      }

      await expect(
        service.processPayroll({
          branchId: 'branch-123',
          companyId: 'company-123',
          referenceMonth: pastMonth,
          referenceYear: pastYear,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processPayroll', () => {
    const mockEmployee = {
      id: 'emp-123',
      name: 'João Silva',
      monthlySalary: 3000,
      companyId: 'company-123',
      branchId: 'branch-123',
      active: true,
      deletedAt: null,
    };

    it('deve lançar BadRequestException para meses futuros', async () => {
      const now = new Date();
      const futureMonth = now.getMonth() + 3;
      const futureYear = now.getFullYear() + (futureMonth > 12 ? 1 : 0);
      const normalizedMonth = futureMonth > 12 ? futureMonth - 12 : futureMonth;

      await expect(
        service.processPayroll({
          branchId: 'branch-123',
          companyId: 'company-123',
          referenceMonth: normalizedMonth,
          referenceYear: futureYear,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve processar folha de pagamento com sucesso', async () => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.accountPayable.findMany.mockResolvedValue([]); // Nenhuma conta existente
      prisma.employeeBenefit.findMany.mockResolvedValue([]);
      prisma.accountPayable.create.mockResolvedValue({
        ...mockAccountPayable,
        amount: 3000,
        originType: 'HR',
      });

      const result = await service.processPayroll({
        branchId: 'branch-123',
        companyId: 'company-123',
        referenceMonth: currentMonth,
        referenceYear: currentYear,
      } as any);

      expect(result.totalEmployees).toBe(1);
      expect(result.created).toBe(1);
      expect(result.totalAmount).toBe(3000);
    });

    it('deve pular funcionários sem salário', async () => {
      const now = new Date();
      const employeeWithoutSalary = { ...mockEmployee, monthlySalary: 0 };

      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([employeeWithoutSalary]);
      prisma.accountPayable.findMany.mockResolvedValue([]);

      const result = await service.processPayroll({
        branchId: 'branch-123',
        companyId: 'company-123',
        referenceMonth: now.getMonth() + 1,
        referenceYear: now.getFullYear(),
      } as any);

      expect(result.skippedNoSalary).toBe(1);
      expect(result.created).toBe(0);
    });

    it('deve marcar como already_exists quando conta já existe', async () => {
      const now = new Date();
      const existingAccount = {
        ...mockAccountPayable,
        documentNumber: `FOLHA-${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}-emp-123`,
        originType: 'HR',
      };

      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.accountPayable.findMany.mockResolvedValue([existingAccount]);

      const result = await service.processPayroll({
        branchId: 'branch-123',
        companyId: 'company-123',
        referenceMonth: now.getMonth() + 1,
        referenceYear: now.getFullYear(),
      } as any);

      expect(result.alreadyExists).toBe(1);
      expect(result.created).toBe(0);
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      const now = new Date();
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.processPayroll({
          branchId: 'invalid-branch',
          companyId: 'company-123',
          referenceMonth: now.getMonth() + 1,
          referenceYear: now.getFullYear(),
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPayrollPreview', () => {
    const mockEmployee = {
      id: 'emp-123',
      name: 'João Silva',
      monthlySalary: 3000,
      companyId: 'company-123',
      branchId: 'branch-123',
      active: true,
      deletedAt: null,
    };

    it('deve retornar prévia da folha', async () => {
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.accountPayable.findMany.mockResolvedValue([]);
      prisma.employeeBenefit.findMany.mockResolvedValue([]);

      const result = await service.getPayrollPreview(1, 2024, 'branch-123');

      expect(result).toHaveLength(1);
      expect(result[0].employeeName).toBe('João Silva');
      expect(result[0].baseSalary).toBe(3000);
      expect(result[0].status).toBe('created');
    });

    it('deve incluir benefícios no cálculo', async () => {
      const mockBenefit = {
        id: 'benefit-123',
        name: 'Vale Refeição',
        dailyCost: 30,
        includeWeekends: false,
        deletedAt: null,
      };

      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.accountPayable.findMany.mockResolvedValue([]);
      prisma.employeeBenefit.findMany.mockResolvedValue([
        {
          id: 'eb-123',
          employeeId: 'emp-123',
          branchId: 'branch-123',
          active: true,
          deletedAt: null,
          benefit: mockBenefit,
        },
      ]);

      const result = await service.getPayrollPreview(1, 2024, 'branch-123');

      expect(result[0].totalBenefits).toBeGreaterThan(0);
      expect(result[0].benefits).toHaveLength(1);
    });
  });
});
