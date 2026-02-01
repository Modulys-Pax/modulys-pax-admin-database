import { employeeApi, Employee, CreateEmployeeDto, EmployeeCostsResponse } from '../employee';
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

describe('employeeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEmployee: Employee = {
    id: 'employee-123',
    name: 'João Silva',
    cpf: '12345678900',
    email: 'joao@example.com',
    position: 'Motorista',
    monthlySalary: 3000,
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todos os funcionários', async () => {
      const mockResponse = {
        data: [mockEmployee],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await employeeApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/employees', {
        params: { branchId: undefined, includeDeleted: undefined, page: 1, limit: 15 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar por branchId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await employeeApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/employees', {
        params: { branchId: 'branch-123', includeDeleted: undefined, page: 1, limit: 15 },
      });
    });
  });

  describe('getById', () => {
    it('deve buscar funcionário por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockEmployee });

      const result = await employeeApi.getById('employee-123');

      expect(mockApi.get).toHaveBeenCalledWith('/employees/employee-123');
      expect(result).toEqual(mockEmployee);
    });
  });

  describe('create', () => {
    it('deve criar funcionário', async () => {
      const createDto: CreateEmployeeDto = {
        name: 'Maria Santos',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockEmployee });

      const result = await employeeApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/employees', createDto);
      expect(result).toEqual(mockEmployee);
    });
  });

  describe('update', () => {
    it('deve atualizar funcionário', async () => {
      const updateData = { monthlySalary: 3500 };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockEmployee, monthlySalary: 3500 },
      });

      const result = await employeeApi.update('employee-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/employees/employee-123', updateData);
      expect(result.monthlySalary).toBe(3500);
    });
  });

  describe('delete', () => {
    it('deve deletar funcionário', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await employeeApi.delete('employee-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/employees/employee-123');
    });
  });

  describe('getCosts', () => {
    it('deve buscar custos dos funcionários', async () => {
      const mockCosts: EmployeeCostsResponse = {
        summary: {
          totalEmployees: 10,
          totalMonthlySalaries: 30000,
          totalMonthlyBenefits: 5000,
          totalMonthlyTaxes: 10000,
          totalMonthlyCost: 45000,
          totalAnnualCost: 540000,
        },
        employees: {
          data: [],
          total: 0,
          page: 1,
          limit: 15,
          totalPages: 0,
        },
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockCosts });

      const result = await employeeApi.getCosts('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/employees/costs/summary', {
        params: { branchId: 'branch-123', page: 1, limit: 15 },
      });
      expect(result.summary.totalEmployees).toBe(10);
    });
  });

  describe('getDetailCosts', () => {
    it('deve buscar custos detalhados do funcionário', async () => {
      const mockDetailCosts = {
        employeeId: 'employee-123',
        employeeName: 'João Silva',
        monthlySalary: 3000,
        benefits: [],
        totalBenefits: 500,
        taxes: [],
        totalTaxes: 1000,
        totalMonthlyCost: 4500,
        totalAnnualCost: 54000,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockDetailCosts });

      const result = await employeeApi.getDetailCosts('employee-123');

      expect(mockApi.get).toHaveBeenCalledWith('/employees/employee-123/costs');
      expect(result.totalMonthlyCost).toBe(4500);
    });
  });

  describe('benefícios', () => {
    it('deve buscar benefícios', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await employeeApi.getBenefits('employee-123', 'branch-123', true);

      expect(mockApi.get).toHaveBeenCalledWith('/employees/benefits', {
        params: { employeeId: 'employee-123', branchId: 'branch-123', active: true },
      });
    });

    it('deve criar benefício', async () => {
      const benefitDto = {
        employeeId: 'employee-123',
        benefitId: 'benefit-123',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'new-benefit' } });

      await employeeApi.createBenefit(benefitDto);

      expect(mockApi.post).toHaveBeenCalledWith('/employees/benefits', benefitDto);
    });

    it('deve deletar benefício', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await employeeApi.deleteBenefit('benefit-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/employees/benefits/benefit-123');
    });
  });
});
