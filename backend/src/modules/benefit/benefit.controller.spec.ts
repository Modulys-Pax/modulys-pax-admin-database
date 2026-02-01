import { Test, TestingModule } from '@nestjs/testing';
import { BenefitController } from './benefit.controller';
import { BenefitService } from './benefit.service';

describe('BenefitController', () => {
  let controller: BenefitController;
  let benefitService: BenefitService;

  const mockBenefitService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBenefit = {
    id: 'benefit-1',
    name: 'Vale Transporte',
    value: 200,
    branchId: 'branch-1',
  };

  const mockCurrentUser = { sub: 'user-1', branchId: 'branch-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BenefitController],
      providers: [{ provide: BenefitService, useValue: mockBenefitService }],
    }).compile();

    controller = module.get<BenefitController>(BenefitController);
    benefitService = module.get<BenefitService>(BenefitService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um benefício', async () => {
      const createDto = {
        name: 'Vale Transporte',
        dailyCost: 20,
        employeeValue: 200,
        branchId: 'branch-1',
        companyId: 'company-1',
      };
      mockBenefitService.create.mockResolvedValue(mockBenefit);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockBenefit);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada', async () => {
      const response = { data: [mockBenefit], meta: { page: 1, total: 1 } };
      mockBenefitService.findAll.mockResolvedValue(response);

      const result = await controller.findAll();

      expect(result).toEqual(response);
    });

    it('deve filtrar por status ativo', async () => {
      mockBenefitService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll(undefined, 'true');

      expect(benefitService.findAll).toHaveBeenCalledWith(undefined, true, 1, 15);
    });
  });

  describe('findOne', () => {
    it('deve retornar um benefício', async () => {
      mockBenefitService.findOne.mockResolvedValue(mockBenefit);

      const result = await controller.findOne('benefit-1', mockCurrentUser);

      expect(result).toEqual(mockBenefit);
    });
  });

  describe('update', () => {
    it('deve atualizar um benefício', async () => {
      const updateDto = { name: 'Vale Refeição' };
      mockBenefitService.update.mockResolvedValue({ ...mockBenefit, name: 'Vale Refeição' });

      const result = await controller.update('benefit-1', updateDto, mockCurrentUser);

      expect(result.name).toBe('Vale Refeição');
    });
  });

  describe('remove', () => {
    it('deve remover um benefício', async () => {
      mockBenefitService.remove.mockResolvedValue(undefined);

      await controller.remove('benefit-1', mockCurrentUser);

      expect(benefitService.remove).toHaveBeenCalledWith('benefit-1', mockCurrentUser);
    });
  });
});
