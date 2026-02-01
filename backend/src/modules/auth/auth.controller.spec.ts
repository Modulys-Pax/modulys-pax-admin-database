import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve realizar login com credenciais válidas', async () => {
      const loginDto: LoginDto = {
        email: 'user@test.com',
        password: 'password123',
      };

      const expectedResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'user@test.com',
          name: 'Test User',
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('deve propagar erro do service', async () => {
      const loginDto: LoginDto = {
        email: 'user@test.com',
        password: 'wrong-password',
      };

      mockAuthService.login.mockRejectedValue(new Error('Credenciais inválidas'));

      await expect(controller.login(loginDto)).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('refresh', () => {
    it('deve renovar token com refresh token válido', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'valid-refresh-token',
      };

      const expectedResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 'user-1',
          email: 'user@test.com',
          name: 'Test User',
        },
      };

      mockAuthService.refresh.mockResolvedValue(expectedResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(result).toEqual(expectedResponse);
      expect(authService.refresh).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('deve propagar erro para refresh token inválido', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid-refresh-token',
      };

      mockAuthService.refresh.mockRejectedValue(new Error('Refresh token inválido'));

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow('Refresh token inválido');
    });
  });

  describe('me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const currentUser = { sub: 'user-1' };

      const expectedResponse = {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: { id: 'role-1', name: 'Admin' },
        permissions: ['users.view', 'users.create'],
      };

      mockAuthService.me.mockResolvedValue(expectedResponse);

      const result = await controller.me(currentUser);

      expect(result).toEqual(expectedResponse);
      expect(authService.me).toHaveBeenCalledWith('user-1');
    });

    it('deve propagar erro se usuário não encontrado', async () => {
      const currentUser = { sub: 'user-999' };

      mockAuthService.me.mockRejectedValue(new Error('Usuário não encontrado'));

      await expect(controller.me(currentUser)).rejects.toThrow('Usuário não encontrado');
    });
  });
});
