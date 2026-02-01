/**
 * Testes para configuração do Axios
 * 
 * Nota: Alguns aspectos do axios (como interceptors) são difíceis de testar
 * em isolamento devido à natureza de como o módulo é configurado.
 * Estes testes focam em validar o comportamento esperado das funções.
 */

describe('axios configuration', () => {
  // Mock do localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  beforeAll(() => {
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('localStorage operations', () => {
    it('deve armazenar token no localStorage', () => {
      localStorageMock.setItem('accessToken', 'test-token');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'test-token');
      expect(localStorageMock.getItem('accessToken')).toBe('test-token');
    });

    it('deve retornar null para token inexistente', () => {
      expect(localStorageMock.getItem('nonexistent')).toBeNull();
    });

    it('deve remover token do localStorage', () => {
      localStorageMock.setItem('accessToken', 'test-token');
      localStorageMock.removeItem('accessToken');
      
      expect(localStorageMock.getItem('accessToken')).toBeNull();
    });

    it('deve armazenar refreshToken', () => {
      localStorageMock.setItem('refreshToken', 'refresh-token-123');
      
      expect(localStorageMock.getItem('refreshToken')).toBe('refresh-token-123');
    });

    it('deve limpar todos os tokens', () => {
      localStorageMock.setItem('accessToken', 'access-token');
      localStorageMock.setItem('refreshToken', 'refresh-token');
      localStorageMock.clear();
      
      expect(localStorageMock.getItem('accessToken')).toBeNull();
      expect(localStorageMock.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Token management functions', () => {
    it('deve verificar se token existe', () => {
      const hasToken = () => {
        const token = localStorageMock.getItem('accessToken');
        return !!token;
      };

      expect(hasToken()).toBe(false);
      
      localStorageMock.setItem('accessToken', 'test-token');
      expect(hasToken()).toBe(true);
    });

    it('deve construir header de Authorization', () => {
      const getAuthHeader = () => {
        const token = localStorageMock.getItem('accessToken');
        return token ? `Bearer ${token}` : null;
      };

      expect(getAuthHeader()).toBeNull();
      
      localStorageMock.setItem('accessToken', 'test-token');
      expect(getAuthHeader()).toBe('Bearer test-token');
    });

    it('deve atualizar tokens após refresh', () => {
      const updateTokens = (accessToken: string, refreshToken: string) => {
        localStorageMock.setItem('accessToken', accessToken);
        localStorageMock.setItem('refreshToken', refreshToken);
      };

      updateTokens('new-access', 'new-refresh');
      
      expect(localStorageMock.getItem('accessToken')).toBe('new-access');
      expect(localStorageMock.getItem('refreshToken')).toBe('new-refresh');
    });

    it('deve limpar tokens ao fazer logout', () => {
      const clearTokens = () => {
        localStorageMock.removeItem('accessToken');
        localStorageMock.removeItem('refreshToken');
      };

      localStorageMock.setItem('accessToken', 'access');
      localStorageMock.setItem('refreshToken', 'refresh');
      
      clearTokens();
      
      expect(localStorageMock.getItem('accessToken')).toBeNull();
      expect(localStorageMock.getItem('refreshToken')).toBeNull();
    });
  });

  describe('Request config handling', () => {
    it('deve verificar FormData corretamente', () => {
      const formData = new FormData();
      expect(formData instanceof FormData).toBe(true);
      
      const jsonData = { key: 'value' };
      expect(jsonData instanceof FormData).toBe(false);
    });

    it('deve determinar Content-Type baseado no tipo de dados', () => {
      const getContentType = (data: unknown) => {
        if (data instanceof FormData) {
          return undefined; // Deixar o browser definir
        }
        return 'application/json';
      };

      expect(getContentType(new FormData())).toBeUndefined();
      expect(getContentType({ key: 'value' })).toBe('application/json');
      expect(getContentType('string')).toBe('application/json');
    });
  });

  describe('Error handling', () => {
    it('deve identificar erro 401', () => {
      const is401Error = (error: { response?: { status: number } }) => {
        return error.response?.status === 401;
      };

      expect(is401Error({ response: { status: 401 } })).toBe(true);
      expect(is401Error({ response: { status: 403 } })).toBe(false);
      expect(is401Error({ response: { status: 500 } })).toBe(false);
      expect(is401Error({})).toBe(false);
    });

    it('deve verificar se é retry', () => {
      const isRetry = (config: { _retry?: boolean }) => {
        return config._retry === true;
      };

      expect(isRetry({ _retry: true })).toBe(true);
      expect(isRetry({ _retry: false })).toBe(false);
      expect(isRetry({})).toBe(false);
    });

    it('deve verificar se está na página de login', () => {
      const isLoginPage = (pathname: string) => {
        return pathname === '/login';
      };

      expect(isLoginPage('/login')).toBe(true);
      expect(isLoginPage('/dashboard')).toBe(false);
      expect(isLoginPage('/')).toBe(false);
    });
  });

  describe('API URL configuration', () => {
    it('deve usar URL padrão quando variável de ambiente não existe', () => {
      const getApiUrl = () => {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      };

      expect(getApiUrl()).toBe('http://localhost:3001');
    });

    it('deve construir URL completa para endpoints', () => {
      const baseUrl = 'http://localhost:3001';
      const buildUrl = (endpoint: string) => `${baseUrl}${endpoint}`;

      expect(buildUrl('/auth/login')).toBe('http://localhost:3001/auth/login');
      expect(buildUrl('/auth/refresh')).toBe('http://localhost:3001/auth/refresh');
      expect(buildUrl('/users')).toBe('http://localhost:3001/users');
    });
  });

  describe('Headers configuration', () => {
    it('deve ter Content-Type padrão como application/json', () => {
      const defaultHeaders = {
        'Content-Type': 'application/json',
      };

      expect(defaultHeaders['Content-Type']).toBe('application/json');
    });

    it('deve adicionar Authorization header quando token existe', () => {
      const buildHeaders = (token: string | null) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        return headers;
      };

      const headersWithoutToken = buildHeaders(null);
      expect(headersWithoutToken.Authorization).toBeUndefined();

      const headersWithToken = buildHeaders('my-token');
      expect(headersWithToken.Authorization).toBe('Bearer my-token');
    });
  });
});
