import Redis from 'ioredis';
import { config } from '../config';

class RedisService {
  private client: Redis | null = null;
  private memoryCache: Map<string, { value: unknown; expiry: number }> = new Map();
  
  async connect(): Promise<boolean> {
    try {
      this.client = new Redis(config.redis.url, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.log('Redis 连接失败，降级到内存缓存');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });
      
      await this.client.connect();
      console.log('Redis 连接成功');
      return true;
    } catch (error) {
      console.warn('Redis 连接失败，使用内存缓存作为降级方案:', error);
      this.client = null;
      return false;
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const data = await this.client.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
      } catch (error) {
        console.warn('Redis get 失败:', error);
      }
    }
    
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value as T;
    }
    this.memoryCache.delete(key);
    return null;
  }
  
  async set(key: string, value: unknown, ttl: number = 3600): Promise<void> {
    const expiry = Date.now() + ttl * 1000;
    
    if (this.client) {
      try {
        await this.client.setex(key, ttl, JSON.stringify(value));
        return;
      } catch (error) {
        console.warn('Redis set 失败:', error);
      }
    }
    
    this.memoryCache.set(key, { value, expiry });
    if (this.memoryCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.memoryCache) {
        if (v.expiry <= now) {
          this.memoryCache.delete(k);
        }
      }
    }
  }
  
  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.warn('Redis del 失败:', error);
      }
    }
    this.memoryCache.delete(key);
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }
  }
}

export const redisService = new RedisService();
