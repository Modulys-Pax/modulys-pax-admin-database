import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Limpar conexão
    await service.$disconnect();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve implementar onModuleInit', async () => {
    // Mockar o $connect para não tentar conectar ao banco real
    const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
  });

  it('deve implementar onModuleDestroy', async () => {
    const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalled();
  });

  it('deve ser uma instância de PrismaClient', () => {
    // Verificar que tem os métodos do PrismaClient
    expect(service.$connect).toBeDefined();
    expect(service.$disconnect).toBeDefined();
  });
});
