import { maintenanceApi, MaintenanceOrder, CreateMaintenanceOrderDto } from '../maintenance';
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

describe('maintenanceApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrder: MaintenanceOrder = {
    id: 'order-123',
    orderNumber: 'OM-001',
    vehicleId: 'vehicle-123',
    vehiclePlate: 'ABC-1234',
    type: 'PREVENTIVE',
    status: 'OPEN',
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as ordens', async () => {
      const mockResponse = {
        data: [mockOrder],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await maintenanceApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance', {
        params: {
          branchId: undefined,
          vehicleId: undefined,
          status: undefined,
          includeDeleted: undefined,
          page: 1,
          limit: 15,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar por status', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await maintenanceApi.getAll(undefined, undefined, 'IN_PROGRESS');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance', {
        params: expect.objectContaining({ status: 'IN_PROGRESS' }),
      });
    });

    it('deve filtrar por veículo', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await maintenanceApi.getAll(undefined, 'vehicle-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance', {
        params: expect.objectContaining({ vehicleId: 'vehicle-123' }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar ordem por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockOrder });

      const result = await maintenanceApi.getById('order-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance/order-123');
      expect(result).toEqual(mockOrder);
    });
  });

  describe('create', () => {
    it('deve criar ordem de manutenção', async () => {
      const createDto: CreateMaintenanceOrderDto = {
        vehicleId: 'vehicle-123',
        type: 'CORRECTIVE',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockOrder });

      const result = await maintenanceApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance', createDto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('update', () => {
    it('deve atualizar ordem', async () => {
      const updateData = { description: 'Troca de óleo' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockOrder, description: 'Troca de óleo' },
      });

      const result = await maintenanceApi.update('order-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/maintenance/order-123', updateData);
      expect(result.description).toBe('Troca de óleo');
    });
  });

  describe('delete', () => {
    it('deve deletar ordem', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await maintenanceApi.delete('order-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/maintenance/order-123');
    });
  });

  describe('ações de workflow', () => {
    it('deve iniciar ordem', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({
        data: { ...mockOrder, status: 'IN_PROGRESS' },
      });

      const result = await maintenanceApi.start('order-123');

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance/order-123/start', {});
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('deve pausar ordem', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({
        data: { ...mockOrder, status: 'PAUSED' },
      });

      const result = await maintenanceApi.pause('order-123', { notes: 'Aguardando peça' });

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance/order-123/pause', { notes: 'Aguardando peça' });
      expect(result.status).toBe('PAUSED');
    });

    it('deve completar ordem', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({
        data: { ...mockOrder, status: 'COMPLETED' },
      });

      const result = await maintenanceApi.complete('order-123');

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance/order-123/complete', {});
      expect(result.status).toBe('COMPLETED');
    });

    it('deve cancelar ordem', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({
        data: { ...mockOrder, status: 'CANCELLED' },
      });

      const result = await maintenanceApi.cancel('order-123', { notes: 'Veículo vendido' });

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance/order-123/cancel', { notes: 'Veículo vendido' });
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('getByVehicle', () => {
    it('deve buscar ordens do veículo', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockOrder] });

      const result = await maintenanceApi.getByVehicle('vehicle-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance/vehicle/vehicle-123');
      expect(result).toEqual([mockOrder]);
    });
  });

  describe('uploadAttachment', () => {
    it('deve fazer upload de anexo', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockOrder });

      await maintenanceApi.uploadAttachment('order-123', mockFile);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/maintenance/order-123/attachment',
        expect.any(FormData)
      );
    });
  });
});
