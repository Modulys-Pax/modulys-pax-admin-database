import api from '../axios';

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
}

export interface PermissionModule {
  module: string;
  moduleName: string;
  permissions: {
    name: string;
    description: string;
    module: string;
    action: string;
  }[];
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Permission[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  active?: boolean;
  permissions?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  active?: boolean;
  permissions?: string[];
}

export const roleApi = {
  getAll: async (includeInactive?: boolean): Promise<Role[]> => {
    const response = await api.get<Role[]>('/roles', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Role> => {
    const response = await api.get<Role>(`/roles/${id}`);
    return response.data;
  },

  create: async (data: CreateRoleDto): Promise<Role> => {
    const response = await api.post<Role>('/roles', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRoleDto): Promise<Role> => {
    const response = await api.patch<Role>(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  /**
   * Retorna todas as permissões disponíveis no sistema, agrupadas por módulo
   */
  getAllPermissions: async (): Promise<PermissionModule[]> => {
    const response = await api.get<PermissionModule[]>('/roles/permissions');
    return response.data;
  },

  /**
   * Sincroniza as permissões do sistema com o banco de dados
   */
  syncPermissions: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/roles/sync-permissions');
    return response.data;
  },
};
