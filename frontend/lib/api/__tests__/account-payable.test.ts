import {
  accountPayableApi,
  AccountPayable,
  CreateAccountPayableDto,
  AccountPayableStatus,
} from '../account-payable';
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

describe('accountPayableApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccountPayable: AccountPayable = {
    id: 'ap-123',
    description: 'Pagamento fornecedor',
    amount: 5000,
    dueDate: new Date('2024-02-15'),
    status: AccountPayableStatus.PENDING,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as contas a pagar', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockAccountPayable] });

      const result = await accountPayableApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-payable', {
        params: {
          companyId: undefined,
          branchId: undefined,
          status: undefined,
          startDate: undefined,
          endDate: undefined,
        },
      });
      expect(result).toEqual([mockAccountPayable]);
    });

    it('deve filtrar por status', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await accountPayableApi.getAll(undefined, undefined, AccountPayableStatus.PAID);

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-payable', {
        params: expect.objectContaining({ status: AccountPayableStatus.PAID }),
      });
    });

    it('deve filtrar por período', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await accountPayableApi.getAll(undefined, undefined, undefined, '2024-01-01', '2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-payable', {
        params: expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar conta a pagar por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockAccountPayable });

      const result = await accountPayableApi.getById('ap-123');

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-payable/ap-123');
      expect(result).toEqual(mockAccountPayable);
    });
  });

  describe('create', () => {
    it('deve criar conta a pagar', async () => {
      const createDto: CreateAccountPayableDto = {
        description: 'Nova conta',
        amount: 1000,
        dueDate: '2024-03-15',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockAccountPayable });

      const result = await accountPayableApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/accounts-payable', createDto);
      expect(result).toEqual(mockAccountPayable);
    });
  });

  describe('update', () => {
    it('deve atualizar conta a pagar', async () => {
      const updateData = { amount: 5500 };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockAccountPayable, amount: 5500 },
      });

      const result = await accountPayableApi.update('ap-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/accounts-payable/ap-123', updateData);
      expect(result.amount).toBe(5500);
    });
  });

  describe('pay', () => {
    it('deve marcar conta como paga', async () => {
      const payData = { paymentDate: '2024-02-10', notes: 'Pago via PIX' };
      (mockApi.put as jest.Mock).mockResolvedValueOnce({
        data: { ...mockAccountPayable, status: AccountPayableStatus.PAID },
      });

      const result = await accountPayableApi.pay('ap-123', payData);

      expect(mockApi.put).toHaveBeenCalledWith('/accounts-payable/ap-123/pay', payData);
      expect(result.status).toBe(AccountPayableStatus.PAID);
    });
  });

  describe('cancel', () => {
    it('deve cancelar conta a pagar', async () => {
      (mockApi.put as jest.Mock).mockResolvedValueOnce({
        data: { ...mockAccountPayable, status: AccountPayableStatus.CANCELLED },
      });

      const result = await accountPayableApi.cancel('ap-123');

      expect(mockApi.put).toHaveBeenCalledWith('/accounts-payable/ap-123/cancel');
      expect(result.status).toBe(AccountPayableStatus.CANCELLED);
    });
  });

  describe('delete', () => {
    it('deve deletar conta a pagar', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await accountPayableApi.delete('ap-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/accounts-payable/ap-123');
    });
  });

  describe('getSummary', () => {
    it('deve buscar resumo financeiro', async () => {
      const mockSummary = {
        summary: {
          totalPayablePending: 10000,
          totalPayablePaid: 5000,
          totalPayableCancelled: 0,
          totalPayable: 15000,
          countPayablePending: 5,
          countPayablePaid: 3,
          countPayableCancelled: 0,
          totalReceivablePending: 8000,
          totalReceivableReceived: 12000,
          totalReceivableCancelled: 0,
          totalReceivable: 20000,
          countReceivablePending: 4,
          countReceivableReceived: 6,
          countReceivableCancelled: 0,
          netBalance: 5000,
        },
        accountsPayable: { data: [], total: 0, page: 1, limit: 15, totalPages: 0 },
        accountsReceivable: { data: [], total: 0, page: 1, limit: 15, totalPages: 0 },
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockSummary });

      const result = await accountPayableApi.getSummary('branch-123', '2024-01-01', '2024-12-31');

      expect(mockApi.get).toHaveBeenCalledWith('/accounts-payable/summary', {
        params: {
          branchId: 'branch-123',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          payablePage: 1,
          receivablePage: 1,
          limit: 15,
        },
      });
      expect(result.summary.netBalance).toBe(5000);
    });
  });

  describe('processPayroll', () => {
    it('deve processar folha de pagamento', async () => {
      const payrollData = {
        referenceMonth: 1,
        referenceYear: 2024,
        dueDate: '2024-02-05',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      const mockResult = {
        totalEmployees: 10,
        created: 8,
        alreadyExists: 2,
        skippedNoSalary: 0,
        totalAmount: 30000,
        details: [],
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await accountPayableApi.processPayroll(payrollData);

      expect(mockApi.post).toHaveBeenCalledWith('/accounts-payable/payroll/process', payrollData);
      expect(result.totalEmployees).toBe(10);
    });
  });
});
