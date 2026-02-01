import { expenseApi, Expense, CreateExpenseDto, ExpenseType } from '../expense';
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

describe('expenseApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockExpense: Expense = {
    id: 'expense-123',
    employeeId: 'employee-123',
    employeeName: 'João Silva',
    type: ExpenseType.TRANSPORT,
    amount: 150.00,
    description: 'Combustível viagem SP',
    expenseDate: '2024-01-15',
    documentNumber: 'NF-12345',
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  };

  describe('getAll', () => {
    it('deve buscar todas as despesas', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockExpense] });

      const result = await expenseApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/expenses?');
      expect(result).toEqual([mockExpense]);
    });

    it('deve filtrar por tipo', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await expenseApi.getAll(undefined, undefined, 'TRANSPORT');

      expect(mockApi.get).toHaveBeenCalledWith('/expenses?type=TRANSPORT');
    });

    it('deve filtrar por período', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await expenseApi.getAll(undefined, undefined, undefined, '2024-01-01', '2024-01-31');

      expect(mockApi.get).toHaveBeenCalledWith('/expenses?startDate=2024-01-01&endDate=2024-01-31');
    });

    it('deve filtrar por funcionário', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await expenseApi.getAll(undefined, 'employee-123');

      expect(mockApi.get).toHaveBeenCalledWith('/expenses?employeeId=employee-123');
    });

    it('deve filtrar por filial', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await expenseApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/expenses?branchId=branch-123');
    });
  });

  describe('getById', () => {
    it('deve buscar despesa por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockExpense });

      const result = await expenseApi.getById('expense-123');

      expect(mockApi.get).toHaveBeenCalledWith('/expenses/expense-123');
      expect(result).toEqual(mockExpense);
    });
  });

  describe('create', () => {
    it('deve criar despesa', async () => {
      const createDto: CreateExpenseDto = {
        type: ExpenseType.MEAL,
        amount: 50.00,
        description: 'Almoço cliente',
        expenseDate: '2024-01-15',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockExpense });

      const result = await expenseApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/expenses', createDto);
      expect(result).toEqual(mockExpense);
    });

    it('deve criar despesa vinculada a funcionário', async () => {
      const createDto: CreateExpenseDto = {
        employeeId: 'employee-123',
        type: ExpenseType.TRANSPORT,
        amount: 200.00,
        description: 'Pedágio',
        expenseDate: '2024-01-15',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockExpense });

      await expenseApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/expenses', createDto);
    });
  });

  describe('update', () => {
    it('deve atualizar despesa', async () => {
      const updateData = { amount: 180.00 };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockExpense, amount: 180.00 },
      });

      const result = await expenseApi.update('expense-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/expenses/expense-123', updateData);
      expect(result.amount).toBe(180.00);
    });
  });

  describe('delete', () => {
    it('deve deletar despesa', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await expenseApi.delete('expense-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/expenses/expense-123');
    });
  });
});
