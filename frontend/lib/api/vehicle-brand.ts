import api from '../axios';

export interface VehicleBrand {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleBrandDto {
  name: string;
  active?: boolean;
}

export interface UpdateVehicleBrandDto extends Partial<CreateVehicleBrandDto> {}

export const vehicleBrandApi = {
  getAll: async (includeInactive?: boolean): Promise<VehicleBrand[]> => {
    const response = await api.get<VehicleBrand[]>('/vehicle-brands', {
      params: { includeInactive },
    });
    return response.data;
  },

  getById: async (id: string): Promise<VehicleBrand> => {
    const response = await api.get<VehicleBrand>(`/vehicle-brands/${id}`);
    return response.data;
  },

  create: async (data: CreateVehicleBrandDto): Promise<VehicleBrand> => {
    const response = await api.post<VehicleBrand>('/vehicle-brands', data);
    return response.data;
  },

  update: async (id: string, data: UpdateVehicleBrandDto): Promise<VehicleBrand> => {
    const response = await api.patch<VehicleBrand>(`/vehicle-brands/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicle-brands/${id}`);
  },
};
