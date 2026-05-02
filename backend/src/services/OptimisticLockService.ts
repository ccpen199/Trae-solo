import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { StatusConflictError, AppError } from '../errors/AppError';

export interface OptimisticLockOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface UpdateWithVersionResult<T> {
  success: boolean;
  data?: T;
  conflict: boolean;
  currentVersion?: number;
}

export class OptimisticLockService {
  private defaultMaxRetries = 3;
  private defaultRetryDelayMs = 100;

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: OptimisticLockOptions = {}
  ): Promise<T> {
    const { maxRetries = this.defaultMaxRetries, retryDelayMs = this.defaultRetryDelayMs } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof StatusConflictError) {
          if (attempt < maxRetries) {
            logger.warn(`乐观锁冲突，正在重试 (${attempt + 1}/${maxRetries + 1})...`);
            await this.delay(retryDelayMs * Math.pow(2, attempt));
            continue;
          }
        }
        
        throw error;
      }
    }
    
    throw lastError || new AppError('操作失败，已耗尽重试次数');
  }

  async updateWithVersion<T extends { version: number }>(
    model: keyof typeof prisma,
    id: string,
    currentVersion: number,
    data: Partial<Omit<T, 'id' | 'version'>>,
    resourceType: string = 'resource'
  ): Promise<UpdateWithVersionResult<T>> {
    const prismaModel = prisma[model] as {
      findUnique: (args: { where: { id: string } }) => Promise<T | null>;
      update: (args: {
        where: { id: string; version: number };
        data: Partial<T> & { version: { increment: number } };
      }) => Promise<T>;
    };

    try {
      const updated = await prismaModel.update({
        where: { id, version: currentVersion },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });

      return {
        success: true,
        data: updated,
        conflict: false,
      };
    } catch (error) {
      const currentRecord = await prismaModel.findUnique({ where: { id } });
      
      if (currentRecord) {
        throw new StatusConflictError(
          `${resourceType}状态已被修改，请刷新后重试`,
          resourceType,
          id
        );
      }

      throw new AppError('资源不存在');
    }
  }

  async checkOrderVersion(
    orderId: string,
    expectedVersion: number
  ): Promise<{ valid: boolean; currentVersion?: number }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { version: true },
    });

    if (!order) {
      return { valid: false };
    }

    return {
      valid: order.version === expectedVersion,
      currentVersion: order.version,
    };
  }

  async checkCalendarVersion(
    calendarId: string,
    expectedVersion: number
  ): Promise<{ valid: boolean; currentVersion?: number }> {
    const calendar = await prisma.roomCalendar.findUnique({
      where: { id: calendarId },
      select: { version: true },
    });

    if (!calendar) {
      return { valid: false };
    }

    return {
      valid: calendar.version === expectedVersion,
      currentVersion: calendar.version,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const optimisticLockService = new OptimisticLockService();
export default optimisticLockService;
