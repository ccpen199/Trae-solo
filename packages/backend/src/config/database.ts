import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const jsonFieldNames = new Set([
  'location',
  'samlConfig',
  'settings',
  'tags',
  'deviceInfo',
  'images',
  'videos',
  'sensitiveWords',
  'evidenceImages',
  'metadata',
  'deliveryTypes',
  'pickupPoints',
  'specs',
  'deliveryAddress',
  'conditions',
  'banners',
  'config',
  'detail',
  'targetIds',
  'data',
  'matchedWords',
]);

function serializeJsonFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(serializeJsonFields);
  }
  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (jsonFieldNames.has(key) && fieldValue !== undefined && fieldValue !== null && typeof fieldValue !== 'string') {
      next[key] = JSON.stringify(fieldValue);
    } else {
      next[key] = serializeJsonFields(fieldValue);
    }
  }
  return next;
}

function deserializeJsonFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deserializeJsonFields);
  }
  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    if (jsonFieldNames.has(key) && typeof fieldValue === 'string') {
      try {
        next[key] = JSON.parse(fieldValue);
      } catch {
        next[key] = fieldValue;
      }
    } else {
      next[key] = deserializeJsonFields(fieldValue);
    }
  }
  return next;
}

const prismaClient = new PrismaClient({
  datasources: {
    db: { url: config.database.url },
  },
});

export const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        const serializedArgs = serializeJsonFields(args);
        const result = await query(serializedArgs as typeof args);
        return deserializeJsonFields(result);
      },
    },
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
