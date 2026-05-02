import { config } from '../config';
import logger from './logger';

interface CacheEntry {
  value: string;
  ttl?: number;
  createdAt: number;
}

class MemoryRedis {
  private cache: Map<string, CacheEntry> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
    flag?: string
  ): Promise<string | null> {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (mode === 'NX' && existing !== undefined) {
      return null;
    }

    if (mode === 'XX' && existing === undefined) {
      return null;
    }

    const entry: CacheEntry = {
      value,
      createdAt: now,
    };

    if (mode === 'EX' && typeof duration === 'number') {
      entry.ttl = duration;
    }

    this.cache.set(key, entry);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.cache.has(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) {
      return 0;
    }
    entry.ttl = seconds;
    entry.createdAt = Date.now();
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async flushall(): Promise<void> {
    this.cache.clear();
  }
}

let redisInstance: MemoryRedis | null = null;

export const createMemoryRedis = (): MemoryRedis => {
  if (!redisInstance) {
    redisInstance = new MemoryRedis();
    logger.info('Using in-memory Redis cache (since Redis server is not available)');
  }
  return redisInstance;
};

const redis = createMemoryRedis();
export default redis;
