import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { VehicleModelService } from './vehicle-model.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

describe('VehicleModelService', () => {
  let service: VehicleModelService;
  let prisma: PrismaMock;

  const mockBrand = {
    id: 'brand-123',
    name: 'Volvo',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModel = {
    id: 'model-123',
    brandId: 'brand-123',
    name: 'FH 540',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brand: mockBrand,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleModelService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<VehicleModelService>(VehicleModelService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de modelos ativos', async () => {
      prisma.vehicleModel.findMany.mockResolvedValue([mockModel]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('FH 540');
    });

    it('deve filtrar por marca', async () => {
      prisma.vehicleModel.findMany.mockResolvedValue([mockModel]);

      await service.findAll('brand-123');

      expect(prisma.vehicleModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brandId: 'brand-123',
          }),
        }),
      );
    });

    it('deve incluir inativos quando solicitado', async () => {
      prisma.vehicleModel.findMany.mockResolvedValue([mockModel, { ...mockModel, active: false }]);

      await service.findAll(undefined, true);

      expect(prisma.vehicleModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            active: true,
          }),
        }),
      );
    });

    it('deve incluir dados da marca', async () => {
      prisma.vehicleModel.findMany.mockResolvedValue([mockModel]);

      const result = await service.findAll();

      expect(result[0]?.brand).toBeDefined();
      expect(result[0]?.brand.name).toBe('Volvo');
    });
  });

  describe('findOne', () => {
    it('deve retornar modelo por ID', async () => {
      prisma.vehicleModel.findFirst.mockResolvedValue(mockModel);

      const result = await service.findOne('model-123');

      expect(result.id).toBe(mockModel.id);
      expect(result.name).toBe(mockModel.name);
    });

    it('deve lançar NotFoundException quando modelo não existe', async () => {
      prisma.vehicleModel.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Modelo não encontrado');
    });
  });

  describe('create', () => {
    const createDto = { brandId: 'brand-123', name: 'FH 460' };

    it('deve criar modelo com sucesso', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(mockBrand);
      prisma.vehicleModel.findFirst.mockResolvedValue(null);
      prisma.vehicleModel.create.mockResolvedValue({ ...mockModel, name: 'FH 460' });

      const result = await service.create(createDto);

      expect(result.name).toBe('FH 460');
      expect(prisma.vehicleModel.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Marca não encontrada');
    });

    it('deve lançar ConflictException quando modelo já existe para marca', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(mockBrand);
      prisma.vehicleModel.findFirst.mockResolvedValue(mockModel);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Modelo já cadastrado para esta marca',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar modelo com sucesso', async () => {
      prisma.vehicleModel.findFirst
        .mockResolvedValueOnce(mockModel) // Modelo atual
        .mockResolvedValueOnce(null); // Não existe outro com mesmo nome
      prisma.vehicleModel.update.mockResolvedValue({ ...mockModel, name: 'FH 500' });

      const result = await service.update('model-123', { name: 'FH 500' });

      expect(result.name).toBe('FH 500');
    });

    it('deve lançar NotFoundException quando modelo não existe', async () => {
      prisma.vehicleModel.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve validar nova marca ao atualizar brandId', async () => {
      prisma.vehicleModel.findFirst.mockResolvedValue(mockModel);
      prisma.vehicleBrand.findFirst.mockResolvedValue(null);

      await expect(service.update('model-123', { brandId: 'invalid-brand' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException quando novo nome já existe na marca', async () => {
      prisma.vehicleModel.findFirst
        .mockResolvedValueOnce(mockModel) // Modelo atual
        .mockResolvedValueOnce({ ...mockModel, id: 'other-model' }); // Outro com mesmo nome

      await expect(service.update('model-123', { name: 'FH 460' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover modelo com sucesso', async () => {
      prisma.vehicleModel.findFirst.mockResolvedValue(mockModel);
      prisma.vehicle.count.mockResolvedValue(0);
      prisma.vehicleModel.delete.mockResolvedValue(mockModel);

      await service.remove('model-123');

      expect(prisma.vehicleModel.delete).toHaveBeenCalledWith({
        where: { id: 'model-123' },
      });
    });

    it('deve lançar NotFoundException quando modelo não existe', async () => {
      prisma.vehicleModel.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando modelo está em uso', async () => {
      prisma.vehicleModel.findFirst.mockResolvedValue(mockModel);
      prisma.vehicle.count.mockResolvedValue(3);

      await expect(service.remove('model-123')).rejects.toThrow(ConflictException);
      await expect(service.remove('model-123')).rejects.toThrow(/Não é possível excluir modelo/);
    });
  });
});
