import api from '../axios';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  userName?: string;
  userEmail?: string;
  companyId?: string;
  branchId?: string;
  oldValues?: any;
  newValues?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  createdAt: string;
}

export interface AuditLogFilter {
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  companyId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditApi = {
  async getLogs(filter?: AuditLogFilter): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();
    
    if (filter?.entityType) params.append('entityType', filter.entityType);
    if (filter?.entityId) params.append('entityId', filter.entityId);
    if (filter?.action) params.append('action', filter.action);
    if (filter?.userId) params.append('userId', filter.userId);
    if (filter?.companyId) params.append('companyId', filter.companyId);
    if (filter?.branchId) params.append('branchId', filter.branchId);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const response = await api.get<AuditLogListResponse>(
      `/audit?${params.toString()}`
    );
    return response.data;
  },

  async getLogById(id: string): Promise<AuditLogEntry> {
    const response = await api.get<AuditLogEntry>(`/audit/${id}`);
    return response.data;
  },

  async getEntityHistory(
    entityType: string,
    entityId: string,
    page = 1,
    limit = 50
  ): Promise<AuditLogListResponse> {
    const response = await api.get<AuditLogListResponse>(
      `/audit/entity/${entityType}/${entityId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};
