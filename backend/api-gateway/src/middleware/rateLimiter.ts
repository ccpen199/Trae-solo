import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

const rateLimiterPublic = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit:public',
  points: config.rateLimit.max,
  duration: 60,
  blockDuration: 60,
});

const rateLimiterAuthenticated = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit:auth',
  points: config.rateLimit.maxForAuthenticated,
  duration: 60,
  blockDuration: 60,
});

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.user?.userId || req.context.ipAddress;
  const limiter = req.user ? rateLimiterAuthenticated : rateLimiterPublic;

  limiter
    .consume(key)
    .then(() => {
      next();
    })
    .catch((rateLimiterRes) => {
      const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
      res.set('Retry-After', String(retryAfter));

      logger.warn('Rate limit exceeded', {
        key,
        retryAfter,
        remainingPoints: rateLimiterRes.remainingPoints,
      });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again after ${retryAfter} seconds.`,
          details: {
            retryAfter,
          },
        },
        timestamp: new Date().toISOString(),
        requestId: req.context.requestId,
      };

      res.status(429).json(response);
    });
};

export const createCustomRateLimiter = (options: {
  maxRequests: number;
  windowSeconds: number;
  keyPrefix: string;
}) => {
  const limiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: options.keyPrefix,
    points: options.maxRequests,
    duration: options.windowSeconds,
    blockDuration: options.windowSeconds,
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.userId || req.context.ipAddress;

    limiter
      .consume(key)
      .then(() => {
        next();
      })
      .catch((rateLimiterRes) => {
        const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
        res.set('Retry-After', String(retryAfter));

        logger.warn('Custom rate limit exceeded', {
          key,
          keyPrefix: options.keyPrefix,
          retryAfter,
        });

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Please try again after ${retryAfter} seconds.`,
          },
          timestamp: new Date().toISOString(),
          requestId: req.context.requestId,
        };

        res.status(429).json(response);
      });
  };
};
