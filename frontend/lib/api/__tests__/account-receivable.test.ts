import {
  accountReceivableApi,
  AccountReceivable,
  CreateAccountReceivableDto,
  AccountReceivableStatus,
} from '../account-receivable';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('accountReceivableApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccountReceivable: AccountReceivable = {
    id: 'ar-123',
    description: 'Serviço de frete',
    amount: 8000,
    dueDate: new Date('2024-02-20'),
    status: AccountReceivableStatus.PENDING,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as contas a receber', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockAccountReceivable] });

      const result = await accountReceivableApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-receivable', {
        params: {
          companyId: undefined,
          branchId: undefined,
          status: undefined,
          startDate: undefined,
          endDate: undefined,
        },
      });
      expect(result).toEqual([mockAccountReceivable]);
    });

    it('deve filtrar por status', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await accountReceivableApi.getAll(undefined, undefined, AccountReceivableStatus.RECEIVED);

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-receivable', {
        params: expect.objectContaining({ status: AccountReceivableStatus.RECEIVED }),
      });
    });

    it('deve filtrar por período', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await accountReceivableApi.getAll(undefined, undefined, undefined, '2024-01-01', '2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-receivable', {
        params: expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar conta a receber por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockAccountReceivable });

      const result = await accountReceivableApi.getById('ar-123');

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-receivable/ar-123');
      expect(result).toEqual(mockAccountReceivable);
    });
  });

  describe('create', () => {
    it('deve criar conta a receber', async () => {
      const createDto: CreateAccountReceivableDto = {
        description: 'Novo serviço',
        amount: 3000,
        dueDate: '2024-03-20',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockAccountReceivable });

      const result = await accountReceivableApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/accounts-receivable', createDto);
      expect(result).toEqual(mockAccountReceivable);
    });
  });

  describe('update', () => {
    it('deve atualizar conta a receber', async () => {
      const updateData = { amount: 8500 };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockAccountReceivable, amount: 8500 },
      });

      const result = await accountReceivableApi.update('ar-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/accounts-receivable/ar-123', updateData);
      expect(result.amount).toBe(8500);
    });
  });

  describe('receive', () => {
    it('deve marcar conta como recebida', async () => {
      const receiveData = { receiptDate: '2024-02-18', notes: 'Recebido via TED' };
      (mockApi.put as jest.Mock).mockResolvedValueOnce({
        data: { ...mockAccountReceivable, status: AccountReceivableStatus.RECEIVED },
      });

      const result = await accountReceivableApi.receive('ar-123', receiveData);

      expect(mockApi.put).toHaveBeenCalledWith('/accounts-receivable/ar-123/receive', receiveData);
      expect(result.status).toBe(AccountReceivableStatus.RECEIVED);
    });
  });

  describe('cancel', () => {
    it('deve cancelar conta a receber', async () => {
      (mockApi.put as jest.Mock).mockResolvedValueOnce({
        data: { ...mockAccountReceivable, status: AccountReceivableStatus.CANCELLED },
      });

      const result = await accountReceivableApi.cancel('ar-123');

      expect(mockApi.put).toHaveBeenCalledWith('/accounts-receivable/ar-123/cancel');
      expect(result.status).toBe(AccountReceivableStatus.CANCELLED);
    });
  });

  describe('delete', () => {
    it('deve deletar conta a receber', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await accountReceivableApi.delete('ar-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/accounts-receivable/ar-123');
    });
  });

  describe('getSummary', () => {
    it('deve buscar resumo de contas a receber', async () => {
      const mockSummary = {
        summary: {
          totalReceivablePending: 15000,
          totalReceivableReceived: 25000,
          totalReceivableCancelled: 0,
          totalReceivable: 40000,
          countReceivablePending: 8,
          countReceivableReceived: 12,
          countReceivableCancelled: 0,
        },
        accountsReceivable: { data: [], total: 0, page: 1, limit: 15, totalPages: 0 },
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockSummary });

      const result = await accountReceivableApi.getSummary('branch-123', '2024-01-01', '2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-receivable/summary', {
        params: {
          branchId: 'branch-123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status: undefined,
          page: 1,
          limit: 15,
        },
      });
      expect(result.summary.totalReceivable).toBe(40000);
    });
  });
});
