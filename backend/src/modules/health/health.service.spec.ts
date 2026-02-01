import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { createMockPrismaService, PrismaMock } from '../../shared/testing/prisma.mock';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get(PrismaService) as unknown as PrismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('deve retornar status ok quando banco está conectado', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('deve retornar status error quando banco está desconectado', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await service.check();

      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
      expect(result.error).toBe('Connection refused');
    });

    it('deve retornar timestamp no formato ISO', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.check();

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
