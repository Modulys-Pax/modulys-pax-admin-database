import api from '../axios';
import { PaginatedResponse } from './branch';

export interface Benefit {
  id: string;
  name: string;
  dailyCost: number;
  employeeValue: number;
  includeWeekends: boolean;
  description?: string;
  active: boolean;
  companyId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  deletedAt?: Date;
}

export interface CreateBenefitDto {
  name: string;
  dailyCost: number;
  employeeValue: number;
  includeWeekends?: boolean;
  description?: string;
  active?: boolean;
  companyId: string;
  branchId: string;
}

export interface UpdateBenefitDto extends Partial<CreateBenefitDto> {}

export const benefitApi = {
  getAll: async (
    branchId?: string,
    active?: boolean,
    page = 1,
    limit = 15,
  ): Promise<PaginatedResponse<Benefit>> => {
    const response = await api.get<PaginatedResponse<Benefit>>('/benefits', {
      params: { branchId, active, page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Benefit> => {
    const response = await api.get<Benefit>(`/benefits/${id}`);
    return response.data;
  },

  create: async (data: CreateBenefitDto): Promise<Benefit> => {
    const response = await api.post<Benefit>('/benefits', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBenefitDto): Promise<Benefit> => {
    const response = await api.patch<Benefit>(`/benefits/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/benefits/${id}`);
  },
};
