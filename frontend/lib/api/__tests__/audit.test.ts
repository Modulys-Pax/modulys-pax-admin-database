import { auditApi, AuditLogEntry, AuditAction, AuditLogListResponse } from '../audit';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('auditApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuditLog: AuditLogEntry = {
    id: 'audit-123',
    entityType: 'Vehicle',
    entityId: 'vehicle-123',
    action: AuditAction.CREATE,
    userId: 'user-123',
    userName: 'João Silva',
    userEmail: 'joao@example.com',
    companyId: 'company-123',
    branchId: 'branch-123',
    newValues: { plate: 'ABC-1234' },
    createdAt: '2024-01-15T10:30:00Z',
  };

  const mockListResponse: AuditLogListResponse = {
    data: [mockAuditLog],
    total: 1,
    page: 1,
    limit: 50,
    totalPages: 1,
  };

  describe('getLogs', () => {
    it('deve buscar logs sem filtro', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      const result = await auditApi.getLogs();

      expect(mockApi.get).toHaveBeenCalledWith('/audit?');
      expect(result).toEqual(mockListResponse);
    });

    it('deve filtrar por entityType', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      await auditApi.getLogs({ entityType: 'Vehicle' });

      expect(mockApi.get).toHaveBeenCalledWith('/audit?entityType=Vehicle');
    });

    it('deve filtrar por action', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      await auditApi.getLogs({ action: AuditAction.CREATE });

      expect(mockApi.get).toHaveBeenCalledWith('/audit?action=CREATE');
    });

    it('deve filtrar por período', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      await auditApi.getLogs({ startDate: '2024-01-01', endDate: '2024-12-31' });

      expect(mockApi.get).toHaveBeenCalledWith('/audit?startDate=2024-01-01&endDate=2024-12-31');
    });

    it('deve filtrar por branchId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      await auditApi.getLogs({ branchId: 'branch-123' });

      expect(mockApi.get).toHaveBeenCalledWith('/audit?branchId=branch-123');
    });

    it('deve aceitar paginação', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      await auditApi.getLogs({ page: 2, limit: 20 });

      expect(mockApi.get).toHaveBeenCalledWith('/audit?page=2&limit=20');
    });

    it('deve combinar múltiplos filtros', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      await auditApi.getLogs({
        entityType: 'Employee',
        action: AuditAction.UPDATE,
        branchId: 'branch-123',
        page: 1,
        limit: 50,
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/audit?entityType=Employee&action=UPDATE&branchId=branch-123&page=1&limit=50'
      );
    });
  });

  describe('getLogById', () => {
    it('deve buscar log por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockAuditLog });

      const result = await auditApi.getLogById('audit-123');

      expect(mockApi.get).toHaveBeenCalledWith('/audit/audit-123');
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('getEntityHistory', () => {
    it('deve buscar histórico de uma entidade', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      const result = await auditApi.getEntityHistory('Vehicle', 'vehicle-123');

      expect(mockApi.get).toHaveBeenCalledWith('/audit/entity/Vehicle/vehicle-123?page=1&limit=50');
      expect(result).toEqual(mockListResponse);
    });

    it('deve aceitar paginação personalizada', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockListResponse });

      await auditApi.getEntityHistory('Employee', 'emp-123', 2, 20);

      expect(mockApi.get).toHaveBeenCalledWith('/audit/entity/Employee/emp-123?page=2&limit=20');
    });
  });
});
