import { vehicleMarkingApi, VehicleMarking, CreateVehicleMarkingDto } from '../vehicle-marking';
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

describe('vehicleMarkingApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMarking: VehicleMarking = {
    id: 'marking-123',
    vehicleId: 'vehicle-123',
    vehiclePlate: 'ABC-1234',
    km: 150000,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as marcações', async () => {
      const mockResponse = {
        data: [mockMarking],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await vehicleMarkingApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-markings', {
        params: { branchId: undefined, startDate: undefined, endDate: undefined, page: 1, limit: 15 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar por filial', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await vehicleMarkingApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-markings', {
        params: expect.objectContaining({ branchId: 'branch-123' }),
      });
    });

    it('deve filtrar por período', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await vehicleMarkingApi.getAll(undefined, '2024-01-01', '2024-01-31');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-markings', {
        params: expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }),
      });
    });

    it('deve aceitar paginação personalizada', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await vehicleMarkingApi.getAll(undefined, undefined, undefined, 2, 30);

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-markings', {
        params: expect.objectContaining({ page: 2, limit: 30 }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar marcação por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockMarking });

      const result = await vehicleMarkingApi.getById('marking-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-markings/marking-123');
      expect(result).toEqual(mockMarking);
    });
  });

  describe('create', () => {
    it('deve criar marcação de KM', async () => {
      const createDto: CreateVehicleMarkingDto = {
        vehicleId: 'vehicle-123',
        km: 155000,
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockMarking });

      const result = await vehicleMarkingApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/vehicle-markings', createDto);
      expect(result).toEqual(mockMarking);
    });
  });

  describe('delete', () => {
    it('deve deletar marcação', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await vehicleMarkingApi.delete('marking-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/vehicle-markings/marking-123');
    });
  });
});
