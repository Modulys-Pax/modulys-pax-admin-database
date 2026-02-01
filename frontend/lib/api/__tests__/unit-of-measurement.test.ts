import {
  unitOfMeasurementApi,
  UnitOfMeasurement,
  CreateUnitOfMeasurementDto,
} from '../unit-of-measurement';
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

describe('unitOfMeasurementApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUnit: UnitOfMeasurement = {
    id: 'unit-123',
    code: 'L',
    name: 'Litro',
    description: 'Unidade de volume',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as unidades de medida', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [mockUnit] });

      const result = await unitOfMeasurementApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/units-of-measurement');
      expect(result).toEqual([mockUnit]);
    });
  });

  describe('getById', () => {
    it('deve buscar unidade de medida por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockUnit });

      const result = await unitOfMeasurementApi.getById('unit-123');

      expect(mockApi.get).toHaveBeenCalledWith('/units-of-measurement/unit-123');
      expect(result).toEqual(mockUnit);
    });
  });

  describe('create', () => {
    it('deve criar unidade de medida', async () => {
      const createDto: CreateUnitOfMeasurementDto = {
        code: 'KG',
        name: 'Quilograma',
        description: 'Unidade de massa',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockUnit });

      const result = await unitOfMeasurementApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/units-of-measurement', createDto);
      expect(result).toEqual(mockUnit);
    });
  });

  describe('update', () => {
    it('deve atualizar unidade de medida', async () => {
      const updateData = { name: 'Litro (L)' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockUnit, name: 'Litro (L)' },
      });

      const result = await unitOfMeasurementApi.update('unit-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/units-of-measurement/unit-123', updateData);
      expect(result.name).toBe('Litro (L)');
    });

    it('deve desativar unidade de medida', async () => {
      const updateData = { active: false };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockUnit, active: false },
      });

      const result = await unitOfMeasurementApi.update('unit-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/units-of-measurement/unit-123', updateData);
      expect(result.active).toBe(false);
    });
  });

  describe('delete', () => {
    it('deve deletar unidade de medida', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await unitOfMeasurementApi.delete('unit-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/units-of-measurement/unit-123');
    });
  });
});
