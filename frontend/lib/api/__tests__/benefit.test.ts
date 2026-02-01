import { benefitApi, Benefit, CreateBenefitDto } from '../benefit';
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

describe('benefitApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBenefit: Benefit = {
    id: 'benefit-123',
    name: 'Vale Transporte',
    dailyCost: 15.00,
    employeeValue: 6.00,
    includeWeekends: false,
    description: 'Vale transporte diário',
    active: true,
    companyId: 'company-123',
    branchId: 'branch-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todos os benefícios', async () => {
      const mockResponse = {
        data: [mockBenefit],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await benefitApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/benefits', {
        params: { branchId: undefined, active: undefined, page: 1, limit: 15 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar por branchId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await benefitApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/benefits', {
        params: expect.objectContaining({ branchId: 'branch-123' }),
      });
    });

    it('deve filtrar por ativos', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await benefitApi.getAll(undefined, true);

      expect(mockApi.get).toHaveBeenCalledWith('/benefits', {
        params: expect.objectContaining({ active: true }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar benefício por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockBenefit });

      const result = await benefitApi.getById('benefit-123');

      expect(mockApi.get).toHaveBeenCalledWith('/benefits/benefit-123');
      expect(result).toEqual(mockBenefit);
    });
  });

  describe('create', () => {
    it('deve criar benefício', async () => {
      const createDto: CreateBenefitDto = {
        name: 'Vale Refeição',
        dailyCost: 35.00,
        employeeValue: 0,
        includeWeekends: false,
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockBenefit });

      const result = await benefitApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/benefits', createDto);
      expect(result).toEqual(mockBenefit);
    });
  });

  describe('update', () => {
    it('deve atualizar benefício', async () => {
      const updateData = { dailyCost: 20.00 };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockBenefit, dailyCost: 20.00 },
      });

      const result = await benefitApi.update('benefit-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/benefits/benefit-123', updateData);
      expect(result.dailyCost).toBe(20.00);
    });
  });

  describe('delete', () => {
    it('deve deletar benefício', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await benefitApi.delete('benefit-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/benefits/benefit-123');
    });
  });
});
