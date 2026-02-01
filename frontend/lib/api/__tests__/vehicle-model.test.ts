import { vehicleModelApi, VehicleModel, CreateVehicleModelDto } from '../vehicle-model';
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

describe('vehicleModelApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockModel: VehicleModel = {
    id: 'model-123',
    brandId: 'brand-123',
    brand: {
      id: 'brand-123',
      name: 'Volvo',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    name: 'FH 540',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todos os modelos', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockModel] });

      const result = await vehicleModelApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-models', {
        params: { brandId: undefined, includeInactive: undefined },
      });
      expect(result).toEqual([mockModel]);
    });

    it('deve filtrar por marca', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await vehicleModelApi.getAll('brand-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-models', {
        params: { brandId: 'brand-123', includeInactive: undefined },
      });
    });

    it('deve incluir inativos', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await vehicleModelApi.getAll(undefined, true);

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-models', {
        params: { brandId: undefined, includeInactive: true },
      });
    });
  });

  describe('getById', () => {
    it('deve buscar modelo por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockModel });

      const result = await vehicleModelApi.getById('model-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-models/model-123');
      expect(result).toEqual(mockModel);
    });
  });

  describe('create', () => {
    it('deve criar modelo', async () => {
      const createDto: CreateVehicleModelDto = {
        brandId: 'brand-123',
        name: 'FM 460',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockModel });

      const result = await vehicleModelApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/vehicle-models', createDto);
      expect(result).toEqual(mockModel);
    });
  });

  describe('update', () => {
    it('deve atualizar modelo', async () => {
      const updateData = { name: 'FH 500' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockModel, name: 'FH 500' },
      });

      const result = await vehicleModelApi.update('model-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/vehicle-models/model-123', updateData);
      expect(result.name).toBe('FH 500');
    });
  });

  describe('delete', () => {
    it('deve deletar modelo', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await vehicleModelApi.delete('model-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/vehicle-models/model-123');
    });
  });
});
