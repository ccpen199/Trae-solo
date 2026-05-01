import Redis from 'ioredis';
import { config } from './config';
import { logger } from './logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }
  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export async function getFrequencyCount(
  targetType: string,
  targetValue: string,
  timeWindow: number
): Promise<number> {
  const redis = getRedisClient();
  const key = `freq:${targetType}:${targetValue}:${Math.floor(Date.now() / (timeWindow * 1000))}`;
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}

export async function incrementFrequencyCount(
  targetType: string,
  targetValue: string,
  timeWindow: number
): Promise<number> {
  const redis = getRedisClient();
  const key = `freq:${targetType}:${targetValue}:${Math.floor(Date.now() / (timeWindow * 1000))}`;
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, timeWindow);
  const [count] = await multi.exec() as [number, number][];
  return count[1];
}

export async function setCache(key: string, value: any, ttl?: number): Promise<void> {
  const redis = getRedisClient();
  if (ttl) {
    await redis.setex(key, ttl, JSON.stringify(value));
  } else {
    await redis.set(key, JSON.stringify(value));
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  if (value) {
    return JSON.parse(value) as T;
  }
  return null;
}

export async function deleteCache(key: string): Promise<number> {
  const redis = getRedisClient();
  return redis.del(key);
}

export async function lock(
  key: string,
  ttl: number = 30000
): Promise<{ success: boolean; release: () => Promise<void> }> {
  const redis = getRedisClient();
  const lockKey = `lock:${key}`;
  const lockValue = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

  const result = await redis.set(lockKey, lockValue, 'PX', ttl, 'NX');

  const release = async () => {
    const currentValue = await redis.get(lockKey);
    if (currentValue === lockValue) {
      await redis.del(lockKey);
    }
  };

  return { success: result === 'OK', release };
}

export default getRedisClient;
