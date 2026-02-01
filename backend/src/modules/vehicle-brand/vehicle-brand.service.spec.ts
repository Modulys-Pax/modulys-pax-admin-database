import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { VehicleBrandService } from './vehicle-brand.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

describe('VehicleBrandService', () => {
  let service: VehicleBrandService;
  let prisma: PrismaMock;

  const mockBrand = {
    id: 'brand-123',
    name: 'Volvo',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleBrandService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<VehicleBrandService>(VehicleBrandService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de marcas ativas', async () => {
      prisma.vehicleBrand.findMany.mockResolvedValue([mockBrand]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Volvo');
      expect(prisma.vehicleBrand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
        }),
      );
    });

    it('deve incluir inativas quando solicitado', async () => {
      prisma.vehicleBrand.findMany.mockResolvedValue([mockBrand, { ...mockBrand, active: false }]);

      const result = await service.findAll(true);

      expect(result).toHaveLength(2);
      expect(prisma.vehicleBrand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('deve ordenar por nome ascendente', async () => {
      prisma.vehicleBrand.findMany.mockResolvedValue([mockBrand]);

      await service.findAll();

      expect(prisma.vehicleBrand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar marca por ID', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(mockBrand);

      const result = await service.findOne('brand-123');

      expect(result.id).toBe(mockBrand.id);
      expect(result.name).toBe(mockBrand.name);
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Marca não encontrada');
    });
  });

  describe('create', () => {
    const createDto = { name: 'Scania' };

    it('deve criar marca com sucesso', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(null);
      prisma.vehicleBrand.create.mockResolvedValue({ ...mockBrand, name: 'Scania' });

      const result = await service.create(createDto);

      expect(result.name).toBe('Scania');
      expect(prisma.vehicleBrand.create).toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando nome já existe', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(mockBrand);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('Marca já cadastrada');
    });

    it('deve criar marca ativa por padrão', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(null);
      prisma.vehicleBrand.create.mockResolvedValue(mockBrand);

      await service.create(createDto);

      expect(prisma.vehicleBrand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            active: true,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar marca com sucesso', async () => {
      prisma.vehicleBrand.findFirst
        .mockResolvedValueOnce(mockBrand) // Marca atual
        .mockResolvedValueOnce(null); // Não existe outra com mesmo nome
      prisma.vehicleBrand.update.mockResolvedValue({ ...mockBrand, name: 'Mercedes' });

      const result = await service.update('brand-123', { name: 'Mercedes' });

      expect(result.name).toBe('Mercedes');
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando novo nome já existe', async () => {
      prisma.vehicleBrand.findFirst
        .mockResolvedValueOnce(mockBrand) // Marca atual
        .mockResolvedValueOnce({ ...mockBrand, id: 'other-brand' }); // Outra com mesmo nome

      await expect(service.update('brand-123', { name: 'Mercedes' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deve remover marca com sucesso', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(mockBrand);
      prisma.vehicle.count.mockResolvedValue(0);
      prisma.vehicleBrand.delete.mockResolvedValue(mockBrand);

      await service.remove('brand-123');

      expect(prisma.vehicleBrand.delete).toHaveBeenCalledWith({
        where: { id: 'brand-123' },
      });
    });

    it('deve lançar NotFoundException quando marca não existe', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando marca está em uso', async () => {
      prisma.vehicleBrand.findFirst.mockResolvedValue(mockBrand);
      prisma.vehicle.count.mockResolvedValue(5);

      await expect(service.remove('brand-123')).rejects.toThrow(ConflictException);
      await expect(service.remove('brand-123')).rejects.toThrow(/Não é possível excluir marca/);
    });
  });
});
