import { Test, TestingModule } from '@nestjs/testing';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';

describe('SalaryController', () => {
  let controller: SalaryController;
  let salaryService: SalaryService;

  const mockSalaryService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    pay: jest.fn(),
    processSalaries: jest.fn(),
  };

  const mockSalary = {
    id: 'salary-1',
    employeeId: 'emp-1',
    amount: 5000,
    status: 'PENDING',
  };

  const mockCurrentUser = { sub: 'user-1', branchId: 'branch-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalaryController],
      providers: [{ provide: SalaryService, useValue: mockSalaryService }],
    }).compile();

    controller = module.get<SalaryController>(SalaryController);
    salaryService = module.get<SalaryService>(SalaryService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um salário', async () => {
      const createDto = {
        employeeId: 'emp-1',
        amount: 5000,
        referenceMonth: 1,
        referenceYear: 2024,
        branchId: 'branch-1',
        companyId: 'company-1',
      };
      mockSalaryService.create.mockResolvedValue(mockSalary);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockSalary);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const response = { data: [mockSalary], meta: { page: 1, total: 1 } };
      mockSalaryService.findAll.mockResolvedValue(response);

      const result = await controller.findAll();

      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('deve retornar um salário', async () => {
      mockSalaryService.findOne.mockResolvedValue(mockSalary);

      const result = await controller.findOne('salary-1', mockCurrentUser);

      expect(result).toEqual(mockSalary);
    });
  });

  describe('update', () => {
    it('deve atualizar um salário', async () => {
      const updateDto = { amount: 5500 };
      mockSalaryService.update.mockResolvedValue({ ...mockSalary, ...updateDto });

      const result = await controller.update('salary-1', updateDto, mockCurrentUser);

      expect(result.amount).toBe(5500);
    });
  });

  describe('pay', () => {
    it('deve pagar um salário', async () => {
      const paidSalary = { ...mockSalary, status: 'PAID' };
      mockSalaryService.pay.mockResolvedValue(paidSalary);

      const result = await controller.pay('salary-1', {}, mockCurrentUser);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('deve remover um salário', async () => {
      mockSalaryService.remove.mockResolvedValue(undefined);

      await controller.remove('salary-1', mockCurrentUser);

      expect(salaryService.remove).toHaveBeenCalledWith('salary-1', mockCurrentUser);
    });
  });

  describe('processSalaries', () => {
    it('deve processar salários do mês', async () => {
      const processed = { created: 10, skipped: 2 };
      mockSalaryService.processSalaries.mockResolvedValue(processed);

      const result = await controller.processSalaries(
        { referenceMonth: 1, referenceYear: 2024, branchId: 'branch-1', companyId: 'company-1' },
        mockCurrentUser,
      );

      expect(result).toEqual(processed);
    });
  });
});
