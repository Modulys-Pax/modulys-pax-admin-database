import { Test, TestingModule } from '@nestjs/testing';
import { VacationController } from './vacation.controller';
import { VacationService } from './vacation.service';

describe('VacationController', () => {
  let controller: VacationController;
  let vacationService: VacationService;

  const mockVacationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };

  const mockVacation = {
    id: 'vacation-1',
    employeeId: 'emp-1',
    startDate: new Date(),
    endDate: new Date(),
    status: 'PENDING',
  };

  const mockCurrentUser = { sub: 'user-1', branchId: 'branch-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacationController],
      providers: [{ provide: VacationService, useValue: mockVacationService }],
    }).compile();

    controller = module.get<VacationController>(VacationController);
    vacationService = module.get<VacationService>(VacationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma solicitação de férias', async () => {
      const createDto = {
        employeeId: 'emp-1',
        startDate: '2024-01-15',
        endDate: '2024-01-30',
        days: 15,
        branchId: 'branch-1',
        companyId: 'company-1',
      };
      mockVacationService.create.mockResolvedValue(mockVacation);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockVacation);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const response = { data: [mockVacation], meta: { page: 1, total: 1 } };
      mockVacationService.findAll.mockResolvedValue(response);

      const result = await controller.findAll();

      expect(result).toEqual(response);
    });

    it('deve filtrar por status', async () => {
      mockVacationService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll(undefined, undefined, 'APPROVED');

      expect(vacationService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar uma férias', async () => {
      mockVacationService.findOne.mockResolvedValue(mockVacation);

      const result = await controller.findOne('vacation-1');

      expect(result).toEqual(mockVacation);
    });
  });

  describe('update', () => {
    it('deve atualizar uma solicitação', async () => {
      const updateDto = { startDate: '2024-02-01' };
      mockVacationService.update.mockResolvedValue({ ...mockVacation, ...updateDto });

      const result = await controller.update('vacation-1', updateDto);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('deve remover uma solicitação', async () => {
      mockVacationService.remove.mockResolvedValue(undefined);

      await controller.remove('vacation-1');

      expect(vacationService.remove).toHaveBeenCalledWith('vacation-1');
    });
  });
});
