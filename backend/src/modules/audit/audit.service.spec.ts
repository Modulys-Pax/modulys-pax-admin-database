import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';
import { AuditAction } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaMock;

  const mockAuditLog = {
    id: 'audit-123',
    entityType: 'USER',
    entityId: 'user-123',
    action: AuditAction.UPDATE,
    userId: 'admin-123',
    userName: 'Admin',
    userEmail: 'admin@test.com',
    companyId: 'company-123',
    branchId: 'branch-123',
    oldValues: { name: 'Old Name' },
    newValues: { name: 'New Name' },
    changes: { name: { old: 'Old Name', new: 'New Name' } },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    description: 'Usuário atualizado',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      entityType: 'USER',
      entityId: 'user-123',
      action: AuditAction.CREATE,
      userId: 'admin-123',
      userName: 'Admin',
      userEmail: 'admin@test.com',
      companyId: 'company-123',
      branchId: 'branch-123',
      description: 'Usuário criado',
    };

    it('deve criar log de auditoria com sucesso', async () => {
      prisma.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.create(createDto);

      expect(result.id).toBe(mockAuditLog.id);
      expect(result.entityType).toBe('USER');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('deve criar log com valores antigos e novos', async () => {
      const dtoWithValues = {
        ...createDto,
        oldValues: { name: 'Old' },
        newValues: { name: 'New' },
        changes: { name: { old: 'Old', new: 'New' } },
      };
      prisma.auditLog.create.mockResolvedValue(mockAuditLog);

      await service.create(dtoWithValues);

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            oldValues: { name: 'Old' },
            newValues: { name: 'New' },
          }),
        }),
      );
    });

    it('deve criar log com informações de IP e User-Agent', async () => {
      const dtoWithMeta = {
        ...createDto,
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120',
      };
      prisma.auditLog.create.mockResolvedValue({ ...mockAuditLog, ...dtoWithMeta });

      const result = await service.create(dtoWithMeta);

      expect(result.ipAddress).toBe('10.0.0.1');
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de logs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('deve filtrar por entityType', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      await service.findAll({ entityType: 'USER' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'USER',
          }),
        }),
      );
    });

    it('deve filtrar por action', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      await service.findAll({ action: 'UPDATE' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'UPDATE',
          }),
        }),
      );
    });

    it('deve filtrar por userId', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      await service.findAll({ userId: 'admin-123' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'admin-123',
          }),
        }),
      );
    });

    it('deve filtrar por período', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      await service.findAll({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        }),
      );
    });

    it('deve paginar corretamente', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(100);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
    });

    it('deve ordenar por data decrescente', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      await service.findAll({});

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findByEntity', () => {
    it('deve retornar logs de uma entidade específica', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findByEntity('USER', 'user-123');

      expect(result.data).toHaveLength(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            entityType: 'USER',
            entityId: 'user-123',
          },
        }),
      );
    });

    it('deve aceitar parâmetros de página como string', async () => {
      prisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      prisma.auditLog.count.mockResolvedValue(1);

      const result = await service.findByEntity('USER', 'user-123', '2', '20');

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('deve retornar log por ID', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(mockAuditLog);

      const result = await service.findOne('audit-123');

      expect(result.id).toBe(mockAuditLog.id);
    });

    it('deve lançar NotFoundException quando log não existe', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Log de auditoria não encontrado',
      );
    });
  });
});
