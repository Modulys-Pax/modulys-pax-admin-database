import api from '../axios';

export interface VehicleModel {
  id: string;
  brandId: string;
  brand: {
    id: string;
    name: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleModelDto {
  brandId: string;
  name: string;
  active?: boolean;
}

export interface UpdateVehicleModelDto extends Partial<CreateVehicleModelDto> {}

export const vehicleModelApi = {
  getAll: async (brandId?: string, includeInactive?: boolean): Promise<VehicleModel[]> => {
    const response = await api.get<VehicleModel[]>('/vehicle-models', {
      params: { brandId, includeInactive },
    });
    return response.data;
  },

  getById: async (id: string): Promise<VehicleModel> => {
    const response = await api.get<VehicleModel>(`/vehicle-models/${id}`);
    return response.data;
  },

  create: async (data: CreateVehicleModelDto): Promise<VehicleModel> => {
    const response = await api.post<VehicleModel>('/vehicle-models', data);
    return response.data;
  },

  update: async (id: string, data: UpdateVehicleModelDto): Promise<VehicleModel> => {
    const response = await api.patch<VehicleModel>(`/vehicle-models/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicle-models/${id}`);
  },
};
