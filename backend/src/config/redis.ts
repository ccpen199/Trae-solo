import Redis from 'ioredis';

const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

let redis: Redis | null = null;

if (REDIS_ENABLED) {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('Redis connection failed after 3 retries. Running without Redis cache.');
        return null;
      }
      return Math.min(times * 1000, 3000);
    },
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully');
  });

  redis.on('error', (err) => {
    console.warn('Redis connection error:', err.message);
    console.log('Running in fallback mode - Redis cache disabled');
    redis = null;
  });
}

export const getRedis = (): Redis | null => redis;

export const redisCache = {
  async get(key: string): Promise<string | null> {
    if (!redis) return null;
    try {
      return await redis.get(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!redis) return;
    try {
      if (ttl) {
        await redis.setex(key, ttl, value);
      } else {
        await redis.set(key, value);
      }
    } catch {
      // Ignore errors
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {
      // Ignore errors
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!redis) return [];
    try {
      return await redis.keys(pattern);
    } catch {
      return [];
    }
  },
};

export default redis;
