import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let employeeService: EmployeeService;

  const mockEmployeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getEmployeeCosts: jest.fn(),
    getEmployeeDetailCosts: jest.fn(),
  };

  const mockEmployee = {
    id: 'emp-1',
    name: 'João Silva',
    email: 'joao@test.com',
    cpf: '12345678901',
    salary: 5000,
    branchId: 'branch-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    sub: 'user-1',
    email: 'admin@test.com',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    employeeService = module.get<EmployeeService>(EmployeeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um novo funcionário', async () => {
      const createDto: CreateEmployeeDto = {
        name: 'João Silva',
        email: 'joao@test.com',
        cpf: '12345678901',
        monthlySalary: 5000,
        branchId: 'branch-1',
        companyId: 'company-1',
        hireDate: new Date().toISOString(),
      };

      mockEmployeeService.create.mockResolvedValue(mockEmployee);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(mockEmployee);
      expect(employeeService.create).toHaveBeenCalledWith(createDto, mockUser.sub, mockUser);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de funcionários', async () => {
      const paginatedResult = {
        data: [mockEmployee],
        meta: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      };

      mockEmployeeService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll('branch-1', 'false', '1', '50');

      expect(result).toEqual(paginatedResult);
      expect(employeeService.findAll).toHaveBeenCalledWith('branch-1', false, 1, 50);
    });

    it('deve incluir funcionários excluídos quando solicitado', async () => {
      mockEmployeeService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll(undefined, 'true', '1', '10');

      expect(employeeService.findAll).toHaveBeenCalledWith(undefined, true, 1, 10);
    });

    it('deve usar valores padrão quando não fornecidos', async () => {
      mockEmployeeService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll();

      expect(employeeService.findAll).toHaveBeenCalledWith(undefined, false, 1, 50);
    });
  });

  describe('findOne', () => {
    it('deve retornar um funcionário por ID', async () => {
      mockEmployeeService.findOne.mockResolvedValue(mockEmployee);

      const result = await controller.findOne('emp-1', mockUser);

      expect(result).toEqual(mockEmployee);
      expect(employeeService.findOne).toHaveBeenCalledWith('emp-1', mockUser);
    });

    it('deve propagar erro quando funcionário não encontrado', async () => {
      mockEmployeeService.findOne.mockRejectedValue(
        new NotFoundException('Funcionário não encontrado'),
      );

      await expect(controller.findOne('emp-999', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um funcionário', async () => {
      const updateDto: UpdateEmployeeDto = {
        name: 'João Silva Atualizado',
        monthlySalary: 6000,
      };

      const updatedEmployee = { ...mockEmployee, ...updateDto };
      mockEmployeeService.update.mockResolvedValue(updatedEmployee);

      const result = await controller.update('emp-1', updateDto, mockUser);

      expect(result).toEqual(updatedEmployee);
      expect(employeeService.update).toHaveBeenCalledWith('emp-1', updateDto, mockUser);
    });
  });

  describe('remove', () => {
    it('deve remover um funcionário', async () => {
      mockEmployeeService.remove.mockResolvedValue(undefined);

      await controller.remove('emp-1', mockUser);

      expect(employeeService.remove).toHaveBeenCalledWith('emp-1', mockUser);
    });
  });

  describe('getCosts', () => {
    it('deve retornar dashboard de custos', async () => {
      const costsResult = {
        totalCosts: 50000,
        employees: [mockEmployee],
        meta: { page: 1, limit: 15, total: 1 },
      };

      mockEmployeeService.getEmployeeCosts.mockResolvedValue(costsResult);

      const result = await controller.getCosts('branch-1', '1', '15');

      expect(result).toEqual(costsResult);
      expect(employeeService.getEmployeeCosts).toHaveBeenCalledWith('branch-1', 1, 15);
    });

    it('deve usar valores padrão quando não fornecidos', async () => {
      mockEmployeeService.getEmployeeCosts.mockResolvedValue({});

      await controller.getCosts();

      expect(employeeService.getEmployeeCosts).toHaveBeenCalledWith(undefined, 1, 15);
    });
  });

  describe('getDetailCosts', () => {
    it('deve retornar custos detalhados de um funcionário', async () => {
      const detailCosts = {
        employee: mockEmployee,
        salary: 5000,
        benefits: 500,
        totalCost: 5500,
      };

      mockEmployeeService.getEmployeeDetailCosts.mockResolvedValue(detailCosts);

      const result = await controller.getDetailCosts('emp-1');

      expect(result).toEqual(detailCosts);
      expect(employeeService.getEmployeeDetailCosts).toHaveBeenCalledWith('emp-1');
    });
  });

  describe('getBenefitsPlaceholder', () => {
    it('deve lançar NotFoundException', () => {
      expect(() => controller.getBenefitsPlaceholder()).toThrow(NotFoundException);
      expect(() => controller.getBenefitsPlaceholder()).toThrow(
        'Endpoint não encontrado. Use o EmployeeBenefitController.',
      );
    });
  });
});
