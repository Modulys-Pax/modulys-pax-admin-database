import { Test, TestingModule } from '@nestjs/testing';
import { FinancialTransactionController } from './financial-transaction.controller';
import { FinancialTransactionService } from './financial-transaction.service';

describe('FinancialTransactionController', () => {
  let controller: FinancialTransactionController;
  let service: FinancialTransactionService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTransaction = { id: 'trans-1', type: 'INCOME', amount: 5000, description: 'Receita' };
  const mockCurrentUser = { sub: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialTransactionController],
      providers: [{ provide: FinancialTransactionService, useValue: mockService }],
    }).compile();

    controller = module.get<FinancialTransactionController>(FinancialTransactionController);
    service = module.get<FinancialTransactionService>(FinancialTransactionService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma transação', async () => {
      const createDto = {
        type: 'INCOME' as any,
        amount: 5000,
        description: 'Receita',
        branchId: 'branch-1',
        companyId: 'company-1',
        transactionDate: '2024-01-15',
      };
      mockService.create.mockResolvedValue(mockTransaction);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de transações', async () => {
      mockService.findAll.mockResolvedValue([mockTransaction]);

      const result = await controller.findAll();

      expect(result).toEqual([mockTransaction]);
    });

    it('deve filtrar por tipo', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll(undefined, undefined, 'INCOME');

      expect(service.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
        'INCOME',
        undefined,
        undefined,
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma transação', async () => {
      mockService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne('trans-1');

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('update', () => {
    it('deve atualizar uma transação', async () => {
      const updateDto = { amount: 6000 };
      mockService.update.mockResolvedValue({ ...mockTransaction, ...updateDto });

      const result = await controller.update('trans-1', updateDto);

      expect(result.amount).toBe(6000);
    });
  });

  describe('remove', () => {
    it('deve remover uma transação', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('trans-1');

      expect(service.remove).toHaveBeenCalledWith('trans-1');
    });
  });
});
