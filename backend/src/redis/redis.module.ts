import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  quit(): Promise<void>;
}

class MemoryRedis implements RedisClient {
  private store: Map<string, { value: string; expireAt?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    const item: { value: string; expireAt?: number } = { value };
    if (mode === 'EX' && duration) {
      item.expireAt = Date.now() + duration * 1000;
    }
    this.store.set(key, item);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    if (item.expireAt && Date.now() > item.expireAt) {
      this.store.delete(key);
      return 0;
    }
    return 1;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expireAt = Date.now() + seconds * 1000;
    return 1;
  }

  async quit(): Promise<void> {
    // Nothing to do for memory store
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService): Promise<RedisClient> => {
        const host = configService.get('REDIS_HOST') || '127.0.0.1';
        const port = configService.get<number>('REDIS_PORT') || 6379;
        const password = configService.get('REDIS_PASSWORD');
        
        try {
          const redis = new Redis({
            host,
            port,
            password: password || undefined,
            connectTimeout: 3000,
            retryStrategy: (times) => {
              if (times > 2) {
                return null;
              }
              return 500;
            },
          });
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Redis connection timeout'));
            }, 3000);
            
            redis.on('connect', () => {
              clearTimeout(timeout);
              resolve();
            });
            
            redis.on('error', () => {
              clearTimeout(timeout);
            });
          });
          
          console.log('Redis 连接成功');
          return redis as unknown as RedisClient;
        } catch (error) {
          console.log('Redis 连接失败，使用内存 Map 作为本地降级方案');
          return new MemoryRedis();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
