import { salaryApi, Salary, CreateSalaryDto, ProcessSalariesResult } from '../salary';
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

describe('salaryApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSalary: Salary = {
    id: 'salary-123',
    employeeId: 'employee-123',
    employeeName: 'João Silva',
    amount: 3000,
    referenceMonth: 1,
    referenceYear: 2024,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('getAll', () => {
    it('deve buscar todos os salários', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockSalary] });

      const result = await salaryApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/salaries?');
      expect(result).toEqual([mockSalary]);
    });

    it('deve filtrar por branchId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await salaryApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/salaries?branchId=branch-123');
    });

    it('deve filtrar por período de referência', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await salaryApi.getAll(undefined, undefined, 1, 2024);

      expect(mockApi.get).toHaveBeenCalledWith('/salaries?referenceMonth=1&referenceYear=2024');
    });

    it('deve filtrar por funcionário', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await salaryApi.getAll(undefined, 'employee-123');

      expect(mockApi.get).toHaveBeenCalledWith('/salaries?employeeId=employee-123');
    });
  });

  describe('getById', () => {
    it('deve buscar salário por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockSalary });

      const result = await salaryApi.getById('salary-123');

      expect(mockApi.get).toHaveBeenCalledWith('/salaries/salary-123');
      expect(result).toEqual(mockSalary);
    });
  });

  describe('create', () => {
    it('deve criar salário', async () => {
      const createDto: CreateSalaryDto = {
        employeeId: 'employee-123',
        amount: 3500,
        referenceMonth: 2,
        referenceYear: 2024,
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockSalary });

      const result = await salaryApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/salaries', createDto);
      expect(result).toEqual(mockSalary);
    });
  });

  describe('update', () => {
    it('deve atualizar salário', async () => {
      const updateData = { amount: 3200 };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockSalary, amount: 3200 },
      });

      const result = await salaryApi.update('salary-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/salaries/salary-123', updateData);
      expect(result.amount).toBe(3200);
    });
  });

  describe('pay', () => {
    it('deve marcar salário como pago', async () => {
      (mockApi.put as jest.Mock).mockResolvedValueOnce({
        data: { ...mockSalary, paymentDate: '2024-02-05' },
      });

      const result = await salaryApi.pay('salary-123', { paymentDate: '2024-02-05' });

      expect(mockApi.put).toHaveBeenCalledWith('/salaries/salary-123/pay', { paymentDate: '2024-02-05' });
      expect(result.paymentDate).toBe('2024-02-05');
    });

    it('deve marcar salário como pago sem data específica', async () => {
      (mockApi.put as jest.Mock).mockResolvedValueOnce({ data: mockSalary });

      await salaryApi.pay('salary-123');

      expect(mockApi.put).toHaveBeenCalledWith('/salaries/salary-123/pay', {});
    });
  });

  describe('delete', () => {
    it('deve deletar salário', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await salaryApi.delete('salary-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/salaries/salary-123');
    });
  });

  describe('process', () => {
    it('deve processar salários em lote', async () => {
      const processData = {
        referenceMonth: 1,
        referenceYear: 2024,
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      const mockResult: ProcessSalariesResult = {
        totalEmployees: 10,
        created: 8,
        alreadyPending: 1,
        alreadyPaid: 0,
        skippedNoSalary: 1,
        details: [],
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResult });

      const result = await salaryApi.process(processData);

      expect(mockApi.post).toHaveBeenCalledWith('/salaries/process', processData);
      expect(result.totalEmployees).toBe(10);
      expect(result.created).toBe(8);
    });
  });
});
