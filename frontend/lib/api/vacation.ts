import api from '../axios';

export enum VacationStatus {
  PLANNED = 'PLANNED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Vacation {
  id: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate: string;
  days: number;
  soldDays: number; // Dias vendidos (abono pecuniário, máx 10)
  advance13thSalary: boolean; // Antecipação da 1ª parcela do 13º
  status: VacationStatus;
  observations?: string;
  // Campos financeiros
  monthlySalary?: number;
  vacationBase?: number;
  vacationThird?: number;
  vacationTotal?: number;
  soldDaysValue?: number;
  soldDaysThird?: number;
  soldDaysTotal?: number;
  advance13thValue?: number;
  grossTotal?: number;
  inss?: number;
  irrf?: number;
  totalDeductions?: number;
  netTotal?: number;
  fgts?: number;
  employerCost?: number;
  // Campos padrão
  companyId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deletedAt?: string;
}

export interface CreateVacationDto {
  employeeId: string;
  startDate: string;
  endDate: string;
  days: number;
  soldDays?: number; // Dias vendidos (abono pecuniário, máx 10)
  advance13thSalary?: boolean; // Antecipação da 1ª parcela do 13º
  observations?: string;
  // Campos financeiros
  monthlySalary?: number;
  vacationBase?: number;
  vacationThird?: number;
  vacationTotal?: number;
  soldDaysValue?: number;
  soldDaysThird?: number;
  soldDaysTotal?: number;
  advance13thValue?: number;
  grossTotal?: number;
  inss?: number;
  irrf?: number;
  totalDeductions?: number;
  netTotal?: number;
  fgts?: number;
  employerCost?: number;
  // Campos padrão
  companyId: string;
  branchId: string;
}

export interface UpdateVacationDto {
  startDate?: string;
  endDate?: string;
  days?: number;
  soldDays?: number;
  advance13thSalary?: boolean;
  status?: VacationStatus;
  observations?: string;
  // Campos financeiros
  monthlySalary?: number;
  vacationBase?: number;
  vacationThird?: number;
  vacationTotal?: number;
  soldDaysValue?: number;
  soldDaysThird?: number;
  soldDaysTotal?: number;
  advance13thValue?: number;
  grossTotal?: number;
  inss?: number;
  irrf?: number;
  totalDeductions?: number;
  netTotal?: number;
  fgts?: number;
  employerCost?: number;
}

export const vacationApi = {
  getAll: async (
    branchId?: string,
    employeeId?: string,
    status?: string,
    includeDeleted = false,
  ): Promise<Vacation[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (employeeId) params.append('employeeId', employeeId);
    if (status) params.append('status', status);
    if (includeDeleted) params.append('includeDeleted', 'true');

    const response = await api.get<Vacation[]>(`/vacations?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Vacation> => {
    const response = await api.get<Vacation>(`/vacations/${id}`);
    return response.data;
  },

  create: async (data: CreateVacationDto): Promise<Vacation> => {
    const response = await api.post<Vacation>('/vacations', data);
    return response.data;
  },

  update: async (id: string, data: UpdateVacationDto): Promise<Vacation> => {
    const response = await api.patch<Vacation>(`/vacations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vacations/${id}`);
  },
};
