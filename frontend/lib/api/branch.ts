import api from '../axios';

export interface Branch {
  id: string;
  name: string;
  code?: string;
  companyId: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  deletedAt?: Date;
}

export interface CreateBranchDto {
  name: string;
  code?: string;
  companyId: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active?: boolean;
}

export interface UpdateBranchDto extends Partial<CreateBranchDto> {}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const branchApi = {
  getAll: async (
    includeDeleted?: boolean,
    page = 1,
    limit = 15,
  ): Promise<PaginatedResponse<Branch>> => {
    const response = await api.get<PaginatedResponse<Branch>>('/branches', {
      params: { includeDeleted, page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Branch> => {
    const response = await api.get<Branch>(`/branches/${id}`);
    return response.data;
  },

  create: async (data: CreateBranchDto): Promise<Branch> => {
    const response = await api.post<Branch>('/branches', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBranchDto): Promise<Branch> => {
    const response = await api.patch<Branch>(`/branches/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/branches/${id}`);
  },
};
