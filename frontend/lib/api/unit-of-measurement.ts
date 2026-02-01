import api from '../axios';

export interface UnitOfMeasurement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUnitOfMeasurementDto {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdateUnitOfMeasurementDto {
  code?: string;
  name?: string;
  description?: string;
  active?: boolean;
}

export const unitOfMeasurementApi = {
  getAll: async (): Promise<UnitOfMeasurement[]> => {
    const response = await api.get<UnitOfMeasurement[]>('/units-of-measurement');
    return response.data;
  },

  getById: async (id: string): Promise<UnitOfMeasurement> => {
    const response = await api.get<UnitOfMeasurement>(`/units-of-measurement/${id}`);
    return response.data;
  },

  create: async (data: CreateUnitOfMeasurementDto): Promise<UnitOfMeasurement> => {
    const response = await api.post<UnitOfMeasurement>('/units-of-measurement', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUnitOfMeasurementDto): Promise<UnitOfMeasurement> => {
    const response = await api.patch<UnitOfMeasurement>(`/units-of-measurement/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/units-of-measurement/${id}`);
  },
};
