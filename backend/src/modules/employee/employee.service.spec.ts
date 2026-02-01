import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

// Mock das funções de tax-calculator
jest.mock('../../shared/utils/tax-calculator', () => ({
  calculateEmployeeINSS: jest.fn().mockReturnValue(500),
  calculateEmployerINSS: jest.fn().mockReturnValue(600),
  calculateFGTS: jest.fn().mockReturnValue(240),
  getEmployeeINSSBracketRate: jest.fn().mockReturnValue(12),
  INSS_MAX_CONTRIBUTION_2025: 908.85,
  INSS_MAX_SALARY_2025: 7786.02,
}));

// Mock de working-days
jest.mock('../../shared/utils/working-days.util', () => ({
  getCurrentMonthWorkingDays: jest.fn().mockReturnValue(22),
  getWorkingDaysInMonth: jest.fn().mockReturnValue(22),
}));

describe('EmployeeService', () => {
  let service: EmployeeService;
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

  const mockEmployee = {
    id: 'employee-123',
    name: 'João Silva',
    cpf: '12345678901',
    email: 'joao@example.com',
    phone: '11999999999',
    position: 'Desenvolvedor',
    department: 'TI',
    hireDate: new Date('2023-01-15'),
    monthlySalary: 5000,
    companyId: 'company-123',
    branchId: 'branch-123',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Maria Santos',
      cpf: '98765432100',
      email: 'maria@example.com',
      phone: '11888888888',
      position: 'Analista',
      department: 'Financeiro',
      branchId: 'branch-123',
      monthlySalary: 4000,
    };

    it('deve criar funcionário com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.create.mockResolvedValue({ ...mockEmployee, ...createDto });

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(prisma.employee.create).toHaveBeenCalled();
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

    it('deve criar funcionário com data de contratação', async () => {
      const dtoWithDate = { ...createDto, hireDate: '2024-01-15' };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.employee.create.mockResolvedValue({
        ...mockEmployee,
        hireDate: new Date('2024-01-15'),
      });

      const result = await service.create(dtoWithDate as any);

      expect(result.hireDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de funcionários', async () => {
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.employee.count.mockResolvedValue(1);

      const result = await service.findAll('branch-123');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('deve filtrar por filial', async () => {
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.employee.count.mockResolvedValue(1);

      await service.findAll('branch-123');

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-123',
          }),
        }),
      );
    });

    it('deve incluir deletados quando solicitado', async () => {
      prisma.employee.findMany.mockResolvedValue([{ ...mockEmployee, deletedAt: new Date() }]);
      prisma.employee.count.mockResolvedValue(1);

      await service.findAll(undefined, true);

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('deve aplicar paginação corretamente', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(50);

      const result = await service.findAll(undefined, false, 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('deve ordenar por nome ascendente', async () => {
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.employee.count.mockResolvedValue(1);

      await service.findAll();

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('deve retornar lista vazia quando não há funcionários', async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('deve retornar funcionário por ID', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const result = await service.findOne('employee-123');

      expect(result.id).toBe(mockEmployee.id);
      expect(result.name).toBe(mockEmployee.name);
    });

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Funcionário não encontrado');
    });
  });

  describe('update', () => {
    it('deve atualizar funcionário com sucesso', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employee.update.mockResolvedValue({
        ...mockEmployee,
        name: 'João Silva Atualizado',
      });

      const result = await service.update('employee-123', { name: 'João Silva Atualizado' });

      expect(result.name).toBe('João Silva Atualizado');
    });

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve validar empresa ao atualizar companyId', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(
        service.update('employee-123', { companyId: 'invalid-company' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('employee-123', { companyId: 'invalid-company' }),
      ).rejects.toThrow('Empresa não encontrada');
    });

    it('deve validar filial ao atualizar branchId', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.update('employee-123', { branchId: 'invalid-branch' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('employee-123', { branchId: 'invalid-branch' })).rejects.toThrow(
        'Filial não encontrada',
      );
    });

    it('deve converter data de contratação ao atualizar', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employee.update.mockResolvedValue({
        ...mockEmployee,
        hireDate: new Date('2024-06-01'),
      });

      await service.update('employee-123', { hireDate: '2024-06-01' });

      expect(prisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hireDate: expect.any(Date),
          }),
        }),
      );
    });

    it('deve atualizar salário', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employee.update.mockResolvedValue({
        ...mockEmployee,
        monthlySalary: 6000,
      });

      const result = await service.update('employee-123', { monthlySalary: 6000 });

      expect(result.monthlySalary).toBe(6000);
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete do funcionário', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employee.update.mockResolvedValue({ ...mockEmployee, deletedAt: new Date() });

      await service.remove('employee-123');

      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'employee-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Funcionário não encontrado');
    });
  });

  describe('getEmployeeCosts', () => {
    it('deve retornar resumo de custos dos funcionários', async () => {
      prisma.employee.count.mockResolvedValue(1);
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.employeeBenefit.findMany.mockResolvedValue([]);
      prisma.employee.aggregate.mockResolvedValue({
        _sum: { monthlySalary: 5000 },
      });

      const result = await service.getEmployeeCosts('branch-123');

      expect(result.summary).toHaveProperty('totalEmployees');
      expect(result.summary).toHaveProperty('totalMonthlySalaries');
      expect(result.summary).toHaveProperty('totalMonthlyBenefits');
      expect(result.summary).toHaveProperty('totalMonthlyTaxes');
      expect(result.employees.data).toHaveLength(1);
    });

    it('deve calcular custos com benefícios', async () => {
      const mockBenefit = {
        id: 'benefit-123',
        name: 'Vale Refeição',
        dailyCost: 30,
        employeeValue: 0,
        includeWeekends: false,
        deletedAt: null,
      };

      prisma.employee.count.mockResolvedValue(1);
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.employeeBenefit.findMany.mockResolvedValue([
        {
          id: 'eb-123',
          employeeId: 'employee-123',
          branchId: 'branch-123',
          active: true,
          deletedAt: null,
          benefit: mockBenefit,
        },
      ]);
      prisma.employee.aggregate.mockResolvedValue({
        _sum: { monthlySalary: 5000 },
      });

      const result = await service.getEmployeeCosts();

      expect(result.summary.totalMonthlyBenefits).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar valores zerados quando não há funcionários', async () => {
      prisma.employee.count.mockResolvedValue(0);
      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employeeBenefit.findMany.mockResolvedValue([]);
      prisma.employee.aggregate.mockResolvedValue({
        _sum: { monthlySalary: null },
      });

      const result = await service.getEmployeeCosts();

      expect(result.summary.totalEmployees).toBe(0);
      expect(result.summary.totalMonthlySalaries).toBe(0);
    });
  });

  describe('getEmployeeDetailCosts', () => {
    it('deve retornar detalhes de custo do funcionário', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employeeBenefit.findMany.mockResolvedValue([]);

      const result = await service.getEmployeeDetailCosts('employee-123');

      expect(result.employeeId).toBe('employee-123');
      expect(result.monthlySalary).toBe(5000);
      expect(result.taxes).toHaveLength(2); // INSS e FGTS
      expect(result).toHaveProperty('employeeINSS');
      expect(result).toHaveProperty('netSalary');
    });

    it('deve lançar NotFoundException quando funcionário não existe', async () => {
      prisma.employee.findFirst.mockResolvedValue(null);

      await expect(service.getEmployeeDetailCosts('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve incluir benefícios no cálculo', async () => {
      const mockBenefit = {
        id: 'benefit-123',
        name: 'Vale Refeição',
        dailyCost: 30,
        employeeValue: 0,
        includeWeekends: false,
        description: 'Vale para alimentação',
        deletedAt: null,
      };

      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employeeBenefit.findMany.mockResolvedValue([
        {
          id: 'eb-123',
          employeeId: 'employee-123',
          active: true,
          deletedAt: null,
          benefit: mockBenefit,
        },
      ]);

      const result = await service.getEmployeeDetailCosts('employee-123');

      expect(result.benefits).toHaveLength(1);
      expect(result.totalBenefits).toBeGreaterThan(0);
    });

    it('deve calcular custo total anual', async () => {
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.employeeBenefit.findMany.mockResolvedValue([]);

      const result = await service.getEmployeeDetailCosts('employee-123');

      expect(result.totalAnnualCost).toBe(result.totalMonthlyCost * 12);
    });
  });
});
