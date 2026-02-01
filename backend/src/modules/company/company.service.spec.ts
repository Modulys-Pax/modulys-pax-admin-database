import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CompanyService } from './company.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

describe('CompanyService', () => {
  let service: CompanyService;
  let prisma: PrismaMock;

  const mockCompany = {
    id: 'company-123',
    name: 'Empresa Teste',
    cnpj: '12.345.678/0001-99',
    tradeName: 'Teste LTDA',
    email: 'contato@empresa.com',
    phone: '11999999999',
    address: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Nova Empresa',
      cnpj: '98.765.432/0001-11',
    };

    it('deve criar empresa com sucesso', async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      prisma.company.create.mockResolvedValue({ ...mockCompany, ...createDto });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
    });

    it('deve lançar ConflictException quando CNPJ já existe', async () => {
      prisma.company.findUnique.mockResolvedValue(mockCompany);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('CNPJ já cadastrado');
    });

    it('deve criar empresa sem CNPJ', async () => {
      const dtoSemCnpj = { name: 'Empresa Sem CNPJ' };
      prisma.company.create.mockResolvedValue({ ...mockCompany, cnpj: null });

      const result = await service.create(dtoSemCnpj);

      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de empresas ativas', async () => {
      prisma.company.findMany.mockResolvedValue([mockCompany]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe(mockCompany.name);
    });

    it('deve incluir deletadas quando solicitado', async () => {
      prisma.company.findMany.mockResolvedValue([
        mockCompany,
        { ...mockCompany, deletedAt: new Date() },
      ]);

      const result = await service.findAll(true);

      expect(result).toHaveLength(2);
    });

    it('deve ordenar por nome ascendente', async () => {
      prisma.company.findMany.mockResolvedValue([mockCompany]);

      await service.findAll();

      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar empresa por ID', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);

      const result = await service.findOne('company-123');

      expect(result.id).toBe(mockCompany.id);
      expect(result.name).toBe(mockCompany.name);
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Empresa não encontrada');
    });
  });

  describe('update', () => {
    it('deve atualizar empresa com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({
        ...mockCompany,
        name: 'Nome Atualizado',
      });

      const result = await service.update('company-123', { name: 'Nome Atualizado' });

      expect(result.name).toBe('Nome Atualizado');
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando novo CNPJ já existe em outra empresa', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.company.findUnique.mockResolvedValue({ ...mockCompany, id: 'other-company' });

      await expect(service.update('company-123', { cnpj: '11.111.111/0001-11' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('company-123', { cnpj: '11.111.111/0001-11' })).rejects.toThrow(
        'CNPJ já cadastrado em outra empresa',
      );
    });

    it('deve permitir manter o mesmo CNPJ', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.company.findUnique.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue(mockCompany);

      const result = await service.update('company-123', { cnpj: mockCompany.cnpj });

      expect(result.cnpj).toBe(mockCompany.cnpj);
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete da empresa', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.company.update.mockResolvedValue({ ...mockCompany, deletedAt: new Date() });

      await service.remove('company-123');

      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Empresa não encontrada');
    });
  });
});
