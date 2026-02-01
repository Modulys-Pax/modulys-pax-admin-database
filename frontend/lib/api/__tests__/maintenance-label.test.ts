import {
  maintenanceLabelApi,
  MaintenanceLabel,
  CreateMaintenanceLabelDto,
  RegisterProductChangeDto,
  MaintenanceDueByVehicle,
} from '../maintenance-label';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('maintenanceLabelApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockLabel: MaintenanceLabel = {
    id: 'label-123',
    vehicleId: 'vehicle-123',
    vehiclePlate: 'ABC-1234',
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    products: [
      {
        id: 'prod-1',
        productId: 'product-123',
        productName: 'Óleo Motor',
        replaceEveryKm: 10000,
        lastChangeKm: 50000,
        nextChangeKm: 60000,
      },
    ],
  };

  describe('getAll', () => {
    it('deve buscar todas as etiquetas', async () => {
      const mockResponse = {
        data: [mockLabel],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await maintenanceLabelApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance-labels', {
        params: { branchId: undefined, vehicleId: undefined, page: 1, limit: 15 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar por veículo', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await maintenanceLabelApi.getAll(undefined, 'vehicle-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance-labels', {
        params: expect.objectContaining({ vehicleId: 'vehicle-123' }),
      });
    });

    it('deve filtrar por filial', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await maintenanceLabelApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance-labels', {
        params: expect.objectContaining({ branchId: 'branch-123' }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar etiqueta por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockLabel });

      const result = await maintenanceLabelApi.getById('label-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance-labels/label-123');
      expect(result).toEqual(mockLabel);
    });
  });

  describe('create', () => {
    it('deve criar etiqueta', async () => {
      const createDto: CreateMaintenanceLabelDto = {
        vehicleId: 'vehicle-123',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockLabel });

      const result = await maintenanceLabelApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance-labels', createDto);
      expect(result).toEqual(mockLabel);
    });

    it('deve criar etiqueta com produtos específicos', async () => {
      const createDto: CreateMaintenanceLabelDto = {
        vehicleId: 'vehicle-123',
        productIds: ['product-1', 'product-2'],
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockLabel });

      await maintenanceLabelApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance-labels', createDto);
    });
  });

  describe('delete', () => {
    it('deve deletar etiqueta', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await maintenanceLabelApi.delete('label-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/maintenance-labels/label-123');
    });
  });

  describe('registerProductChange', () => {
    it('deve registrar troca de produto', async () => {
      const changeDto: RegisterProductChangeDto = {
        vehicleId: 'vehicle-123',
        changeKm: 60000,
        items: [{ vehicleReplacementItemId: 'item-1', cost: 150 }],
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      const mockResponse = { orderId: 'order-123' };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await maintenanceLabelApi.registerProductChange(changeDto);

      expect(mockApi.post).toHaveBeenCalledWith('/maintenance-labels/register-change', changeDto);
      expect(result.orderId).toBe('order-123');
    });
  });

  describe('getDueByVehicle', () => {
    it('deve buscar itens com troca pendente', async () => {
      const mockDue: MaintenanceDueByVehicle = {
        referenceKm: 58000,
        items: [
          {
            productId: 'product-123',
            productName: 'Óleo Motor',
            replaceEveryKm: 10000,
            lastChangeKm: 50000,
            nextChangeKm: 60000,
            status: 'warning',
          },
        ],
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockDue });

      const result = await maintenanceLabelApi.getDueByVehicle('vehicle-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance-labels/due-by-vehicle', {
        params: { vehicleId: 'vehicle-123', branchId: undefined },
      });
      expect(result.items[0].status).toBe('warning');
    });

    it('deve filtrar por filial', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { referenceKm: 0, items: [] } });

      await maintenanceLabelApi.getDueByVehicle('vehicle-123', 'branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/maintenance-labels/due-by-vehicle', {
        params: { vehicleId: 'vehicle-123', branchId: 'branch-123' },
      });
    });
  });
});
