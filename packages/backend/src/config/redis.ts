import Redis from 'ioredis';
import { config } from './env.js';

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, ttlSeconds?: number): Promise<'OK'>;
  del(key: string): Promise<number>;
}

class MemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, ttlSeconds?: number) {
    const expiresAt = mode === 'EX' && ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK' as const;
  }

  async del(key: string) {
    return this.store.delete(key) ? 1 : 0;
  }
}

export const redis: RedisLike = config.redis.url
  ? new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 2000);
      },
    })
  : new MemoryRedis();

if (config.redis.url) {
  (redis as Redis).on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  (redis as Redis).on('connect', () => {
    console.log('Redis connected');
  });
}
