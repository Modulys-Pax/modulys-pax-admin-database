import { vehicleDocumentApi, VehicleDocument, CreateVehicleDocumentDto } from '../vehicle-document';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('vehicleDocumentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDocument: VehicleDocument = {
    id: 'doc-123',
    vehicleId: 'vehicle-123',
    type: 'CRVL',
    fileName: 'crvl-2024.pdf',
    filePath: '/uploads/crvl-2024.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    description: 'CRVL 2024',
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todos os documentos de um veículo', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockDocument] });

      const result = await vehicleDocumentApi.getAll('vehicle-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/vehicle-123/documents');
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('getById', () => {
    it('deve buscar documento por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockDocument });

      const result = await vehicleDocumentApi.getById('vehicle-123', 'doc-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicles/vehicle-123/documents/doc-123');
      expect(result).toEqual(mockDocument);
    });
  });

  describe('upload', () => {
    it('deve fazer upload de documento', async () => {
      const file = new File(['test'], 'crvl.pdf', { type: 'application/pdf' });
      const dto: CreateVehicleDocumentDto = { type: 'CRVL', description: 'CRVL 2024' };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockDocument });

      const result = await vehicleDocumentApi.upload('vehicle-123', file, dto);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/vehicles/vehicle-123/documents',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(mockDocument);
    });

    it('deve fazer upload com data de validade', async () => {
      const file = new File(['test'], 'licensing.pdf', { type: 'application/pdf' });
      const dto: CreateVehicleDocumentDto = {
        type: 'LICENSING',
        expiryDate: '2025-12-31',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockDocument });

      await vehicleDocumentApi.upload('vehicle-123', file, dto);

      expect(mockApi.post).toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it('deve fazer download de documento', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockBlob });

      const result = await vehicleDocumentApi.download('vehicle-123', 'doc-123');

      expect(mockApi.get).toHaveBeenCalledWith(
        '/vehicles/vehicle-123/documents/doc-123/download',
        { responseType: 'blob' }
      );
      expect(result).toEqual(mockBlob);
    });
  });

  describe('update', () => {
    it('deve atualizar descrição do documento', async () => {
      const updateData = { description: 'CRVL 2024 atualizado' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockDocument, description: 'CRVL 2024 atualizado' },
      });

      const result = await vehicleDocumentApi.update('vehicle-123', 'doc-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith(
        '/vehicles/vehicle-123/documents/doc-123',
        updateData
      );
      expect(result.description).toBe('CRVL 2024 atualizado');
    });

    it('deve atualizar data de validade', async () => {
      const updateData = { expiryDate: '2026-06-30' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({ data: mockDocument });

      await vehicleDocumentApi.update('vehicle-123', 'doc-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith(
        '/vehicles/vehicle-123/documents/doc-123',
        updateData
      );
    });
  });

  describe('delete', () => {
    it('deve deletar documento', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await vehicleDocumentApi.delete('vehicle-123', 'doc-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/vehicles/vehicle-123/documents/doc-123');
    });
  });
});
