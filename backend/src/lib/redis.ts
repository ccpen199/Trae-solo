import Redis from 'ioredis';
import { config } from '../config';
import { memoryCache } from './memoryCache';

class RedisWrapper {
  private client: Redis | null = null;
  private useMemory = false;

  constructor() {
    try {
      this.client = new Redis(config.redis.port, config.redis.host, {
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 2) {
            console.log('Redis connection failed, switching to memory cache');
            this.useMemory = true;
            return null;
          }
          return 1000;
        }
      });
      
      this.client.on('error', (err) => {
        console.warn('Redis error, switching to memory cache:', err.message);
        this.useMemory = true;
      });
      
      this.client.on('connect', () => {
        console.log('Redis connected');
        this.useMemory = false;
      });
    } catch (e) {
      console.log('Using memory cache instead of Redis');
      this.useMemory = true;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory) {
      return memoryCache.get(key);
    }
    try {
      return await this.client!.get(key);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.get(key);
    }
  }

  async set(key: string, value: string): Promise<string> {
    if (this.useMemory) {
      return memoryCache.set(key, value);
    }
    try {
      return await this.client!.set(key, value);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.set(key, value);
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    if (this.useMemory) {
      return memoryCache.setex(key, seconds, value);
    }
    try {
      return await this.client!.setex(key, seconds, value);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.setex(key, seconds, value);
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (this.useMemory) {
      let count = 0;
      for (const key of keys) {
        count += await memoryCache.del(key);
      }
      return count;
    }
    try {
      return await this.client!.del(...keys);
    } catch (e) {
      this.useMemory = true;
      let count = 0;
      for (const key of keys) {
        count += await memoryCache.del(key);
      }
      return count;
    }
  }

  async exists(key: string): Promise<number> {
    if (this.useMemory) {
      return memoryCache.exists(key);
    }
    try {
      return await this.client!.exists(key);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.exists(key);
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.useMemory) {
      return memoryCache.expire(key, seconds);
    }
    try {
      return await this.client!.expire(key, seconds);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.expire(key, seconds);
    }
  }

  async hset(key: string, field: string, value: string): Promise<number>;
  async hset(key: string, obj: Record<string, string>): Promise<number>;
  async hset(key: string, fieldOrObj: string | Record<string, string>, value?: string): Promise<number> {
    if (this.useMemory) {
      if (typeof fieldOrObj === 'string') {
        return memoryCache.hset(key, fieldOrObj, value!);
      }
      let count = 0;
      for (const [f, v] of Object.entries(fieldOrObj)) {
        count += await memoryCache.hset(key, f, v);
      }
      return count;
    }
    try {
      if (typeof fieldOrObj === 'string') {
        return await this.client!.hset(key, fieldOrObj, value!);
      }
      return await this.client!.hset(key, fieldOrObj);
    } catch (e) {
      this.useMemory = true;
      if (typeof fieldOrObj === 'string') {
        return memoryCache.hset(key, fieldOrObj, value!);
      }
      let count = 0;
      for (const [f, v] of Object.entries(fieldOrObj)) {
        count += await memoryCache.hset(key, f, v);
      }
      return count;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (this.useMemory) {
      return memoryCache.hget(key, field);
    }
    try {
      return await this.client!.hget(key, field);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.hget(key, field);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.useMemory) {
      return memoryCache.hgetall(key);
    }
    try {
      return await this.client!.hgetall(key);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.hgetall(key);
    }
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (this.useMemory) {
      return memoryCache.hincrby(key, field, increment);
    }
    try {
      return await this.client!.hincrby(key, field, increment);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.hincrby(key, field, increment);
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (this.useMemory) {
      return memoryCache.sadd(key, ...members);
    }
    try {
      return await this.client!.sadd(key, ...members);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.sadd(key, ...members);
    }
  }

  async zadd(key: string, score: number, member: string): Promise<number>;
  async zadd(key: string, scoreMembers: Array<{ score: number; member: string }>): Promise<number>;
  async zadd(key: string, scoreOrArr: number | Array<{ score: number; member: string }>, member?: string): Promise<number> {
    if (this.useMemory) {
      if (typeof scoreOrArr === 'number') {
        return memoryCache.zadd(key, scoreOrArr, member!);
      }
      let count = 0;
      for (const item of scoreOrArr) {
        count += await memoryCache.zadd(key, item.score, item.member);
      }
      return count;
    }
    try {
      if (typeof scoreOrArr === 'number') {
        return await this.client!.zadd(key, scoreOrArr, member!);
      }
      const args: (string | number)[] = [];
      for (const item of scoreOrArr) {
        args.push(item.score, item.member);
      }
      return await (this.client as any).zadd(key, ...args);
    } catch (e) {
      this.useMemory = true;
      if (typeof scoreOrArr === 'number') {
        return memoryCache.zadd(key, scoreOrArr, member!);
      }
      let count = 0;
      for (const item of scoreOrArr) {
        count += await memoryCache.zadd(key, item.score, item.member);
      }
      return count;
    }
  }

  async ping(): Promise<string> {
    if (this.useMemory) {
      return memoryCache.ping();
    }
    try {
      return await this.client!.ping();
    } catch (e) {
      this.useMemory = true;
      return memoryCache.ping();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
    }
    await memoryCache.disconnect();
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.useMemory) {
      return memoryCache.keys(pattern);
    }
    try {
      return await this.client!.keys(pattern);
    } catch (e) {
      this.useMemory = true;
      return memoryCache.keys(pattern);
    }
  }
}

export const redis = new RedisWrapper();
export default redis;
