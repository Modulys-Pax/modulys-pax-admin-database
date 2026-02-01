import { Test, TestingModule } from '@nestjs/testing';
import { VehicleBrandController } from './vehicle-brand.controller';
import { VehicleBrandService } from './vehicle-brand.service';

describe('VehicleBrandController', () => {
  let controller: VehicleBrandController;
  let service: VehicleBrandService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockBrand = { id: 'brand-1', name: 'Volvo' };
  const mockCurrentUser = { sub: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleBrandController],
      providers: [{ provide: VehicleBrandService, useValue: mockService }],
    }).compile();

    controller = module.get<VehicleBrandController>(VehicleBrandController);
    service = module.get<VehicleBrandService>(VehicleBrandService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar uma marca', async () => {
      const createDto = { name: 'Volvo' };
      mockService.create.mockResolvedValue(mockBrand);

      const result = await controller.create(createDto, mockCurrentUser);

      expect(result).toEqual(mockBrand);
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as marcas', async () => {
      mockService.findAll.mockResolvedValue([mockBrand]);

      const result = await controller.findAll();

      expect(result).toEqual([mockBrand]);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma marca', async () => {
      mockService.findOne.mockResolvedValue(mockBrand);

      const result = await controller.findOne('brand-1');

      expect(result).toEqual(mockBrand);
    });
  });

  describe('update', () => {
    it('deve atualizar uma marca', async () => {
      const updateDto = { name: 'Scania' };
      mockService.update.mockResolvedValue({ ...mockBrand, ...updateDto });

      const result = await controller.update('brand-1', updateDto, mockCurrentUser);

      expect(result.name).toBe('Scania');
    });
  });

  describe('remove', () => {
    it('deve remover uma marca', async () => {
      mockService.remove.mockResolvedValue(undefined);

      await controller.remove('brand-1');

      expect(service.remove).toHaveBeenCalledWith('brand-1');
    });
  });
});
