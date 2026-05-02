import { addHours } from 'date-fns';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import logger from '../lib/logger';
import { DuplicateSubmissionError } from '../errors/AppError';

export interface IdempotentRequestOptions {
  ttlHours?: number;
  userId: string;
  requestId: string;
  resourceType: string;
}

export interface IdempotentResult<T = unknown> {
  isDuplicate: boolean;
  result?: T;
  status: 'pending' | 'success' | 'failed';
}

export class IdempotentService {
  private defaultTtlHours = 24;

  async checkOrCreate<T>(
    options: IdempotentRequestOptions,
    executor: () => Promise<T>
  ): Promise<IdempotentResult<T>> {
    const { requestId, userId, resourceType, ttlHours } = options;
    const ttl = ttlHours || this.defaultTtlHours;
    
    const lockKey = `idempotent:lock:${requestId}`;
    const lockValue = `${userId}:${Date.now()}`;
    
    const lockAcquired = await redis.set(lockKey, lockValue, 'EX', 30, 'NX');
    
    if (!lockAcquired) {
      const existing = await prisma.idempotentRequest.findUnique({
        where: { requestId },
      });
      
      if (existing) {
        if (existing.status === 'pending') {
          return { isDuplicate: true, status: 'pending' };
        }
        return {
          isDuplicate: true,
          result: existing.response as T,
          status: existing.status as 'success' | 'failed',
        };
      }
      
      throw new DuplicateSubmissionError(requestId);
    }
    
    try {
      const existing = await prisma.idempotentRequest.findUnique({
        where: { requestId },
      });
      
      if (existing) {
        await redis.del(lockKey);
        return {
          isDuplicate: true,
          result: existing.response as T,
          status: existing.status as 'success' | 'failed',
        };
      }
      
      await prisma.idempotentRequest.create({
        data: {
          requestId,
          userId,
          resourceType,
          status: 'pending',
          expiresAt: addHours(new Date(), ttl),
        },
      });
      
      try {
        const result = await executor();
        
        await prisma.idempotentRequest.update({
          where: { requestId },
          data: {
            status: 'success',
            response: JSON.stringify(result),
          },
        });
        
        return { isDuplicate: false, result, status: 'success' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await prisma.idempotentRequest.update({
          where: { requestId },
          data: {
            status: 'failed',
            response: JSON.stringify({ error: errorMessage }),
          },
        });
        
        throw error;
      }
    } finally {
      await redis.del(lockKey);
    }
  }

  async getExistingRequest(requestId: string) {
    return prisma.idempotentRequest.findUnique({
      where: { requestId },
    });
  }

  async cleanExpiredRequests() {
    const result = await prisma.idempotentRequest.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    
    logger.info(`Cleaned up ${result.count} expired idempotent requests`);
    return result.count;
  }
}

export const idempotentService = new IdempotentService();
export default idempotentService;
