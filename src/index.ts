import { PrismaClient } from '../generated/client';

// Singleton pattern para evitar múltiplas conexões
const globalForPrisma = globalThis as unknown as {
  adminPrisma: PrismaClient | undefined;
};

export const adminPrisma =
  globalForPrisma.adminPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.adminPrisma = adminPrisma;
}

// Re-export PrismaClient para uso externo
export { PrismaClient } from '../generated/client';

// Re-export todos os tipos gerados pelo Prisma (enums, tipos, namespace Prisma)
export * from '../generated/client';
