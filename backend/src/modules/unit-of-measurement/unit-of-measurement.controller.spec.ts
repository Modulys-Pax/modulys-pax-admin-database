import { Test, TestingModule } from '@nestjs/testing';
import { UnitOfMeasurementController } from './unit-of-measurement.controller';
import { UnitOfMeasurementService } from './unit-of-measurement.service';

describe('UnitOfMeasurementController', () => {
  let controller: UnitOfMeasurementController;
  let service: UnitOfMeasurementService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUnit = { id: 'unit-1', name: 'Litro', code: 'L' };
  const mockCurrentUser = { sub: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitOfMeasurementController],
      providers: [{ provide: UnitOfMeasurementService, useValue: mockService }],
    }).compile();

    controller = module.get<UnitOfMeasurementController>(UnitOfMeasurementController);
    service = module.get<UnitOfMeasurementService>(UnitOfMeasurementService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma unidade de medida', async () => {
      const createDto = { name: 'Litro', code: 'L' };
      mockService.create.mockResolvedValue(mockUnit);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockUnit);
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as unidades', async () => {
      mockService.findAll.mockResolvedValue([mockUnit]);

      const result = await controller.findAll();

      expect(result).toEqual([mockUnit]);
    });

    it('deve incluir inativos quando solicitado', async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.findAll('true');

      expect(service.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma unidade', async () => {
      mockService.findOne.mockResolvedValue(mockUnit);

      const result = await controller.findOne('unit-1');

      expect(result).toEqual(mockUnit);
    });
  });

  describe('update', () => {
    it('deve atualizar uma unidade', async () => {
      const updateDto = { name: 'Litros' };
      mockService.update.mockResolvedValue({ ...mockUnit, ...updateDto });

      const result = await controller.update('unit-1', updateDto, mockCurrentUser);

      expect(result.name).toBe('Litros');
    });
  });

  describe('remove', () => {
    it('deve remover uma unidade', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('unit-1');

      expect(service.remove).toHaveBeenCalledWith('unit-1');
    });
  });
});
