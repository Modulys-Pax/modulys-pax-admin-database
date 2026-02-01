import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('deve retornar status healthy', () => {
      const expectedResponse = {
        status: 'ok',
        database: 'connected',
        timestamp: expect.any(String),
      };

      mockHealthService.check.mockReturnValue(expectedResponse);

      const result = controller.check();

      expect(result).toEqual(expectedResponse);
      expect(healthService.check).toHaveBeenCalled();
    });

    it('deve retornar status unhealthy quando database falha', () => {
      const expectedResponse = {
        status: 'error',
        database: 'disconnected',
        error: 'Database connection failed',
      };

      mockHealthService.check.mockReturnValue(expectedResponse);

      const result = controller.check();

      expect(result).toEqual(expectedResponse);
    });
  });
});
