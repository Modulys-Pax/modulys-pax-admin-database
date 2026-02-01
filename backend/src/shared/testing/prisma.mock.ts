/**
 * Mock do PrismaService para testes unitários
 *
 * Este mock cria objetos proxy que permitem encadear chamadas
 * como prisma.user.findUnique() e configurar retornos com mockResolvedValue
 */

import { PrismaService } from '../prisma/prisma.service';

type MockPrismaModel = {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  upsert: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
};

type MockPrismaClient = {
  [key: string]: MockPrismaModel;
} & {
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $executeRaw: jest.Mock;
  $queryRaw: jest.Mock;
};

/**
 * Cria um mock de modelo do Prisma com todos os métodos
 */
export function createMockPrismaModel(): MockPrismaModel {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };
}

/**
 * Cria um mock completo do PrismaService
 */
export function createMockPrismaService(): MockPrismaClient {
  const mockModels = [
    'user',
    'role',
    'permission',
    'rolePermission',
    'refreshToken',
    'company',
    'branch',
    'branchBalance',
    'balanceAdjustment',
    'product',
    'employee',
    'vehicle',
    'vehicleBrand',
    'vehicleModel',
    'vehiclePlate',
    'vehicleDocument',
    'vehicleStatusHistory',
    'vehicleReplacementItem',
    'vehicleMarking',
    'maintenanceOrder',
    'maintenanceWorker',
    'maintenanceService',
    'maintenanceMaterial',
    'maintenanceTimeline',
    'maintenanceLabel',
    'maintenanceLabelReplacementItem',
    'warehouse',
    'stock',
    'stockMovement',
    'financialTransaction',
    'accountPayable',
    'accountReceivable',
    'salary',
    'vacation',
    'expense',
    'benefit',
    'employeeBenefit',
    'unitOfMeasurement',
    'auditLog',
    'conversation',
    'conversationParticipant',
    'message',
    'messageAttachment',
  ];

  const mock: any = {
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(mock);
      }
      return Promise.all(callback);
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };

  mockModels.forEach((model) => {
    mock[model] = createMockPrismaModel();
  });

  return mock as MockPrismaClient;
}

/**
 * Provider para usar em TestingModule
 */
export const mockPrismaProvider = {
  provide: PrismaService,
  useFactory: createMockPrismaService,
};

/**
 * Tipo para extrair o mock de um modelo específico
 */
export type PrismaMock = ReturnType<typeof createMockPrismaService>;
