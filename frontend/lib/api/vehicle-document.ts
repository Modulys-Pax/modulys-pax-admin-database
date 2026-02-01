import api from '../axios';

export type VehicleDocumentType = 'CRVL' | 'LICENSING';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: VehicleDocumentType;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  expiryDate?: Date;
  companyId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleDocumentDto {
  type: VehicleDocumentType;
  description?: string;
  expiryDate?: string;
}

export const vehicleDocumentApi = {
  getAll: async (vehicleId: string): Promise<VehicleDocument[]> => {
    const response = await api.get<VehicleDocument[]>(
      `/vehicles/${vehicleId}/documents`,
    );
    return response.data;
  },

  getById: async (vehicleId: string, id: string): Promise<VehicleDocument> => {
    const response = await api.get<VehicleDocument>(
      `/vehicles/${vehicleId}/documents/${id}`,
    );
    return response.data;
  },

  upload: async (
    vehicleId: string,
    file: File,
    data: CreateVehicleDocumentDto,
  ): Promise<VehicleDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', data.type);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.expiryDate) {
      formData.append('expiryDate', data.expiryDate);
    }

    const response = await api.post<VehicleDocument>(
      `/vehicles/${vehicleId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  download: async (vehicleId: string, id: string): Promise<Blob> => {
    const response = await api.get(
      `/vehicles/${vehicleId}/documents/${id}/download`,
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },

  update: async (
    vehicleId: string,
    id: string,
    data: { description?: string; expiryDate?: string },
  ): Promise<VehicleDocument> => {
    const response = await api.patch<VehicleDocument>(
      `/vehicles/${vehicleId}/documents/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (vehicleId: string, id: string): Promise<void> => {
    await api.delete(`/vehicles/${vehicleId}/documents/${id}`);
  },
};
