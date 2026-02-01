import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UnitOfMeasurementService } from './unit-of-measurement.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

describe('UnitOfMeasurementService', () => {
  let service: UnitOfMeasurementService;
  let prisma: PrismaMock;

  const mockUnit = {
    id: 'unit-123',
    code: 'UN',
    name: 'Unidade',
    description: 'Unidade padrão',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitOfMeasurementService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UnitOfMeasurementService>(UnitOfMeasurementService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de unidades ativas', async () => {
      prisma.unitOfMeasurement.findMany.mockResolvedValue([mockUnit]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('UN');
      expect(prisma.unitOfMeasurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
        }),
      );
    });

    it('deve incluir inativas quando solicitado', async () => {
      prisma.unitOfMeasurement.findMany.mockResolvedValue([
        mockUnit,
        { ...mockUnit, active: false },
      ]);

      const result = await service.findAll(true);

      expect(result).toHaveLength(2);
      expect(prisma.unitOfMeasurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('deve ordenar por código ascendente', async () => {
      prisma.unitOfMeasurement.findMany.mockResolvedValue([mockUnit]);

      await service.findAll();

      expect(prisma.unitOfMeasurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { code: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar unidade por ID', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(mockUnit);

      const result = await service.findOne('unit-123');

      expect(result.id).toBe(mockUnit.id);
      expect(result.code).toBe(mockUnit.code);
    });

    it('deve lançar NotFoundException quando unidade não existe', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Unidade de medida não encontrada',
      );
    });
  });

  describe('create', () => {
    const createDto = { code: 'KG', name: 'Quilograma' };

    it('deve criar unidade com sucesso', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(null);
      prisma.unitOfMeasurement.create.mockResolvedValue({ ...mockUnit, ...createDto });

      const result = await service.create(createDto);

      expect(result.code).toBe('KG');
      expect(prisma.unitOfMeasurement.create).toHaveBeenCalled();
    });

    it('deve lançar ConflictException quando código já existe', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(mockUnit);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Código da unidade de medida já cadastrado',
      );
    });

    it('deve criar unidade ativa por padrão', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(null);
      prisma.unitOfMeasurement.create.mockResolvedValue(mockUnit);

      await service.create(createDto);

      expect(prisma.unitOfMeasurement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            active: true,
          }),
        }),
      );
    });

    it('deve criar unidade com userId', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(null);
      prisma.unitOfMeasurement.create.mockResolvedValue(mockUnit);

      await service.create(createDto, 'user-123');

      expect(prisma.unitOfMeasurement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy: 'user-123',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('deve atualizar unidade com sucesso', async () => {
      prisma.unitOfMeasurement.findFirst
        .mockResolvedValueOnce(mockUnit)
        .mockResolvedValueOnce(null);
      prisma.unitOfMeasurement.update.mockResolvedValue({ ...mockUnit, name: 'Litro' });

      const result = await service.update('unit-123', { name: 'Litro' });

      expect(result.name).toBe('Litro');
    });

    it('deve lançar NotFoundException quando unidade não existe', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando novo código já existe', async () => {
      prisma.unitOfMeasurement.findFirst
        .mockResolvedValueOnce(mockUnit)
        .mockResolvedValueOnce({ ...mockUnit, id: 'other-unit' });

      await expect(service.update('unit-123', { code: 'LT' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('deve remover unidade com sucesso', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(mockUnit);
      prisma.product.count.mockResolvedValue(0);
      prisma.unitOfMeasurement.delete.mockResolvedValue(mockUnit);

      await service.remove('unit-123');

      expect(prisma.unitOfMeasurement.delete).toHaveBeenCalledWith({
        where: { id: 'unit-123' },
      });
    });

    it('deve lançar NotFoundException quando unidade não existe', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando unidade está em uso', async () => {
      prisma.unitOfMeasurement.findFirst.mockResolvedValue(mockUnit);
      prisma.product.count.mockResolvedValue(5);

      await expect(service.remove('unit-123')).rejects.toThrow(ConflictException);
      await expect(service.remove('unit-123')).rejects.toThrow(
        /Não é possível excluir unidade de medida/,
      );
    });
  });
});
