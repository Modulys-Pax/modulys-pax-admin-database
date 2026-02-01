import { vehicleBrandApi, VehicleBrand, CreateVehicleBrandDto } from '../vehicle-brand';
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

describe('vehicleBrandApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBrand: VehicleBrand = {
    id: 'brand-123',
    name: 'Volvo',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as marcas', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockBrand] });

      const result = await vehicleBrandApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-brands', {
        params: { includeInactive: undefined },
      });
      expect(result).toEqual([mockBrand]);
    });

    it('deve incluir inativos quando solicitado', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });

      await vehicleBrandApi.getAll(true);

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-brands', {
        params: { includeInactive: true },
      });
    });
  });

  describe('getById', () => {
    it('deve buscar marca por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockBrand });

      const result = await vehicleBrandApi.getById('brand-123');

      expect(mockApi.get).toHaveBeenCalledWith('/vehicle-brands/brand-123');
      expect(result).toEqual(mockBrand);
    });
  });

  describe('create', () => {
    it('deve criar marca', async () => {
      const createDto: CreateVehicleBrandDto = { name: 'Scania' };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockBrand });

      const result = await vehicleBrandApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/vehicle-brands', createDto);
      expect(result).toEqual(mockBrand);
    });
  });

  describe('update', () => {
    it('deve atualizar marca', async () => {
      const updateData = { name: 'Volvo Trucks' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockBrand, name: 'Volvo Trucks' },
      });

      const result = await vehicleBrandApi.update('brand-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/vehicle-brands/brand-123', updateData);
      expect(result.name).toBe('Volvo Trucks');
    });
  });

  describe('delete', () => {
    it('deve deletar marca', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await vehicleBrandApi.delete('brand-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/vehicle-brands/brand-123');
    });
  });
});
