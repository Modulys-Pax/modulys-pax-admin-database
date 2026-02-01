import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeBenefitController } from './employee-benefit.controller';
import { EmployeeBenefitService } from './employee-benefit.service';

describe('EmployeeBenefitController', () => {
  let controller: EmployeeBenefitController;
  let service: EmployeeBenefitService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBenefit = { id: 'eb-1', employeeId: 'emp-1', benefitId: 'benefit-1', value: 200 };
  const mockCurrentUser = { sub: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeBenefitController],
      providers: [{ provide: EmployeeBenefitService, useValue: mockService }],
    }).compile();

    controller = module.get<EmployeeBenefitController>(EmployeeBenefitController);
    service = module.get<EmployeeBenefitService>(EmployeeBenefitService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um benefício de funcionário', async () => {
      const createDto = {
        employeeId: 'emp-1',
        benefitId: 'benefit-1',
        companyId: 'company-1',
        branchId: 'branch-1',
      };
      mockService.create.mockResolvedValue(mockBenefit);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockBenefit);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de benefícios', async () => {
      mockService.findAll.mockResolvedValue([mockBenefit]);

      const result = await controller.findAll();

      expect(result).toEqual([mockBenefit]);
    });

    it('deve filtrar por funcionário', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll('emp-1');

      expect(service.findAll).toHaveBeenCalledWith('emp-1', undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('deve retornar um benefício', async () => {
      mockService.findOne.mockResolvedValue(mockBenefit);

      const result = await controller.findOne('eb-1');

      expect(result).toEqual(mockBenefit);
    });
  });

  describe('update', () => {
    it('deve atualizar um benefício', async () => {
      const updateDto = {} as any;
      mockService.update.mockResolvedValue({ ...mockBenefit, ...updateDto });

      const result = await controller.update('eb-1', updateDto);

      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('deve remover um benefício', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('eb-1');

      expect(service.remove).toHaveBeenCalledWith('eb-1');
    });
  });
});
