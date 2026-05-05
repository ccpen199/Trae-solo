import { Request, Response, NextFunction } from 'express';
import { redisService } from '../lib/redis';
import { ApiError, asyncHandler } from './errorHandler';
import { config } from '../config';

interface RateLimitRule {
  key: string;
  windowMs: number;
  maxRequests: number;
}

export const rateLimitMiddleware = (options?: Partial<{
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}>) => {
  const windowMs = options?.windowMs || config.rateLimit.windowMs;
  const maxRequests = options?.maxRequests || config.rateLimit.maxRequests;
  const keyGenerator = options?.keyGenerator || ((req: Request) => {
    const appKey = req.headers['x-app-key'] as string;
    if (appKey) {
      return `ratelimit:app:${appKey}`;
    }
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `ratelimit:ip:${ip}`;
  });

  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const windowSeconds = Math.floor(windowMs / 1000);

      try {
        const currentCount = await redisService.incr(key);
        
        if (currentCount === 1) {
          await redisService.expire(key, windowSeconds);
        }

        if (currentCount > maxRequests) {
          const client = await redisService.getClient();
          const ttl = await client.ttl(key);
          res.setHeader('X-RateLimit-Limit', maxRequests.toString());
          res.setHeader('X-RateLimit-Remaining', '0');
          res.setHeader('X-RateLimit-Reset', (Date.now() + ttl * 1000).toString());
          res.setHeader('Retry-After', ttl.toString());
          
          throw ApiError.tooManyRequests(
            `请求过于频繁，请在${ttl}秒后重试`,
            'RATE_LIMIT_EXCEEDED'
          );
        }

        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', (maxRequests - currentCount).toString());

        next();
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }
        console.error('流控检查失败，降级通过:', error);
        next();
      }
    }
  );
};

export const apiCallLogging = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const appKey = req.headers['x-app-key'] as string;
    
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      const userId = (req as any).user?.id;
      
      try {
        const { prisma } = await import('../lib/prisma');
        
        await prisma.apiCallLog.create({
          data: {
            appKey: appKey || 'unknown',
            userId: userId || undefined,
            apiEndpoint: req.path,
            apiMethod: req.method,
            requestedScopes: [],
            responseStatus: res.statusCode,
            responseTimeMs: responseTime,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            isSuccess: res.statusCode < 400
          }
        });
      } catch (error) {
        console.error('API调用日志写入失败:', error);
      }
    });

    next();
  }
);

export const createAppRateLimiter = (appId: string, limit: number, windowMs: number = 60000) => {
  return rateLimitMiddleware({
    windowMs,
    maxRequests: limit,
    keyGenerator: () => `ratelimit:app:${appId}`
  });
};
