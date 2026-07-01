import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectPostgres(): Promise<void> {
  await prisma.$connect();
  logger.info('PostgreSQL connected via Prisma');
}

export async function disconnectPostgres(): Promise<void> {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
}
