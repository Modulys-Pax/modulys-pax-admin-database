import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountReceivableService } from './account-receivable.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('AccountReceivableService', () => {
  let service: AccountReceivableService;
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

  const mockAccountReceivable = {
    id: 'ar-123',
    description: 'Receita de teste',
    amount: 2000,
    dueDate: new Date('2024-02-15'),
    receiptDate: null,
    status: 'PENDING',
    originType: null,
    originId: null,
    documentNumber: 'REC-001',
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
    type: 'INCOME',
    amount: 2000,
    description: 'Receita de teste',
    transactionDate: new Date(),
    companyId: 'company-123',
    branchId: 'branch-123',
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();
    const mockWalletService = {
      updateBalance: jest.fn(),
      getOrCreateBranchBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountReceivableService,
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

    service = module.get<AccountReceivableService>(AccountReceivableService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
    walletService = module.get(WalletService) as jest.Mocked<WalletService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      description: 'Nova receita',
      amount: 1500,
      dueDate: '2024-02-20',
      branchId: 'branch-123',
    };

    it('deve criar conta a receber com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.accountReceivable.create.mockResolvedValue({
        ...mockAccountReceivable,
        ...createDto,
      });

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.status).toBe('PENDING');
      expect(prisma.accountReceivable.create).toHaveBeenCalled();
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
        originType: 'SALE',
        originId: 'sale-123',
        documentNumber: 'NF-001',
        notes: 'Venda para cliente X',
      };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.accountReceivable.create.mockResolvedValue({
        ...mockAccountReceivable,
        ...dtoWithOptionals,
      });

      const result = await service.create(dtoWithOptionals as any);

      expect(result.originType).toBe('SALE');
      expect(result.documentNumber).toBe('NF-001');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de contas a receber', async () => {
      prisma.accountReceivable.findMany.mockResolvedValue([mockAccountReceivable]);

      const result = await service.findAll('company-123', 'branch-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockAccountReceivable.id);
    });

    it('deve filtrar por status', async () => {
      prisma.accountReceivable.findMany.mockResolvedValue([mockAccountReceivable]);

      await service.findAll('company-123', undefined, 'PENDING');

      expect(prisma.accountReceivable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });

    it('deve filtrar por período de datas', async () => {
      prisma.accountReceivable.findMany.mockResolvedValue([]);

      await service.findAll('company-123', undefined, undefined, '2024-01-01', '2024-01-31');

      expect(prisma.accountReceivable.findMany).toHaveBeenCalledWith(
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
      prisma.accountReceivable.findMany.mockResolvedValue([]);

      const result = await service.findAll('company-123');

      expect(result).toHaveLength(0);
    });

    it('deve ordenar por vencimento ascendente', async () => {
      prisma.accountReceivable.findMany.mockResolvedValue([mockAccountReceivable]);

      await service.findAll('company-123');

      expect(prisma.accountReceivable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dueDate: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar conta a receber por ID', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);

      const result = await service.findOne('ar-123');

      expect(result.id).toBe(mockAccountReceivable.id);
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Conta a receber não encontrada');
    });
  });

  describe('update', () => {
    it('deve atualizar conta a receber com sucesso', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);
      prisma.accountReceivable.update.mockResolvedValue({
        ...mockAccountReceivable,
        description: 'Descrição atualizada',
      });

      const result = await service.update('ar-123', { description: 'Descrição atualizada' });

      expect(result.description).toBe('Descrição atualizada');
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi recebida', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'RECEIVED',
      });

      await expect(service.update('ar-123', { description: 'Nova' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('ar-123', { description: 'Nova' })).rejects.toThrow(
        'Não é possível editar conta a receber já recebida',
      );
    });

    it('deve atualizar múltiplos campos', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);
      prisma.accountReceivable.update.mockResolvedValue({
        ...mockAccountReceivable,
        description: 'Nova descrição',
        amount: 3000,
        notes: 'Novas notas',
      });

      await service.update('ar-123', {
        description: 'Nova descrição',
        amount: 3000,
        notes: 'Novas notas',
      });

      expect(prisma.accountReceivable.update).toHaveBeenCalled();
    });
  });

  describe('receive', () => {
    it('deve receber conta a receber com sucesso', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.financialTransaction.create.mockResolvedValue(mockFinancialTransaction);
      prisma.accountReceivable.update.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'RECEIVED',
        receiptDate: new Date(),
        financialTransaction: mockFinancialTransaction,
      });
      walletService.updateBalance.mockResolvedValue(undefined);

      const result = await service.receive('ar-123', {}, 'user-123');

      expect(result.status).toBe('RECEIVED');
      expect(walletService.updateBalance).toHaveBeenCalledWith('branch-123', 2000, true);
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(null);

      await expect(service.receive('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi recebida', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'RECEIVED',
      });

      await expect(service.receive('ar-123', {})).rejects.toThrow(BadRequestException);
      await expect(service.receive('ar-123', {})).rejects.toThrow(
        'Conta a receber já foi recebida',
      );
    });

    it('deve lançar BadRequestException quando conta está cancelada', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'CANCELLED',
      });

      await expect(service.receive('ar-123', {})).rejects.toThrow(BadRequestException);
      await expect(service.receive('ar-123', {})).rejects.toThrow('Conta a receber está cancelada');
    });

    it('deve usar data de recebimento fornecida', async () => {
      const receiptDate = '2024-02-10';
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.financialTransaction.create.mockResolvedValue(mockFinancialTransaction);
      prisma.accountReceivable.update.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'RECEIVED',
        receiptDate: new Date(receiptDate),
      });

      await service.receive('ar-123', { receiptDate }, 'user-123');

      expect(prisma.financialTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionDate: expect.any(Date),
          }),
        }),
      );
    });

    it('deve criar transação financeira do tipo INCOME', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      prisma.financialTransaction.create.mockResolvedValue(mockFinancialTransaction);
      prisma.accountReceivable.update.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'RECEIVED',
      });

      await service.receive('ar-123', {}, 'user-123');

      expect(prisma.financialTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'INCOME',
          }),
        }),
      );
    });
  });

  describe('cancel', () => {
    it('deve cancelar conta a receber com sucesso', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);
      prisma.accountReceivable.update.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'CANCELLED',
      });

      const result = await service.cancel('ar-123');

      expect(result.status).toBe('CANCELLED');
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(null);

      await expect(service.cancel('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi recebida', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'RECEIVED',
      });

      await expect(service.cancel('ar-123')).rejects.toThrow(BadRequestException);
      await expect(service.cancel('ar-123')).rejects.toThrow(
        'Não é possível cancelar conta a receber já recebida',
      );
    });

    it('deve lançar BadRequestException quando conta já está cancelada', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'CANCELLED',
      });

      await expect(service.cancel('ar-123')).rejects.toThrow(BadRequestException);
      await expect(service.cancel('ar-123')).rejects.toThrow('Conta a receber já está cancelada');
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete da conta a receber', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(mockAccountReceivable);
      prisma.accountReceivable.update.mockResolvedValue({
        ...mockAccountReceivable,
        deletedAt: new Date(),
      });

      await service.remove('ar-123');

      expect(prisma.accountReceivable.update).toHaveBeenCalledWith({
        where: { id: 'ar-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando conta não existe', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando conta já foi recebida', async () => {
      prisma.accountReceivable.findFirst.mockResolvedValue({
        ...mockAccountReceivable,
        status: 'RECEIVED',
      });

      await expect(service.remove('ar-123')).rejects.toThrow(BadRequestException);
      await expect(service.remove('ar-123')).rejects.toThrow(
        'Não é possível excluir conta a receber já recebida',
      );
    });
  });

  describe('getAccountReceivableSummary', () => {
    const mockAggregateResult = (sum: number, count: number) => ({
      _sum: { amount: sum },
      _count: count,
    });

    it('deve retornar resumo de contas a receber', async () => {
      prisma.accountReceivable.aggregate
        .mockResolvedValueOnce(mockAggregateResult(8000, 4)) // PENDING
        .mockResolvedValueOnce(mockAggregateResult(5000, 3)) // RECEIVED
        .mockResolvedValueOnce(mockAggregateResult(1000, 1)); // CANCELLED
      prisma.accountReceivable.findMany.mockResolvedValue([mockAccountReceivable]);
      prisma.accountReceivable.count.mockResolvedValue(8);

      const result = await service.getAccountReceivableSummary('branch-123');

      expect(result.summary.totalReceivablePending).toBe(8000);
      expect(result.summary.totalReceivableReceived).toBe(5000);
      expect(result.summary.totalReceivableCancelled).toBe(1000);
      expect(result.summary.totalReceivable).toBe(14000);
      expect(result.summary.countReceivablePending).toBe(4);
    });

    it('deve retornar valores zerados quando não há contas', async () => {
      prisma.accountReceivable.aggregate
        .mockResolvedValueOnce(mockAggregateResult(null as any, 0))
        .mockResolvedValueOnce(mockAggregateResult(null as any, 0))
        .mockResolvedValueOnce(mockAggregateResult(null as any, 0));
      prisma.accountReceivable.findMany.mockResolvedValue([]);
      prisma.accountReceivable.count.mockResolvedValue(0);

      const result = await service.getAccountReceivableSummary();

      expect(result.summary.totalReceivable).toBe(0);
    });

    it('deve filtrar por status quando fornecido', async () => {
      prisma.accountReceivable.aggregate.mockResolvedValue(mockAggregateResult(8000, 4));
      prisma.accountReceivable.findMany.mockResolvedValue([mockAccountReceivable]);
      prisma.accountReceivable.count.mockResolvedValue(4);

      await service.getAccountReceivableSummary('branch-123', undefined, undefined, 'PENDING');

      expect(prisma.accountReceivable.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        }),
      );
    });

    it('deve retornar paginação correta', async () => {
      prisma.accountReceivable.aggregate.mockResolvedValue(mockAggregateResult(0, 0));
      prisma.accountReceivable.findMany.mockResolvedValue([]);
      prisma.accountReceivable.count.mockResolvedValue(45);

      const result = await service.getAccountReceivableSummary(
        'branch-123',
        undefined,
        undefined,
        undefined,
        2,
        10,
      );

      expect(result.accountsReceivable.page).toBe(2);
      expect(result.accountsReceivable.totalPages).toBe(5);
    });
  });
});
