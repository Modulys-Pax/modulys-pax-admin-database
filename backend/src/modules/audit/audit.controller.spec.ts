import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: AuditService;

  const mockAuditService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEntity: jest.fn(),
  };

  const mockAuditLog = {
    id: 'audit-1',
    action: 'CREATE',
    entityType: 'User',
    entityId: 'user-1',
    userId: 'admin-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockAuditService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('deve criar um log de auditoria', async () => {
      const createDto = { action: 'CREATE' as any, entityType: 'User', entityId: 'user-1' };
      mockAuditService.create.mockResolvedValue(mockAuditLog);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de logs', async () => {
      const response = { data: [mockAuditLog], meta: { total: 1 } };
      mockAuditService.findAll.mockResolvedValue(response);

      const result = await controller.findAll({});

      expect(result).toEqual(response);
    });
  });

  describe('findByEntity', () => {
    it('deve retornar logs de uma entidade', async () => {
      const response = { data: [mockAuditLog], meta: { total: 1 } };
      mockAuditService.findByEntity.mockResolvedValue(response);

      const result = await controller.findByEntity('User', 'user-1');

      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('deve retornar um log', async () => {
      mockAuditService.findOne.mockResolvedValue(mockAuditLog);

      const result = await controller.findOne('audit-1');

      expect(result).toEqual(mockAuditLog);
    });
  });
});
