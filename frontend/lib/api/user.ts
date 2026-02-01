import api from '../axios';
import { PaginatedResponse } from './branch';

export interface User {
  id: string;
  email: string;
  name: string;
  companyId?: string;
  employeeId?: string;
  branchId?: string;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  deletedAt?: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  companyId?: string;
  branchId?: string;
  roleId: string;
  active?: boolean;
   employeeId?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  companyId?: string;
  branchId?: string;
  roleId?: string;
  active?: boolean;
  newPassword?: string;
  employeeId?: string;
}

export const userApi = {
  getAll: async (
    branchId?: string,
    includeDeleted?: boolean,
    page = 1,
    limit = 15,
    employeeId?: string,
  ): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/users', {
      params: { branchId, includeDeleted, page, limit, employeeId },
    });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
