import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
    process.env.NODE_ENV !== 'production' ? { level: 'info', emit: 'event' } : { level: 'error', emit: 'event' },
  ].filter(Boolean) as any,
});

prisma.$on('error' as any, (e: any) => {
  logger.error(`Prisma error: ${e.message}`, { target: e.target, stack: e.stack });
});

prisma.$on('warn' as any, (e: any) => {
  logger.warn(`Prisma warn: ${e.message}`, { target: e.target });
});

if (process.env.NODE_ENV !== 'production') {
  prisma.$on('info' as any, (e: any) => {
    logger.debug(`Prisma info: ${e.message}`);
  });
}

export { prisma };
