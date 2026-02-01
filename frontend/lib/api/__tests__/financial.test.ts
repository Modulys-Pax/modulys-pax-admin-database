import {
  financialApi,
  FinancialTransaction,
  CreateFinancialTransactionDto,
  TransactionType,
  TransactionOriginType,
} from '../financial';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('financialApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTransaction: FinancialTransaction = {
    id: 'tx-123',
    type: TransactionType.INCOME,
    amount: 5000,
    description: 'Pagamento de serviço',
    transactionDate: new Date(),
    originType: TransactionOriginType.MAINTENANCE,
    documentNumber: 'NF-001',
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as transações', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockTransaction] });

      const result = await financialApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/financial-transactions', {
        params: {
          companyId: undefined,
          branchId: undefined,
          type: undefined,
          startDate: undefined,
          endDate: undefined,
        },
      });
      expect(result).toEqual([mockTransaction]);
    });

    it('deve filtrar por tipo', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await financialApi.getAll(undefined, undefined, TransactionType.EXPENSE);

      expect(mockApi.get).toHaveBeenCalledWith('/financial-transactions', {
        params: expect.objectContaining({ type: TransactionType.EXPENSE }),
      });
    });

    it('deve filtrar por período', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await financialApi.getAll(undefined, undefined, undefined, '2024-01-01', '2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/financial-transactions', {
        params: expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      });
    });

    it('deve filtrar por filial', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await financialApi.getAll(undefined, 'branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/financial-transactions', {
        params: expect.objectContaining({ branchId: 'branch-123' }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar transação por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockTransaction });

      const result = await financialApi.getById('tx-123');

      expect(mockApi.get).toHaveBeenCalledWith('/financial-transactions/tx-123');
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('create', () => {
    it('deve criar transação de receita', async () => {
      const createDto: CreateFinancialTransactionDto = {
        type: TransactionType.INCOME,
        amount: 3000,
        description: 'Serviço prestado',
        transactionDate: '2024-01-15',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockTransaction });

      const result = await financialApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/financial-transactions', createDto);
      expect(result).toEqual(mockTransaction);
    });

    it('deve criar transação de despesa', async () => {
      const createDto: CreateFinancialTransactionDto = {
        type: TransactionType.EXPENSE,
        amount: 1500,
        description: 'Compra de peças',
        transactionDate: '2024-01-15',
        originType: TransactionOriginType.STOCK,
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockTransaction });

      await financialApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/financial-transactions', createDto);
    });
  });

  describe('update', () => {
    it('deve atualizar transação', async () => {
      const updateData = { amount: 5500, notes: 'Valor corrigido' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockTransaction, amount: 5500 },
      });

      const result = await financialApi.update('tx-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/financial-transactions/tx-123', updateData);
      expect(result.amount).toBe(5500);
    });
  });

  describe('delete', () => {
    it('deve deletar transação', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await financialApi.delete('tx-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/financial-transactions/tx-123');
    });
  });
});
