import { walletApi, WalletSummary, WalletBalance, AdjustBalanceDto } from '../wallet';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('walletApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWalletSummary: WalletSummary = {
    branchId: 'branch-123',
    branchName: 'Filial SP',
    currentBalance: 50000,
    totalIncome: 80000,
    totalExpense: 30000,
    pendingReceivables: 15000,
    pendingPayables: 10000,
    projectedBalance: 55000,
    periodProfit: 50000,
    movements: [],
    referenceMonth: 1,
    referenceYear: 2024,
  };

  const mockWalletBalance: WalletBalance = {
    id: 'wallet-123',
    branchId: 'branch-123',
    balance: 50000,
    updatedAt: '2024-01-15T10:00:00Z',
  };

  describe('getSummary', () => {
    it('deve buscar resumo da carteira', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockWalletSummary });

      const result = await walletApi.getSummary(1, 2024);

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/summary?month=1&year=2024');
      expect(result).toEqual(mockWalletSummary);
    });

    it('deve filtrar por filial', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockWalletSummary });

      await walletApi.getSummary(1, 2024, 'branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/summary?month=1&year=2024&branchId=branch-123');
    });
  });

  describe('getBalance', () => {
    it('deve buscar saldo atual', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockWalletBalance });

      const result = await walletApi.getBalance();

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/balance?');
      expect(result).toEqual(mockWalletBalance);
    });

    it('deve filtrar por filial', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockWalletBalance });

      await walletApi.getBalance('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/balance?branchId=branch-123');
    });
  });

  describe('adjustBalance', () => {
    it('deve ajustar saldo manualmente', async () => {
      const adjustDto: AdjustBalanceDto = {
        newBalance: 60000,
        adjustmentType: 'MANUAL_ADJUSTMENT',
        reason: 'Correção de saldo',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({
        data: { ...mockWalletBalance, balance: 60000 },
      });

      const result = await walletApi.adjustBalance(adjustDto);

      expect(mockApi.post).toHaveBeenCalledWith('/wallet/adjust?', adjustDto);
      expect(result.balance).toBe(60000);
    });

    it('deve ajustar saldo inicial', async () => {
      const adjustDto: AdjustBalanceDto = {
        newBalance: 100000,
        adjustmentType: 'INITIAL_BALANCE',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockWalletBalance });

      await walletApi.adjustBalance(adjustDto, 'branch-123');

      expect(mockApi.post).toHaveBeenCalledWith('/wallet/adjust?branchId=branch-123', adjustDto);
    });
  });

  describe('checkBalance', () => {
    it('deve verificar saldo suficiente', async () => {
      const mockResult = { sufficient: true, currentBalance: 50000, requiredAmount: 10000 };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await walletApi.checkBalance(10000);

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/check-balance?amount=10000');
      expect(result.sufficient).toBe(true);
    });

    it('deve verificar saldo insuficiente', async () => {
      const mockResult = { sufficient: false, currentBalance: 5000, requiredAmount: 10000 };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await walletApi.checkBalance(10000, 'branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/check-balance?amount=10000&branchId=branch-123');
      expect(result.sufficient).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('deve buscar histórico de ajustes', async () => {
      const mockHistory = {
        data: [
          {
            id: 'adj-1',
            previousBalance: 40000,
            newBalance: 50000,
            adjustmentType: 'MANUAL_ADJUSTMENT',
            createdAt: '2024-01-15',
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockHistory });

      const result = await walletApi.getHistory();

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/history?page=1&limit=20');
      expect(result.data).toHaveLength(1);
    });

    it('deve aceitar paginação personalizada', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [], total: 0, page: 2, totalPages: 0 } });

      await walletApi.getHistory(2, 50, 'branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/wallet/history?page=2&limit=50&branchId=branch-123');
    });
  });
});
