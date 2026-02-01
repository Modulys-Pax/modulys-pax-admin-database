import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

// Mock do utilitário de branch
jest.mock('../../shared/utils/branch-access.util', () => ({
  getBranchId: jest.fn((branchId, user) => branchId || user?.branchId),
}));

describe('WalletController', () => {
  let controller: WalletController;
  let walletService: WalletService;

  const mockWalletService = {
    getWalletSummary: jest.fn(),
    getOrCreateBranchBalance: jest.fn(),
    adjustBalance: jest.fn(),
    checkSufficientBalance: jest.fn(),
    getBalanceHistory: jest.fn(),
  };

  const mockCurrentUser = {
    sub: 'admin-1',
    branchId: 'branch-1',
    role: { name: 'ADMIN' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [{ provide: WalletService, useValue: mockWalletService }],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    walletService = module.get<WalletService>(WalletService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getSummary', () => {
    it('deve retornar resumo da carteira', async () => {
      const summary = { balance: 10000, income: 15000, expenses: 5000 };
      mockWalletService.getWalletSummary.mockResolvedValue(summary);

      const result = await controller.getSummary('branch-1', 1, 2024, mockCurrentUser);

      expect(result).toEqual(summary);
    });
  });

  describe('getBalance', () => {
    it('deve retornar saldo atual', async () => {
      const balance = { branchId: 'branch-1', balance: 10000 };
      mockWalletService.getOrCreateBranchBalance.mockResolvedValue(balance);

      const result = await controller.getBalance('branch-1', mockCurrentUser);

      expect(result).toEqual(balance);
    });
  });

  describe('adjustBalance', () => {
    it('deve ajustar saldo', async () => {
      const adjustDto = {
        newBalance: 11000,
        adjustmentType: 'MANUAL_ADJUSTMENT' as any,
        description: 'Ajuste',
      };
      const newBalance = { branchId: 'branch-1', balance: 11000 };
      mockWalletService.adjustBalance.mockResolvedValue(newBalance);

      const result = await controller.adjustBalance('branch-1', adjustDto, mockCurrentUser);

      expect(result).toEqual(newBalance);
    });
  });

  describe('checkBalance', () => {
    it('deve verificar saldo suficiente', async () => {
      mockWalletService.checkSufficientBalance.mockResolvedValue({
        sufficient: true,
        currentBalance: 10000,
      });

      const result = await controller.checkBalance('branch-1', '5000', mockCurrentUser);

      expect(result).toEqual({
        sufficient: true,
        currentBalance: 10000,
        requiredAmount: 5000,
      });
    });

    it('deve retornar insuficiente quando saldo é menor', async () => {
      mockWalletService.checkSufficientBalance.mockResolvedValue({
        sufficient: false,
        currentBalance: 3000,
      });

      const result = await controller.checkBalance('branch-1', '5000', mockCurrentUser);

      expect(result.sufficient).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('deve retornar histórico de ajustes', async () => {
      const history = {
        data: [{ id: 'adj-1', amount: 1000 }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      mockWalletService.getBalanceHistory.mockResolvedValue(history);

      const result = await controller.getHistory('branch-1', 1, 20, mockCurrentUser);

      expect(result).toEqual(history);
    });
  });
});
