import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  onModuleInit() {
    this.redis.on('connect', () => this.logger.log('Redis connected'));
    this.redis.on('error', (err) => this.logger.error('Redis error:', err));
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async hGet<T>(hash: string, field: string): Promise<T | null> {
    const data = await this.redis.hget(hash, field);
    return data ? JSON.parse(data) : null;
  }

  async hSet(hash: string, field: string, value: any): Promise<void> {
    await this.redis.hset(hash, field, JSON.stringify(value));
  }

  async hDel(hash: string, field: string): Promise<void> {
    await this.redis.hdel(hash, field);
  }

  async incr(key: string, amount = 1): Promise<number> {
    return this.redis.incrby(key, amount);
  }

  async zAdd(key: string, score: number, member: string): Promise<void> {
    await this.redis.zadd(key, score, member);
  }

  async zRange(key: string, start: number, end: number, withScores = false): Promise<any[]> {
    return this.redis.zrange(key, start, end, withScores ? 'WITHSCORES' as any : undefined);
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(message));
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async setBit(key: string, offset: number, value: number): Promise<number> {
    return this.redis.setbit(key, offset, value);
  }

  async bitCount(key: string): Promise<number> {
    return this.redis.bitcount(key);
  }

  getClient(): Redis {
    return this.redis;
  }
}
