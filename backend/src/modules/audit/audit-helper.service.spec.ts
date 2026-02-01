import { Test, TestingModule } from '@nestjs/testing';
import { AuditHelperService } from './audit-helper.service';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

describe('AuditHelperService', () => {
  let service: AuditHelperService;
  let auditService: AuditService;

  const mockAuditService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditHelperService,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuditHelperService>(AuditHelperService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    it('deve criar log de auditoria para ação CREATE', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.CREATE,
        userId: 'user-1',
        userName: 'João',
        userEmail: 'joao@test.com',
        companyId: 'company-1',
        branchId: 'branch-1',
        newValues: { name: 'João', salary: 5000 },
        description: 'Funcionário criado',
      });

      expect(mockAuditService.create).toHaveBeenCalledWith({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.CREATE,
        userId: 'user-1',
        userName: 'João',
        userEmail: 'joao@test.com',
        companyId: 'company-1',
        branchId: 'branch-1',
        oldValues: undefined,
        newValues: { name: 'João', salary: 5000 },
        changes: null,
        ipAddress: undefined,
        userAgent: undefined,
        description: 'Funcionário criado',
      });
    });

    it('deve calcular changes para ação UPDATE', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.UPDATE,
        userId: 'user-1',
        oldValues: { name: 'João', salary: 5000 },
        newValues: { name: 'João Silva', salary: 6000 },
      });

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            name: { old: 'João', new: 'João Silva' },
            salary: { old: 5000, new: 6000 },
          },
        }),
      );
    });

    it('deve ignorar campos de auditoria no cálculo de changes', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.UPDATE,
        oldValues: {
          name: 'João',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        newValues: {
          name: 'João Silva',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
        },
      });

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: {
            name: { old: 'João', new: 'João Silva' },
          },
        }),
      );
    });

    it('deve retornar null para changes quando valores são iguais', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.UPDATE,
        oldValues: { name: 'João', salary: 5000 },
        newValues: { name: 'João', salary: 5000 },
      });

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: null,
        }),
      );
    });

    it('deve criar log para ação DELETE sem changes', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.DELETE,
        userId: 'user-1',
        oldValues: { name: 'João', salary: 5000 },
      });

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DELETE,
          changes: null,
        }),
      );
    });

    it('não deve falhar se auditService.create lançar erro', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAuditService.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.logAction({
          entityType: 'Employee',
          entityId: 'emp-123',
          action: AuditAction.CREATE,
        }),
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Erro ao criar log de auditoria:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('deve incluir ipAddress e userAgent quando fornecidos', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.CREATE,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      );
    });

    it('deve retornar null para changes quando oldValues é null', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.UPDATE,
        oldValues: null,
        newValues: { name: 'João' },
      });

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: null,
        }),
      );
    });

    it('deve retornar null para changes quando newValues é null', async () => {
      mockAuditService.create.mockResolvedValue({ id: 'audit-1' });

      await service.logAction({
        entityType: 'Employee',
        entityId: 'emp-123',
        action: AuditAction.UPDATE,
        oldValues: { name: 'João' },
        newValues: null,
      });

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: null,
        }),
      );
    });
  });
});
