import api from '../axios';

export enum ExpenseType {
  TRANSPORT = 'TRANSPORT',
  MEAL = 'MEAL',
  ACCOMMODATION = 'ACCOMMODATION',
  OTHER = 'OTHER',
}

export interface Expense {
  id: string;
  employeeId?: string;
  employeeName?: string;
  type: ExpenseType;
  amount: number;
  description: string;
  expenseDate: string;
  documentNumber?: string;
  companyId: string;
  branchId: string;
  financialTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  deletedAt?: string;
}

export interface CreateExpenseDto {
  employeeId?: string;
  type: ExpenseType;
  amount: number;
  description: string;
  expenseDate: string;
  documentNumber?: string;
  companyId: string;
  branchId: string;
}

export interface UpdateExpenseDto {
  type?: ExpenseType;
  amount?: number;
  description?: string;
  expenseDate?: string;
  documentNumber?: string;
}

export const expenseApi = {
  getAll: async (
    branchId?: string,
    employeeId?: string,
    type?: string,
    startDate?: string,
    endDate?: string,
    includeDeleted = false,
  ): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (employeeId) params.append('employeeId', employeeId);
    if (type) params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (includeDeleted) params.append('includeDeleted', 'true');

    const response = await api.get<Expense[]>(`/expenses?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Expense> => {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseDto): Promise<Expense> => {
    const response = await api.post<Expense>('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseDto): Promise<Expense> => {
    const response = await api.patch<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },
};
