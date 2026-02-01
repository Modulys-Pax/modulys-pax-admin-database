import { Test, TestingModule } from '@nestjs/testing';
import { AccountReceivableController } from './account-receivable.controller';
import { AccountReceivableService } from './account-receivable.service';

describe('AccountReceivableController', () => {
  let controller: AccountReceivableController;
  let service: AccountReceivableService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    receive: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
    getAccountReceivableSummary: jest.fn(),
  };

  const mockAccount = { id: 'ar-1', description: 'Cliente', amount: 2000, status: 'PENDING' };
  const mockCurrentUser = { sub: 'user-1', branchId: 'branch-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountReceivableController],
      providers: [{ provide: AccountReceivableService, useValue: mockService }],
    }).compile();

    controller = module.get<AccountReceivableController>(AccountReceivableController);
    service = module.get<AccountReceivableService>(AccountReceivableService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma conta a receber', async () => {
      const createDto = {
        description: 'Cliente',
        amount: 2000,
        dueDate: '2024-01-30',
        branchId: 'branch-1',
        companyId: 'company-1',
      };
      mockService.create.mockResolvedValue(mockAccount);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockAccount);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de contas', async () => {
      mockService.findAll.mockResolvedValue([mockAccount]);

      const result = await controller.findAll();

      expect(result).toEqual([mockAccount]);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma conta', async () => {
      mockService.findOne.mockResolvedValue(mockAccount);

      const result = await controller.findOne('ar-1', mockCurrentUser);

      expect(result).toEqual(mockAccount);
    });
  });

  describe('update', () => {
    it('deve atualizar uma conta', async () => {
      const updateDto = { amount: 2500 };
      mockService.update.mockResolvedValue({ ...mockAccount, ...updateDto });

      const result = await controller.update('ar-1', updateDto, mockCurrentUser);

      expect(result.amount).toBe(2500);
    });
  });

  describe('receive', () => {
    it('deve receber uma conta', async () => {
      const receiveDto = {};
      const receivedAccount = { ...mockAccount, status: 'RECEIVED' };
      mockService.receive.mockResolvedValue(receivedAccount);

      const result = await controller.receive('ar-1', receiveDto, mockCurrentUser);

      expect(result.status).toBe('RECEIVED');
    });
  });

  describe('cancel', () => {
    it('deve cancelar uma conta', async () => {
      const cancelledAccount = { ...mockAccount, status: 'CANCELLED' };
      mockService.cancel.mockResolvedValue(cancelledAccount);

      const result = await controller.cancel('ar-1');

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('remove', () => {
    it('deve remover uma conta', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('ar-1', mockCurrentUser);

      expect(service.remove).toHaveBeenCalledWith('ar-1', mockCurrentUser);
    });
  });

  describe('getSummary', () => {
    it('deve retornar resumo de contas a receber', async () => {
      const summary = { total: 10000, pending: 7000 };
      mockService.getAccountReceivableSummary.mockResolvedValue(summary);

      const result = await controller.getSummary();

      expect(result).toEqual(summary);
    });
  });
});
