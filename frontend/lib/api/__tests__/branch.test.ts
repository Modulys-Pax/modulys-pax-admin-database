import { branchApi, Branch, CreateBranchDto } from '../branch';
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

describe('branchApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBranch: Branch = {
    id: 'branch-123',
    name: 'Filial São Paulo',
    code: 'SP001',
    companyId: 'company-123',
    city: 'São Paulo',
    state: 'SP',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todas as filiais', async () => {
      const mockResponse = {
        data: [mockBranch],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await branchApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/branches', {
        params: { includeDeleted: undefined, page: 1, limit: 15 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve incluir deletados quando solicitado', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await branchApi.getAll(true);

      expect(mockApi.get).toHaveBeenCalledWith('/branches', {
        params: { includeDeleted: true, page: 1, limit: 15 },
      });
    });

    it('deve aceitar paginação personalizada', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await branchApi.getAll(false, 2, 30);

      expect(mockApi.get).toHaveBeenCalledWith('/branches', {
        params: { includeDeleted: false, page: 2, limit: 30 },
      });
    });
  });

  describe('getById', () => {
    it('deve buscar filial por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockBranch });

      const result = await branchApi.getById('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/branches/branch-123');
      expect(result).toEqual(mockBranch);
    });
  });

  describe('create', () => {
    it('deve criar filial', async () => {
      const createDto: CreateBranchDto = {
        name: 'Filial Rio de Janeiro',
        code: 'RJ001',
        companyId: 'company-123',
        city: 'Rio de Janeiro',
        state: 'RJ',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockBranch });

      const result = await branchApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/branches', createDto);
      expect(result).toEqual(mockBranch);
    });
  });

  describe('update', () => {
    it('deve atualizar filial', async () => {
      const updateData = { name: 'Filial SP Atualizada' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockBranch, name: 'Filial SP Atualizada' },
      });

      const result = await branchApi.update('branch-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/branches/branch-123', updateData);
      expect(result.name).toBe('Filial SP Atualizada');
    });
  });

  describe('delete', () => {
    it('deve deletar filial', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await branchApi.delete('branch-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/branches/branch-123');
    });
  });
});
