import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

class RedisClient {
  private client: Redis | null = null;
  private useFallback: boolean = false;
  private memoryCache: Map<string, { value: string; expireAt: number | null }> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('Redis connection failed, using memory fallback');
            this.useFallback = true;
            return null;
          }
          return Math.min(times * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.warn('Redis error, switching to memory fallback:', err.message);
        this.useFallback = true;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.useFallback = false;
      });
    } catch (err) {
      console.warn('Redis init failed, using memory fallback');
      this.useFallback = true;
    }
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    if (this.useFallback || !this.client) {
      this.memoryCache.set(key, {
        value,
        expireAt: expireSeconds ? Date.now() + expireSeconds * 1000 : null
      });
      return;
    }
    if (expireSeconds) {
      await this.client.setex(key, expireSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useFallback || !this.client) {
      const cached = this.memoryCache.get(key);
      if (!cached) return null;
      if (cached.expireAt && Date.now() > cached.expireAt) {
        this.memoryCache.delete(key);
        return null;
      }
      return cached.value;
    }
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (this.useFallback || !this.client) {
      this.memoryCache.delete(key);
      return;
    }
    await this.client.del(key);
  }

  getClient(): Redis | null {
    return this.useFallback ? null : this.client;
  }
}

export const redisClient = new RedisClient();
