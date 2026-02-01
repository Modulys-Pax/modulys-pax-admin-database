import api from '../axios';

export interface Salary {
  id: string;
  employeeId: string;
  employeeName?: string;
  amount: number;
  referenceMonth: number;
  referenceYear: number;
  paymentDate?: string;
  description?: string;
  companyId: string;
  branchId: string;
  financialTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deletedAt?: string;
}

export interface CreateSalaryDto {
  employeeId: string;
  amount: number;
  referenceMonth: number;
  referenceYear: number;
  description?: string;
  companyId: string;
  branchId: string;
}

export interface UpdateSalaryDto {
  amount?: number;
  description?: string;
}

export interface PaySalaryDto {
  paymentDate?: string;
}

export interface ProcessSalariesDto {
  referenceMonth: number;
  referenceYear: number;
  companyId: string;
  branchId: string;
}

export interface ProcessSalaryEmployeeDetail {
  employeeId: string;
  employeeName: string;
  amount: number;
  status: 'created' | 'already_pending' | 'already_paid' | 'skipped_no_salary';
  salaryId?: string;
  paymentDate?: string;
}

export interface ProcessSalariesResult {
  totalEmployees: number;
  created: number;
  alreadyPending: number;
  alreadyPaid: number;
  skippedNoSalary: number;
  details: ProcessSalaryEmployeeDetail[];
}

export const salaryApi = {
  getAll: async (
    branchId?: string,
    employeeId?: string,
    referenceMonth?: number,
    referenceYear?: number,
    includeDeleted = false,
  ): Promise<Salary[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (employeeId) params.append('employeeId', employeeId);
    if (referenceMonth) params.append('referenceMonth', referenceMonth.toString());
    if (referenceYear) params.append('referenceYear', referenceYear.toString());
    if (includeDeleted) params.append('includeDeleted', 'true');

    const response = await api.get<Salary[]>(`/salaries?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Salary> => {
    const response = await api.get<Salary>(`/salaries/${id}`);
    return response.data;
  },

  create: async (data: CreateSalaryDto): Promise<Salary> => {
    const response = await api.post<Salary>('/salaries', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSalaryDto): Promise<Salary> => {
    const response = await api.patch<Salary>(`/salaries/${id}`, data);
    return response.data;
  },

  pay: async (id: string, data: PaySalaryDto = {}): Promise<Salary> => {
    const response = await api.put<Salary>(`/salaries/${id}/pay`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/salaries/${id}`);
  },

  process: async (data: ProcessSalariesDto): Promise<ProcessSalariesResult> => {
    const response = await api.post<ProcessSalariesResult>('/salaries/process', data);
    return response.data;
  },
};
