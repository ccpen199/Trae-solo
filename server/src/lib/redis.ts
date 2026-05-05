import Redis from 'ioredis';
import { config } from '../config';

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const redis = new Redis(redisConfig);

// 降级方案：如果 Redis 连接失败，使用内存缓存
class MemoryCache {
  private cache: Map<string, { value: string; expireAt?: number }> = new Map();

  async set(key: string, value: string, options?: { EX?: number }): Promise<'OK'> {
    const data: { value: string; expireAt?: number } = { value };
    if (options?.EX) {
      data.expireAt = Date.now() + options.EX * 1000;
    }
    this.cache.set(key, data);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const data = this.cache.get(key);
    if (!data) return null;
    if (data.expireAt && Date.now() > data.expireAt) {
      this.cache.delete(key);
      return null;
    }
    return data.value;
  }

  async del(key: string): Promise<number> {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async zincrby(key: string, increment: number, member: string): Promise<number> {
    const current = await this.get(`${key}:${member}`);
    const newValue = current ? parseFloat(current) + increment : increment;
    await this.set(`${key}:${member}`, newValue.toString());
    return newValue;
  }

  async zrevrange(key: string, start: number, stop: number, withScores?: 'WITHSCORES'): Promise<string[]> {
    const members: { member: string; score: number }[] = [];
    const prefix = `${key}:`;
    
    for (const [cacheKey, data] of this.cache.entries()) {
      if (cacheKey.startsWith(prefix)) {
        const member = cacheKey.slice(prefix.length);
        if (!data.expireAt || Date.now() <= data.expireAt) {
          members.push({ member, score: parseFloat(data.value) });
        }
      }
    }
    
    members.sort((a, b) => b.score - a.score);
    
    const result: string[] = [];
    const end = stop === -1 ? members.length : stop + 1;
    const sliced = members.slice(start, end);
    
    for (const item of sliced) {
      result.push(item.member);
      if (withScores === 'WITHSCORES') {
        result.push(item.score.toString());
      }
    }
    
    return result;
  }
}

export const memoryCache = new MemoryCache();

// 导出一个统一的缓存接口，优先使用 Redis，失败降级到内存
export const cache = {
  set: async (key: string, value: string, options?: { EX?: number }) => {
    try {
      return await redis.set(key, value, options);
    } catch {
      return await memoryCache.set(key, value, options);
    }
  },
  get: async (key: string) => {
    try {
      return await redis.get(key);
    } catch {
      return await memoryCache.get(key);
    }
  },
  del: async (key: string) => {
    try {
      return await redis.del(key);
    } catch {
      return await memoryCache.del(key);
    }
  },
  incr: async (key: string) => {
    try {
      return await redis.incr(key);
    } catch {
      return await memoryCache.incr(key);
    }
  },
  zincrby: async (key: string, increment: number, member: string) => {
    try {
      return await redis.zincrby(key, increment, member);
    } catch {
      return await memoryCache.zincrby(key, increment, member);
    }
  },
  zrevrange: async (key: string, start: number, stop: number, withScores?: 'WITHSCORES') => {
    try {
      return await redis.zrevrange(key, start, stop, withScores ? ['WITHSCORES'] : []);
    } catch {
      return await memoryCache.zrevrange(key, start, stop, withScores);
    }
  },
};
