import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
};

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(redisOptions);
    
    redisInstance.on('connect', () => {
      logger.info('Redis connected successfully');
    });
    
    redisInstance.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
    
    redisInstance.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });
  }
  return redisInstance;
}

export const redis = getRedisClient();
export default redis;
