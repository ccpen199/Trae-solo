import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly defaultTTL: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.defaultTTL = this.configService.get<number>('CACHE_TTL', 300);
  }

  private serialize(value: unknown): string {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  private deserialize<T>(value: string | null): T | null {
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return this.deserialize<T>(value);
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = this.serialize(value);
    if (ttl !== undefined) {
      await this.redis.set(key, serialized, 'EX', ttl);
    } else {
      await this.redis.set(key, serialized, 'EX', this.defaultTTL);
    }
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result > 0;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const result = await this.redis.expire(key, ttl);
    return result > 0;
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async incr(key: string, amount = 1): Promise<number> {
    if (amount === 1) {
      return this.redis.incr(key);
    }
    return this.redis.incrby(key, amount);
  }

  async decr(key: string, amount = 1): Promise<number> {
    if (amount === 1) {
      return this.redis.decr(key);
    }
    return this.redis.decrby(key, amount);
  }

  async delPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }

  async wrapCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }

  async lock(key: string, ttl = 10000): Promise<boolean> {
    const result = await this.redis.set(key, '1', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  async unlock(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.redis.hget(key, field);
    return this.deserialize<T>(value);
  }

  async hset(key: string, field: string, value: unknown): Promise<number> {
    const serialized = this.serialize(value);
    return this.redis.hset(key, field, serialized);
  }

  async hgetAll<T>(key: string): Promise<Record<string, T>> {
    const result = await this.redis.hgetall(key);
    const parsed: Record<string, T> = {};
    for (const [field, value] of Object.entries(result)) {
      parsed[field] = this.deserialize<T>(value) as T;
    }
    return parsed;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    return this.redis.hdel(key, ...fields);
  }
}
