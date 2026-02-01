import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BranchService } from './branch.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

// Mock da constante DEFAULT_COMPANY_ID
jest.mock('../../shared/constants/company.constants', () => ({
  DEFAULT_COMPANY_ID: 'company-123',
}));

describe('BranchService', () => {
  let service: BranchService;
  let prisma: PrismaMock;

  const mockCompany = {
    id: 'company-123',
    name: 'Test Company',
    deletedAt: null,
  };

  const mockBranch = {
    id: 'branch-123',
    name: 'Filial Centro',
    code: 'FC01',
    companyId: 'company-123',
    email: 'centro@empresa.com',
    phone: '11999999999',
    address: 'Rua Principal, 100',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
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
        BranchService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<BranchService>(BranchService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Filial Norte',
      code: 'FN01',
      companyId: 'company-123',
      city: 'Campinas',
      state: 'SP',
    };

    it('deve criar filial com sucesso', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null); // Código não existe
      prisma.branch.create.mockResolvedValue({ ...mockBranch, ...createDto });

      const result = await service.create(createDto as any);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(prisma.branch.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando empresa não existe', async () => {
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.create(createDto as any)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto as any)).rejects.toThrow('Empresa não encontrada');
    });

    it('deve lançar ConflictException quando código já existe', async () => {
      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(mockBranch);

      await expect(service.create(createDto as any)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto as any)).rejects.toThrow(
        'Código já cadastrado para esta empresa',
      );
    });

    it('deve criar filial sem código', async () => {
      const dtoSemCodigo = { name: 'Filial Sem Código', companyId: 'company-123' };

      prisma.company.findFirst.mockResolvedValue(mockCompany);
      prisma.branch.findFirst.mockResolvedValue(null);
      prisma.branch.create.mockResolvedValue({ ...mockBranch, code: null });

      const result = await service.create(dtoSemCodigo as any);

      expect(result).toHaveProperty('id');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de filiais', async () => {
      prisma.branch.findMany.mockResolvedValue([mockBranch]);
      prisma.branch.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('deve incluir deletados quando solicitado', async () => {
      prisma.branch.findMany.mockResolvedValue([{ ...mockBranch, deletedAt: new Date() }]);
      prisma.branch.count.mockResolvedValue(1);

      await service.findAll(true);

      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('deve aplicar paginação corretamente', async () => {
      prisma.branch.findMany.mockResolvedValue([]);
      prisma.branch.count.mockResolvedValue(50);

      const result = await service.findAll(false, 3, 10);

      expect(result.page).toBe(3);
      expect(result.totalPages).toBe(5);
      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it('deve ordenar por nome ascendente', async () => {
      prisma.branch.findMany.mockResolvedValue([mockBranch]);
      prisma.branch.count.mockResolvedValue(1);

      await service.findAll();

      expect(prisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar filial por ID', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);

      const result = await service.findOne('branch-123');

      expect(result.id).toBe(mockBranch.id);
      expect(result.name).toBe(mockBranch.name);
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow('Filial não encontrada');
    });
  });

  describe('update', () => {
    it('deve atualizar filial com sucesso', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branch.update.mockResolvedValue({
        ...mockBranch,
        name: 'Nome Atualizado',
      });

      const result = await service.update('branch-123', { name: 'Nome Atualizado' });

      expect(result.name).toBe('Nome Atualizado');
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });

    it('deve validar empresa ao atualizar companyId', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.company.findFirst.mockResolvedValue(null);

      await expect(service.update('branch-123', { companyId: 'invalid-company' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('branch-123', { companyId: 'invalid-company' })).rejects.toThrow(
        'Empresa não encontrada',
      );
    });

    it('deve lançar ConflictException quando novo código já existe', async () => {
      prisma.branch.findFirst
        .mockResolvedValueOnce(mockBranch) // Filial atual
        .mockResolvedValueOnce({ ...mockBranch, id: 'other-branch' }); // Outra com mesmo código

      await expect(service.update('branch-123', { code: 'EXISTING-CODE' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve atualizar endereço completo', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branch.update.mockResolvedValue({
        ...mockBranch,
        address: 'Nova Rua',
        city: 'Nova Cidade',
        state: 'RJ',
      });

      const result = await service.update('branch-123', {
        address: 'Nova Rua',
        city: 'Nova Cidade',
        state: 'RJ',
      });

      expect(result.address).toBe('Nova Rua');
      expect(result.city).toBe('Nova Cidade');
    });
  });

  describe('remove', () => {
    it('deve fazer soft delete da filial', async () => {
      prisma.branch.findFirst.mockResolvedValue(mockBranch);
      prisma.branch.update.mockResolvedValue({ ...mockBranch, deletedAt: new Date() });

      await service.remove('branch-123');

      expect(prisma.branch.update).toHaveBeenCalledWith({
        where: { id: 'branch-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('deve lançar NotFoundException quando filial não existe', async () => {
      prisma.branch.findFirst.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.remove('invalid-id')).rejects.toThrow('Filial não encontrada');
    });
  });
});
