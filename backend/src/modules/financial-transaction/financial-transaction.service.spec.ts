import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FinancialTransactionService } from './financial-transaction.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('FinancialTransactionService', () => {
  let service: FinancialTransactionService;
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

  const mockTransaction = {
    id: 'ft-123',
    type: 'EXPENSE',
    amount: 1000,
    description: 'Pagamento fornecedor',
    transactionDate: new Date('2024-01-15'),
    originType: null,
    originId: null,
    documentNumber: 'NF-001',
    notes: 'Pagamento urgente',
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialTransactionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FinancialTransactionService>(FinancialTransactionService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      type: 'EXPENSE',
      amount: 500,
      description: 'Nova despesa',
      transactionDate: '2024-01-20',
      branchId: 'branch-123',
    };

    it('deve criar transação financeira com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.financialTransaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe('EXPENSE');
      expect(prisma.financialTransaction.create).toHaveBeenCalled();
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

    it('deve validar origem de manutenção quando informada', async () => {
      const dtoWithOrigin = {
        ...createDto,
        originType: 'MAINTENANCE',
        originId: 'invalid-order',
      };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.maintenanceOrder.findFirst.mockResolvedValue(null);

      await expect(service.create(dtoWithOrigin as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(dtoWithOrigin as any)).rejects.toThrow(
        'Ordem de manutenção não encontrada',
      );
    });

    it('deve criar transação do tipo INCOME', async () => {
      const incomeDto = { ...createDto, type: 'INCOME' };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.financialTransaction.create.mockResolvedValue({
        ...mockTransaction,
        type: 'INCOME',
      });

      const result = await service.create(incomeDto as any);

      expect(result.type).toBe('INCOME');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de transações', async () => {
      prisma.financialTransaction.findMany.mockResolvedValue([mockTransaction]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe('EXPENSE');
    });

    it('deve filtrar por tipo', async () => {
      prisma.financialTransaction.findMany.mockResolvedValue([mockTransaction]);

      await service.findAll(undefined, undefined, 'EXPENSE');

      expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'EXPENSE',
          }),
        }),
      );
    });

    it('deve filtrar por período de datas', async () => {
      prisma.financialTransaction.findMany.mockResolvedValue([]);

      await service.findAll(undefined, undefined, undefined, '2024-01-01', '2024-01-31');

      expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            transactionDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('deve filtrar por filial', async () => {
      prisma.financialTransaction.findMany.mockResolvedValue([mockTransaction]);

      await service.findAll(undefined, 'branch-123');

      expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-123',
          }),
        }),
      );
    });

    it('deve ordenar por data de transação decrescente', async () => {
      prisma.financialTransaction.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.financialTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { transactionDate: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar transação por ID', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.findOne('ft-123');

      expect(result.id).toBe(mockTransaction.id);
      expect(result.amount).toBe(mockTransaction.amount);
    });

    it('deve lançar NotFoundException quando transação não existe', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Transação financeira não encontrada',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar transação com sucesso', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.financialTransaction.update.mockResolvedValue({
        ...mockTransaction,
        amount: 1500,
      });

      const result = await service.update('ft-123', { amount: 1500 });

      expect(result.amount).toBe(1500);
    });

    it('deve lançar NotFoundException quando transação não existe', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve atualizar descrição', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.financialTransaction.update.mockResolvedValue({
        ...mockTransaction,
        description: 'Nova descrição',
      });

      const result = await service.update('ft-123', { description: 'Nova descrição' });

      expect(result.description).toBe('Nova descrição');
    });

    it('deve atualizar tipo de transação', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.financialTransaction.update.mockResolvedValue({
        ...mockTransaction,
        type: 'INCOME',
      });

      const result = await service.update('ft-123', { type: 'INCOME' });

      expect(result.type).toBe('INCOME');
    });
  });

  describe('remove', () => {
    it('deve remover transação com sucesso', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.accountPayable.findFirst.mockResolvedValue(null);
      prisma.accountReceivable.findFirst.mockResolvedValue(null);
      prisma.financialTransaction.delete.mockResolvedValue(mockTransaction);

      await service.remove('ft-123');

      expect(prisma.financialTransaction.delete).toHaveBeenCalledWith({
        where: { id: 'ft-123' },
      });
    });

    it('deve lançar NotFoundException quando transação não existe', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow(
        'Transação financeira não encontrada',
      );
    });

    it('deve lançar BadRequestException quando vinculada a conta a pagar', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.accountPayable.findFirst.mockResolvedValue({ id: 'ap-123' });

      await expect(service.remove('ft-123')).rejects.toThrow(BadRequestException);
      await expect(service.remove('ft-123')).rejects.toThrow(
        /Não é possível excluir transação vinculada/,
      );
    });

    it('deve lançar BadRequestException quando vinculada a conta a receber', async () => {
      prisma.financialTransaction.findFirst.mockResolvedValue(mockTransaction);
      prisma.accountPayable.findFirst.mockResolvedValue(null);
      prisma.accountReceivable.findFirst.mockResolvedValue({ id: 'ar-123' });

      await expect(service.remove('ft-123')).rejects.toThrow(BadRequestException);
    });
  });
});
