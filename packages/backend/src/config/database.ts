import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

export const prisma = new PrismaClient({
  datasources: {
    db: { url: config.database.url },
  },
});

export function getTenantPrisma(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const where = (args as Record<string, Record<string, unknown>>).where;
          if (where && typeof where === 'object') {
            where.tenantId = tenantId;
          }
          return query(args);
        },
      },
    },
  });
}
