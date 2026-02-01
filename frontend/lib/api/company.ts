import api from '../axios';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  tradeName?: string;
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

export interface CreateCompanyDto {
  name: string;
  cnpj?: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active?: boolean;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

export const companyApi = {
  getAll: async (includeDeleted?: boolean): Promise<Company[]> => {
    const response = await api.get<Company[]>('/companies', {
      params: { includeDeleted },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Company> => {
    const response = await api.get<Company>(`/companies/${id}`);
    return response.data;
  },

  create: async (data: CreateCompanyDto): Promise<Company> => {
    const response = await api.post<Company>('/companies', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCompanyDto): Promise<Company> => {
    const response = await api.patch<Company>(`/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },
};
