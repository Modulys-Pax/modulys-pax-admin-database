import { PrismaClient } from '.prisma/admin-client';

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
export { PrismaClient } from '.prisma/admin-client';

// Re-export todos os tipos gerados pelo Prisma
export * from '.prisma/admin-client';
