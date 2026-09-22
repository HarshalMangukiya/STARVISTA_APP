import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  prisma.$on('query', (e: any) => {
    logger.debug(`Prisma Query: ${e.query} -- Params: ${e.params} -- Duration: ${e.duration}ms`);
  });
}

// @ts-ignore
prisma.$on('error', (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected successfully via Prisma');
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
};
