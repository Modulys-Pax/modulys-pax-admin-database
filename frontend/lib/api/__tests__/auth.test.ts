import { authApi, LoginDto, AuthResponse, UserResponse } from '../auth';
import api from '../../axios';

// Mock do módulo axios
jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuthResponse: AuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      companyId: 'company-123',
      branchId: 'branch-123',
      role: {
        id: 'role-123',
        name: 'admin',
        description: 'Administrator',
      },
      permissions: ['vehicles.view', 'vehicles.create'],
    },
  };

  const mockUserResponse: UserResponse = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    companyId: 'company-123',
    branchId: 'branch-123',
    role: {
      id: 'role-123',
      name: 'admin',
      description: 'Administrator',
    },
    permissions: ['vehicles.view'],
  };

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authApi.login(loginDto);

      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve retornar tokens e dados do usuário', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('deve propagar erro de login', async () => {
      const error = new Error('Invalid credentials');
      (mockApi.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        authApi.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('deve renovar token com sucesso', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authApi.refresh('old-refresh-token');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve retornar novos tokens', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockAuthResponse });

      const result = await authApi.refresh('old-token');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('deve propagar erro de refresh', async () => {
      const error = new Error('Token expired');
      (mockApi.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(authApi.refresh('invalid-token')).rejects.toThrow('Token expired');
    });
  });

  describe('me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockUserResponse });

      const result = await authApi.me();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUserResponse);
    });

    it('deve retornar informações completas do usuário', async () => {
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockUserResponse });

      const result = await authApi.me();

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.role.name).toBe('admin');
    });

    it('deve propagar erro de autenticação', async () => {
      const error = new Error('Unauthorized');
      (mockApi.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(authApi.me()).rejects.toThrow('Unauthorized');
    });
  });
});
