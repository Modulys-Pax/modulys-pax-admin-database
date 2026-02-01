import { userApi, User, CreateUserDto } from '../user';
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

describe('userApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user-123',
    email: 'joao@example.com',
    name: 'João Silva',
    companyId: 'company-123',
    branchId: 'branch-123',
    role: {
      id: 'role-123',
      name: 'Operador',
      description: 'Operador de sistema',
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getAll', () => {
    it('deve buscar todos os usuários', async () => {
      const mockResponse = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 15,
        totalPages: 1,
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await userApi.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/users', {
        params: {
          branchId: undefined,
          includeDeleted: undefined,
          page: 1,
          limit: 15,
          employeeId: undefined,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('deve filtrar por branchId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await userApi.getAll('branch-123');

      expect(mockApi.get).toHaveBeenCalledWith('/users', {
        params: expect.objectContaining({ branchId: 'branch-123' }),
      });
    });

    it('deve filtrar por employeeId', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: { data: [] } });

      await userApi.getAll(undefined, undefined, 1, 15, 'employee-123');

      expect(mockApi.get).toHaveBeenCalledWith('/users', {
        params: expect.objectContaining({ employeeId: 'employee-123' }),
      });
    });
  });

  describe('getById', () => {
    it('deve buscar usuário por ID', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockUser });

      const result = await userApi.getById('user-123');

      expect(mockApi.get).toHaveBeenCalledWith('/users/user-123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('deve criar usuário', async () => {
      const createDto: CreateUserDto = {
        name: 'Maria Santos',
        email: 'maria@example.com',
        password: 'senha123',
        roleId: 'role-123',
        companyId: 'company-123',
        branchId: 'branch-123',
      };
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockUser });

      const result = await userApi.create(createDto);

      expect(mockApi.post).toHaveBeenCalledWith('/users', createDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('deve atualizar usuário', async () => {
      const updateData = { name: 'João Silva Junior' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({
        data: { ...mockUser, name: 'João Silva Junior' },
      });

      const result = await userApi.update('user-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/users/user-123', updateData);
      expect(result.name).toBe('João Silva Junior');
    });

    it('deve atualizar senha', async () => {
      const updateData = { newPassword: 'novaSenha123' };
      (mockApi.patch as jest.Mock).mockResolvedValueOnce({ data: mockUser });

      await userApi.update('user-123', updateData);

      expect(mockApi.patch).toHaveBeenCalledWith('/users/user-123', { newPassword: 'novaSenha123' });
    });
  });

  describe('delete', () => {
    it('deve deletar usuário', async () => {
      (mockApi.delete as jest.Mock).mockResolvedValueOnce({});

      await userApi.delete('user-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/users/user-123');
    });
  });
});
