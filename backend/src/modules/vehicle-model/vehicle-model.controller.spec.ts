import { Test, TestingModule } from '@nestjs/testing';
import { VehicleModelController } from './vehicle-model.controller';
import { VehicleModelService } from './vehicle-model.service';

describe('VehicleModelController', () => {
  let controller: VehicleModelController;
  let service: VehicleModelService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockModel = { id: 'model-1', name: 'FH 540', brandId: 'brand-1' };
  const mockCurrentUser = { sub: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleModelController],
      providers: [{ provide: VehicleModelService, useValue: mockService }],
    }).compile();

    controller = module.get<VehicleModelController>(VehicleModelController);
    service = module.get<VehicleModelService>(VehicleModelService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um modelo', async () => {
      const createDto = { name: 'FH 540', brandId: 'brand-1' };
      mockService.create.mockResolvedValue(mockModel);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockModel);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os modelos', async () => {
      mockService.findAll.mockResolvedValue([mockModel]);

      const result = await controller.findAll();

      expect(result).toEqual([mockModel]);
    });

    it('deve filtrar por marca', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll('brand-1');

      expect(service.findAll).toHaveBeenCalledWith('brand-1', false);
    });
  });

  describe('findOne', () => {
    it('deve retornar um modelo', async () => {
      mockService.findOne.mockResolvedValue(mockModel);

      const result = await controller.findOne('model-1');

      expect(result).toEqual(mockModel);
    });
  });

  describe('update', () => {
    it('deve atualizar um modelo', async () => {
      const updateDto = { name: 'FH 500' };
      mockService.update.mockResolvedValue({ ...mockModel, ...updateDto });

      const result = await controller.update('model-1', updateDto, mockCurrentUser);

      expect(result.name).toBe('FH 500');
    });
  });

  describe('remove', () => {
    it('deve remover um modelo', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('model-1');

      expect(service.remove).toHaveBeenCalledWith('model-1');
    });
  });
});
