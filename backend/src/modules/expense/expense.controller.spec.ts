import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';

describe('ExpenseController', () => {
  let controller: ExpenseController;
  let expenseService: ExpenseService;

  const mockExpenseService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockExpense = {
    id: 'expense-1',
    description: 'Combustível',
    amount: 500,
    branchId: 'branch-1',
  };

  const mockCurrentUser = { sub: 'user-1', branchId: 'branch-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseController],
      providers: [{ provide: ExpenseService, useValue: mockExpenseService }],
    }).compile();

    controller = module.get<ExpenseController>(ExpenseController);
    expenseService = module.get<ExpenseService>(ExpenseService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma despesa', async () => {
      const createDto = {
        description: 'Combustível',
        amount: 500,
        branchId: 'branch-1',
        companyId: 'company-1',
        type: 'FUEL' as any,
        expenseDate: '2024-01-15',
      };
      mockExpenseService.create.mockResolvedValue(mockExpense);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockExpense);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const response = { data: [mockExpense], meta: { page: 1, total: 1 } };
      mockExpenseService.findAll.mockResolvedValue(response);

      const result = await controller.findAll();

      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma despesa', async () => {
      mockExpenseService.findOne.mockResolvedValue(mockExpense);

      const result = await controller.findOne('expense-1', mockCurrentUser);

      expect(result).toEqual(mockExpense);
    });
  });

  describe('update', () => {
    it('deve atualizar uma despesa', async () => {
      const updateDto = { amount: 600 };
      mockExpenseService.update.mockResolvedValue({ ...mockExpense, ...updateDto });

      const result = await controller.update('expense-1', updateDto, mockCurrentUser);

      expect(result.amount).toBe(600);
    });
  });

  describe('remove', () => {
    it('deve remover uma despesa', async () => {
      mockExpenseService.remove.mockResolvedValue(undefined);

      await controller.remove('expense-1', mockCurrentUser);

      expect(expenseService.remove).toHaveBeenCalledWith('expense-1', mockCurrentUser);
    });
  });
});
