import api from '../axios';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionOriginType {
  MAINTENANCE = 'MAINTENANCE',
  STOCK = 'STOCK',
  HR = 'HR',
  MANUAL = 'MANUAL',
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  transactionDate: Date;
  originType?: TransactionOriginType;
  originId?: string;
  documentNumber?: string;
  notes?: string;
  companyId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateFinancialTransactionDto {
  type: TransactionType;
  amount: number;
  description?: string;
  transactionDate: string;
  originType?: TransactionOriginType;
  originId?: string;
  documentNumber?: string;
  notes?: string;
  companyId: string;
  branchId: string;
}

export interface UpdateFinancialTransactionDto
  extends Partial<CreateFinancialTransactionDto> {}

export const financialApi = {
  getAll: async (
    companyId?: string,
    branchId?: string,
    type?: TransactionType,
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialTransaction[]> => {
    const response = await api.get<FinancialTransaction[]>(
      '/financial-transactions',
      {
        params: { companyId, branchId, type, startDate, endDate },
      },
    );
    return response.data;
  },

  getById: async (id: string): Promise<FinancialTransaction> => {
    const response = await api.get<FinancialTransaction>(
      `/financial-transactions/${id}`,
    );
    return response.data;
  },

  create: async (
    data: CreateFinancialTransactionDto,
  ): Promise<FinancialTransaction> => {
    const response = await api.post<FinancialTransaction>(
      '/financial-transactions',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateFinancialTransactionDto,
  ): Promise<FinancialTransaction> => {
    const response = await api.patch<FinancialTransaction>(
      `/financial-transactions/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/financial-transactions/${id}`);
  },
};
