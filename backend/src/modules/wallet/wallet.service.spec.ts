import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';
import { AdjustmentType } from './dto/adjust-balance.dto';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaMock;

  const mockBranch = {
    id: 'branch-123',
    name: 'Test Branch',
    companyId: 'company-123',
    deletedAt: null,
  };

  const mockBranchBalance = {
    id: 'balance-123',
    branchId: 'branch-123',
    balance: 10000,
    updatedAt: new Date(),
    adjustments: [],
  };

  const mockAdjustment = {
    id: 'adjustment-123',
    branchBalanceId: 'balance-123',
    previousBalance: 10000,
    newBalance: 15000,
    adjustmentType: 'MANUAL_ADJUSTMENT',
    reason: 'Test adjustment',
    createdAt: new Date(),
    createdBy: 'user-123',
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateBranchBalance', () => {
    it('deve retornar saldo existente da filial', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);

      const result = await service.getOrCreateBranchBalance('branch-123');

      expect(result.id).toBe(mockBranchBalance.id);
      expect(result.balance).toBe(10000);
      expect(prisma.branchBalance.findUnique).toHaveBeenCalledWith({
        where: { branchId: 'branch-123' },
        include: {
          adjustments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('deve criar saldo quando não existe', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(null);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branchBalance.create.mockResolvedValue({
        ...mockBranchBalance,
        balance: 0,
        adjustments: [],
      });

      const result = await service.getOrCreateBranchBalance('branch-123');

      expect(result.balance).toBe(0);
      expect(prisma.branchBalance.create).toHaveBeenCalledWith({
        data: {
          branchId: 'branch-123',
          balance: 0,
        },
        include: {
          adjustments: true,
        },
      });
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(null);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.getOrCreateBranchBalance('invalid-branch')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrCreateBranchBalance('invalid-branch')).rejects.toThrow(
        'Filial não encontrada',
      );
    });
  });

  describe('adjustBalance', () => {
    const adjustDto = {
      newBalance: 15000,
      adjustmentType: AdjustmentType.MANUAL_ADJUSTMENT,
      reason: 'Test adjustment',
    };

    it('deve ajustar saldo com sucesso quando admin', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.$transaction.mockResolvedValue([
        mockAdjustment,
        { ...mockBranchBalance, balance: 15000, adjustments: [mockAdjustment] },
      ]);

      const result = await service.adjustBalance('branch-123', adjustDto, 'user-123', true);

      expect(result.balance).toBe(15000);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deve lançar ForbiddenException quando não é admin', async () => {
      await expect(
        service.adjustBalance('branch-123', adjustDto, 'user-123', false),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.adjustBalance('branch-123', adjustDto, 'user-123', false),
      ).rejects.toThrow('Apenas administradores podem ajustar o saldo manualmente');
    });
  });

  describe('updateBalance', () => {
    it('deve adicionar ao saldo quando é receita', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.branchBalance.update.mockResolvedValue({
        ...mockBranchBalance,
        balance: 15000,
      });

      await service.updateBalance('branch-123', 5000, true);

      expect(prisma.branchBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: { balance: 15000 },
      });
    });

    it('deve subtrair do saldo quando é despesa', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.branchBalance.update.mockResolvedValue({
        ...mockBranchBalance,
        balance: 7000,
      });

      await service.updateBalance('branch-123', 3000, false);

      expect(prisma.branchBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: { balance: 7000 },
      });
    });
  });

  describe('checkSufficientBalance', () => {
    it('deve retornar sufficient=true quando saldo é maior ou igual', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);

      const result = await service.checkSufficientBalance('branch-123', 5000);

      expect(result.sufficient).toBe(true);
      expect(result.currentBalance).toBe(10000);
    });

    it('deve retornar sufficient=false quando saldo é insuficiente', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);

      const result = await service.checkSufficientBalance('branch-123', 15000);

      expect(result.sufficient).toBe(false);
      expect(result.currentBalance).toBe(10000);
    });

    it('deve retornar sufficient=true quando saldo é exatamente igual', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);

      const result = await service.checkSufficientBalance('branch-123', 10000);

      expect(result.sufficient).toBe(true);
    });
  });

  describe('getWalletSummary', () => {
    const mockAccountsPayable = [
      {
        id: 'ap-1',
        description: 'Conta paga',
        amount: 1000,
        dueDate: new Date(),
        paymentDate: new Date(),
        status: 'PAID',
        branchId: 'branch-123',
      },
      {
        id: 'ap-2',
        description: 'Conta pendente',
        amount: 2000,
        dueDate: new Date(),
        paymentDate: null,
        status: 'PENDING',
        branchId: 'branch-123',
      },
    ];

    const mockAccountsReceivable = [
      {
        id: 'ar-1',
        description: 'Recebido',
        amount: 5000,
        dueDate: new Date(),
        receiptDate: new Date(),
        status: 'RECEIVED',
        branchId: 'branch-123',
      },
      {
        id: 'ar-2',
        description: 'A receber',
        amount: 3000,
        dueDate: new Date(),
        receiptDate: null,
        status: 'PENDING',
        branchId: 'branch-123',
      },
    ];

    it('deve retornar resumo da carteira', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.accountPayable.findMany.mockResolvedValue(mockAccountsPayable);
      prisma.accountReceivable.findMany.mockResolvedValue(mockAccountsReceivable);

      const result = await service.getWalletSummary('branch-123', 1, 2024);

      expect(result.branchId).toBe('branch-123');
      expect(result.branchName).toBe('Test Branch');
      expect(result.currentBalance).toBe(10000);
      expect(result.totalIncome).toBe(5000); // Apenas recebidos
      expect(result.totalExpense).toBe(1000); // Apenas pagos
      expect(result.pendingReceivables).toBe(3000);
      expect(result.pendingPayables).toBe(2000);
      expect(result.projectedBalance).toBe(11000); // 10000 + 3000 - 2000
      expect(result.periodProfit).toBe(4000); // 5000 - 1000
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.getWalletSummary('invalid-branch', 1, 2024)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBalanceHistory', () => {
    const mockAdjustments = [
      { ...mockAdjustment, id: 'adj-1' },
      { ...mockAdjustment, id: 'adj-2' },
    ];

    it('deve retornar histórico de ajustes', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.balanceAdjustment.findMany.mockResolvedValue(mockAdjustments);
      prisma.balanceAdjustment.count.mockResolvedValue(2);

      const result = await service.getBalanceHistory('branch-123', 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('deve retornar lista vazia quando não há saldo cadastrado', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(null);

      const result = await service.getBalanceHistory('branch-123');

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('deve calcular paginação corretamente', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.balanceAdjustment.findMany.mockResolvedValue(mockAdjustments);
      prisma.balanceAdjustment.count.mockResolvedValue(50);

      const result = await service.getBalanceHistory('branch-123', 2, 20);

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3); // 50 / 20 = 2.5 -> 3
      expect(prisma.balanceAdjustment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page - 1) * limit = 1 * 20
          take: 20,
        }),
      );
    });

    it('deve usar valores padrão de paginação', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.balanceAdjustment.findMany.mockResolvedValue([]);
      prisma.balanceAdjustment.count.mockResolvedValue(0);

      await service.getBalanceHistory('branch-123');

      expect(prisma.balanceAdjustment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('updateBalance - edge cases', () => {
    it('deve permitir saldo negativo após despesa', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue({
        ...mockBranchBalance,
        balance: 1000,
      });
      prisma.branchBalance.update.mockResolvedValue({
        ...mockBranchBalance,
        balance: -4000,
      });

      // Subtrai 5000 de um saldo de 1000 = -4000
      await service.updateBalance('branch-123', 5000, false);

      expect(prisma.branchBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: { balance: -4000 },
      });
    });

    it('deve lidar com valores decimais corretamente', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue({
        ...mockBranchBalance,
        balance: 1000.5,
      });
      prisma.branchBalance.update.mockResolvedValue({
        ...mockBranchBalance,
        balance: 1500.75,
      });

      await service.updateBalance('branch-123', 500.25, true);

      expect(prisma.branchBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: { balance: 1500.75 },
      });
    });

    it('deve atualizar saldo para zero exato', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue({
        ...mockBranchBalance,
        balance: 5000,
      });
      prisma.branchBalance.update.mockResolvedValue({
        ...mockBranchBalance,
        balance: 0,
      });

      await service.updateBalance('branch-123', 5000, false);

      expect(prisma.branchBalance.update).toHaveBeenCalledWith({
        where: { id: 'balance-123' },
        data: { balance: 0 },
      });
    });
  });

  describe('checkSufficientBalance - edge cases', () => {
    it('deve retornar sufficient=true para valor zero', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);

      const result = await service.checkSufficientBalance('branch-123', 0);

      expect(result.sufficient).toBe(true);
    });

    it('deve criar saldo se não existe e verificar', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(null);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branchBalance.create.mockResolvedValue({
        ...mockBranchBalance,
        balance: 0,
        adjustments: [],
      });

      const result = await service.checkSufficientBalance('branch-123', 100);

      expect(result.sufficient).toBe(false);
      expect(result.currentBalance).toBe(0);
    });
  });

  describe('getWalletSummary - cenários complexos', () => {
    it('deve retornar valores zerados quando não há movimentações', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.accountPayable.findMany.mockResolvedValue([]);
      prisma.accountReceivable.findMany.mockResolvedValue([]);

      const result = await service.getWalletSummary('branch-123', 1, 2024);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.pendingReceivables).toBe(0);
      expect(result.pendingPayables).toBe(0);
      expect(result.periodProfit).toBe(0);
    });

    it('deve calcular saldo projetado corretamente com múltiplas contas', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branchBalance.findUnique.mockResolvedValue({
        ...mockBranchBalance,
        balance: 5000,
      });
      prisma.accountPayable.findMany.mockResolvedValue([
        { id: 'ap-1', amount: 1000, status: 'PENDING', dueDate: new Date() },
        { id: 'ap-2', amount: 2000, status: 'PENDING', dueDate: new Date() },
      ]);
      prisma.accountReceivable.findMany.mockResolvedValue([
        { id: 'ar-1', amount: 5000, status: 'PENDING', dueDate: new Date() },
      ]);

      const result = await service.getWalletSummary('branch-123', 1, 2024);

      // Saldo projetado = 5000 + 5000 - 3000 = 7000
      expect(result.projectedBalance).toBe(7000);
    });

    it('deve retornar movimentações ordenadas', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.accountPayable.findMany.mockResolvedValue([
        {
          id: 'ap-1',
          description: 'Pago',
          amount: 100,
          status: 'PAID',
          dueDate: new Date(),
          paymentDate: new Date(),
        },
      ]);
      prisma.accountReceivable.findMany.mockResolvedValue([
        {
          id: 'ar-1',
          description: 'Pendente',
          amount: 200,
          status: 'PENDING',
          dueDate: new Date(),
        },
      ]);

      const result = await service.getWalletSummary('branch-123', 1, 2024);

      expect(result.movements).toHaveLength(2);
      // Pendentes primeiro
      expect(result.movements[0].status).toBe('PENDING');
    });

    it('deve incluir mês e ano de referência', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.accountPayable.findMany.mockResolvedValue([]);
      prisma.accountReceivable.findMany.mockResolvedValue([]);

      const result = await service.getWalletSummary('branch-123', 6, 2024);

      expect(result.referenceMonth).toBe(6);
      expect(result.referenceYear).toBe(2024);
    });
  });

  describe('adjustBalance - tipos de ajuste', () => {
    it('deve permitir ajuste do tipo INITIAL_BALANCE', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.$transaction.mockResolvedValue([
        { ...mockAdjustment, adjustmentType: AdjustmentType.INITIAL_BALANCE },
        { ...mockBranchBalance, balance: 50000, adjustments: [] },
      ]);

      const result = await service.adjustBalance(
        'branch-123',
        {
          newBalance: 50000,
          adjustmentType: AdjustmentType.INITIAL_BALANCE,
          reason: 'Saldo inicial',
        },
        'user-123',
        true,
      );

      expect(result.balance).toBe(50000);
    });

    it('deve permitir ajuste do tipo CORRECTION', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.$transaction.mockResolvedValue([
        { ...mockAdjustment, adjustmentType: AdjustmentType.CORRECTION },
        { ...mockBranchBalance, balance: 9500, adjustments: [] },
      ]);

      const result = await service.adjustBalance(
        'branch-123',
        {
          newBalance: 9500,
          adjustmentType: AdjustmentType.CORRECTION,
          reason: 'Correção de erro',
        },
        'user-123',
        true,
      );

      expect(result.balance).toBe(9500);
    });

    it('deve registrar motivo do ajuste', async () => {
      prisma.branchBalance.findUnique.mockResolvedValue(mockBranchBalance);
      prisma.$transaction.mockResolvedValue([
        mockAdjustment,
        { ...mockBranchBalance, adjustments: [mockAdjustment] },
      ]);

      await service.adjustBalance(
        'branch-123',
        {
          newBalance: 15000,
          adjustmentType: AdjustmentType.MANUAL_ADJUSTMENT,
          reason: 'Ajuste manual para conferência',
        },
        'user-123',
        true,
      );

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
