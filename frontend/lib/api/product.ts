import api from '../axios';
import { PaginatedResponse } from './branch';

export interface Product {
  id: string;
  name: string;
  code?: string;
  description?: string;
  unitOfMeasurementId?: string;
  unit?: string;
  unitPrice?: number;
  minQuantity?: number;
  totalStock?: number;
  companyId: string;
  branchId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  deletedAt?: Date;
}

export interface CreateProductDto {
  name: string;
  code?: string;
  description?: string;
  unitOfMeasurementId?: string;
  unit?: string;
  unitPrice?: number;
  minQuantity?: number;
  companyId: string;
  branchId: string;
  active?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductUsageStat {
  productId: string;
  productName: string;
  unit?: string;
  totalQuantityUsed: number;
  totalCost: number;
  averageUnitCost: number;
  usageCount: number;
  periodQuantityUsed: number;
  periodCost: number;
}

export interface TotalByUnit {
  unit: string;
  totalQuantity: number;
}

export interface ProductSummaryPeriod {
  period: string;
  totalCost: number;
  totalQuantity: number;
  /** Quantidade total por unidade de medida no período */
  totalQuantityByUnit: TotalByUnit[];
  productsCount: number;
}

export interface ProductSummaryResponse {
  totalCost: number;
  /** Quantidade total usada por unidade de medida (L, KG, UN, etc.) */
  totalQuantityByUnit: TotalByUnit[];
  totalProducts: number;
  totalUsages: number;
  products: PaginatedResponse<ProductUsageStat>;
  periods: ProductSummaryPeriod[];
}

export const productApi = {
  getAll: async (
    branchId?: string,
    includeDeleted?: boolean,
    page = 1,
    limit = 15,
  ): Promise<PaginatedResponse<Product>> => {
    const response = await api.get<PaginatedResponse<Product>>('/products', {
      params: { branchId, includeDeleted, page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    const response = await api.post<Product>('/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductDto): Promise<Product> => {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  getSummary: async (
    branchId?: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 15,
  ): Promise<ProductSummaryResponse> => {
    const response = await api.get<ProductSummaryResponse>('/products/summary/statistics', {
      params: { branchId, startDate, endDate, page, limit },
    });
    return response.data;
  },
};
