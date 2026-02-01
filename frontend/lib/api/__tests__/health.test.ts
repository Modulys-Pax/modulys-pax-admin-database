import { checkHealth, HealthResponse } from '../health';
import api from '../../axios';

jest.mock('../../axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('health API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHealth', () => {
    it('deve retornar status saudável', async () => {
      const mockResponse: HealthResponse = {
        status: 'ok',
        timestamp: '2024-01-15T10:00:00Z',
        database: 'connected',
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await checkHealth();

      expect(mockApi.get).toHaveBeenCalledWith('/health');
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
    });

    it('deve retornar erro quando banco está desconectado', async () => {
      const mockResponse: HealthResponse = {
        status: 'error',
        timestamp: '2024-01-15T10:00:00Z',
        database: 'disconnected',
        error: 'Connection refused',
      };
      (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await checkHealth();

      expect(result.status).toBe('error');
      expect(result.error).toBe('Connection refused');
    });
  });
});
