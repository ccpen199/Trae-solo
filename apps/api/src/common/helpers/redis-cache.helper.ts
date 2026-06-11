import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisCacheHelper {
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

  async setNX(key: string, value: unknown, ttl?: number): Promise<boolean> {
    const serialized = this.serialize(value);
    const result = await this.redis.set(key, serialized, 'EX', ttl ?? this.defaultTTL, 'NX');
    return result === 'OK';
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

  async getSet<T>(key: string, value: unknown): Promise<T | null> {
    const serialized = this.serialize(value);
    const oldValue = await this.redis.getset(key, serialized);
    return this.deserialize<T>(oldValue);
  }

  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const values = await this.redis.mget(...keys);
    const result = new Map<string, T | null>();
    keys.forEach((key, index) => {
      result.set(key, this.deserialize<T>(values[index]));
    });
    return result;
  }

  async mset(items: Array<{ key: string; value: unknown }>, ttl?: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    items.forEach(({ key, value }) => {
      const serialized = this.serialize(value);
      if (ttl !== undefined) {
        pipeline.set(key, serialized, 'EX', ttl);
      } else {
        pipeline.set(key, serialized, 'EX', this.defaultTTL);
      }
    });
    await pipeline.exec();
  }

  async delPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
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

  async lpush(key: string, ...values: unknown[]): Promise<number> {
    const serialized = values.map((v) => this.serialize(v));
    return this.redis.lpush(key, ...serialized);
  }

  async rpush(key: string, ...values: unknown[]): Promise<number> {
    const serialized = values.map((v) => this.serialize(v));
    return this.redis.rpush(key, ...serialized);
  }

  async lpop<T>(key: string): Promise<T | null> {
    const value = await this.redis.lpop(key);
    return this.deserialize<T>(value);
  }

  async rpop<T>(key: string): Promise<T | null> {
    const value = await this.redis.rpop(key);
    return this.deserialize<T>(value);
  }

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    const values = await this.redis.lrange(key, start, stop);
    return values.map((v) => this.deserialize<T>(v) as T);
  }

  async sadd(key: string, ...members: unknown[]): Promise<number> {
    const serialized = members.map((m) => this.serialize(m));
    return this.redis.sadd(key, ...serialized);
  }

  async srem(key: string, ...members: unknown[]): Promise<number> {
    const serialized = members.map((m) => this.serialize(m));
    return this.redis.srem(key, ...serialized);
  }

  async smembers<T>(key: string): Promise<T[]> {
    const members = await this.redis.smembers(key);
    return members.map((m) => this.deserialize<T>(m) as T);
  }

  async sismember(key: string, member: unknown): Promise<boolean> {
    const serialized = this.serialize(member);
    const result = await this.redis.sismember(key, serialized);
    return result > 0;
  }

  async zadd(key: string, score: number, member: unknown): Promise<number> {
    const serialized = this.serialize(member);
    return this.redis.zadd(key, score, serialized);
  }

  async zrange<T>(key: string, start: number, stop: number, withScores = false): Promise<T[]> {
    const args: string[] = [key, String(start), String(stop)];
    if (withScores) args.push('WITHSCORES');
    const result = await this.redis.zrange(...args);
    return result.map((v) => this.deserialize<T>(v) as T);
  }

  async zrevrange<T>(key: string, start: number, stop: number, withScores = false): Promise<T[]> {
    const args: string[] = [key, String(start), String(stop)];
    if (withScores) args.push('WITHSCORES');
    const result = await this.redis.zrevrange(...args);
    return result.map((v) => this.deserialize<T>(v) as T);
  }

  async lock(key: string, ttl = 10000): Promise<boolean> {
    const result = await this.redis.set(key, '1', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  async unlock(key: string): Promise<number> {
    return this.redis.del(key);
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
}
