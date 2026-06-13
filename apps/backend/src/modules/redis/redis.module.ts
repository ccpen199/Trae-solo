import { Module, Global, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import EventEmitter from 'events';
import { CacheService } from './cache.service';

class MockRedisClient extends EventEmitter {
  private readonly data = new Map<string, any>();
  private readonly hashData = new Map<string, Map<string, any>>();
  private readonly sortedSets = new Map<string, Array<{ score: number; member: string }>>();
  private readonly bitmaps = new Map<string, Buffer>();
  private readonly expiry = new Map<string, number>();
  private readonly logger = new Logger('MockRedis');

  constructor() {
    super();
    setInterval(() => this.checkExpiry(), 1000);
  }

  private checkExpiry() {
    const now = Date.now();
    for (const [key, expiresAt] of this.expiry.entries()) {
      if (now >= expiresAt) {
        this.data.delete(key);
        this.hashData.delete(key);
        this.sortedSets.delete(key);
        this.bitmaps.delete(key);
        this.expiry.delete(key);
      }
    }
  }

  get(key: string): Promise<string | null> {
    if (this.isExpired(key)) return Promise.resolve(null);
    return Promise.resolve(this.data.has(key) ? String(this.data.get(key)) : null);
  }

  set(key: string, value: string): Promise<'OK'> {
    this.data.set(key, value);
    return Promise.resolve('OK');
  }

  setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.data.set(key, value);
    this.expiry.set(key, Date.now() + seconds * 1000);
    return Promise.resolve('OK');
  }

  del(key: string): Promise<number> {
    const existed = this.data.has(key) || this.hashData.has(key) || this.sortedSets.has(key) || this.bitmaps.has(key);
    this.data.delete(key);
    this.hashData.delete(key);
    this.sortedSets.delete(key);
    this.bitmaps.delete(key);
    this.expiry.delete(key);
    return Promise.resolve(existed ? 1 : 0);
  }

  hget(hash: string, field: string): Promise<string | null> {
    if (this.isExpired(hash)) return Promise.resolve(null);
    const h = this.hashData.get(hash);
    return Promise.resolve(h && h.has(field) ? String(h.get(field)) : null);
  }

  hset(hash: string, field: string, value: string): Promise<number> {
    if (!this.hashData.has(hash)) {
      this.hashData.set(hash, new Map());
    }
    const h = this.hashData.get(hash)!;
    const existed = h.has(field) ? 0 : 1;
    h.set(field, value);
    return Promise.resolve(existed);
  }

  hdel(hash: string, field: string): Promise<number> {
    const h = this.hashData.get(hash);
    if (!h) return Promise.resolve(0);
    const existed = h.has(field) ? 1 : 0;
    h.delete(field);
    return Promise.resolve(existed);
  }

  incrby(key: string, amount: number): Promise<number> {
    if (this.isExpired(key)) {
      this.data.set(key, amount);
      return Promise.resolve(amount);
    }
    const current = parseInt(this.data.get(key) || '0', 10);
    const newValue = current + amount;
    this.data.set(key, newValue);
    return Promise.resolve(newValue);
  }

  zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, []);
    }
    const set = this.sortedSets.get(key)!;
    const existingIndex = set.findIndex((item) => item.member === member);
    if (existingIndex >= 0) {
      set[existingIndex].score = score;
    } else {
      set.push({ score, member });
    }
    set.sort((a, b) => a.score - b.score);
    return Promise.resolve(existingIndex >= 0 ? 0 : 1);
  }

  zrange(key: string, start: number, end: number, withScores?: string): Promise<any[]> {
    const set = this.sortedSets.get(key) || [];
    const actualEnd = end === -1 ? set.length : end + 1;
    const slice = set.slice(start, actualEnd);
    if (withScores === 'WITHSCORES') {
      const result: any[] = [];
      for (const item of slice) {
        result.push(item.member, String(item.score));
      }
      return Promise.resolve(result);
    }
    return Promise.resolve(slice.map((item) => item.member));
  }

  publish(channel: string, message: string): Promise<number> {
    this.emit('message', channel, message);
    return Promise.resolve(0);
  }

  keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const allKeys = [
      ...this.data.keys(),
      ...this.hashData.keys(),
      ...this.sortedSets.keys(),
      ...this.bitmaps.keys(),
    ];
    return Promise.resolve([...new Set(allKeys)].filter((k) => regex.test(k)));
  }

  setbit(key: string, offset: number, value: number): Promise<number> {
    if (!this.bitmaps.has(key)) {
      this.bitmaps.set(key, Buffer.alloc(Math.ceil((offset + 1) / 8)));
    }
    const buf = this.bitmaps.get(key)!;
    const byteOffset = Math.floor(offset / 8);
    const bitOffset = 7 - (offset % 8);
    if (byteOffset >= buf.length) {
      const newBuf = Buffer.alloc(byteOffset + 1);
      buf.copy(newBuf);
      this.bitmaps.set(key, newBuf);
    }
    const currentBuf = this.bitmaps.get(key)!;
    const oldVal = (currentBuf[byteOffset] >> bitOffset) & 1;
    if (value) {
      currentBuf[byteOffset] |= 1 << bitOffset;
    } else {
      currentBuf[byteOffset] &= ~(1 << bitOffset);
    }
    return Promise.resolve(oldVal);
  }

  bitcount(key: string): Promise<number> {
    const buf = this.bitmaps.get(key);
    if (!buf) return Promise.resolve(0);
    let count = 0;
    for (let i = 0; i < buf.length; i++) {
      let b = buf[i];
      while (b) {
        count += b & 1;
        b >>= 1;
      }
    }
    return Promise.resolve(count);
  }

  expire(key: string, seconds: number): Promise<number> {
    const exists = this.data.has(key) || this.hashData.has(key) || this.sortedSets.has(key) || this.bitmaps.has(key);
    if (exists) {
      this.expiry.set(key, Date.now() + seconds * 1000);
      return Promise.resolve(1);
    }
    return Promise.resolve(0);
  }

  disconnect(): void {
    this.logger.log('Mock Redis disconnected');
  }

  private isExpired(key: string): boolean {
    const expiresAt = this.expiry.get(key);
    return expiresAt !== undefined && Date.now() >= expiresAt;
  }
}

@Global()
@Module({
  providers: [
    CacheService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const logger = new Logger('RedisModule');

        let client: Redis | null = null;
        try {
          client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || 'redis_secure_pwd_2024',
            retryStrategy: (times) => Math.min(times * 50, 2000),
            enableReadyCheck: true,
          });

          const connectPromise = new Promise<Redis>((resolve, reject) => {
            client!.once('ready', () => resolve(client!));
            client!.once('error', (err) => reject(err));
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Redis connection timeout')), 2000);
          });

          await Promise.race([connectPromise, timeoutPromise]);
          return client;
        } catch (err) {
          logger.warn(`Redis connection failed, using mock client: ${(err as Error).message}`);
          if (client) {
            try {
              client.disconnect();
            } catch {}
          }
          const mockClient = new MockRedisClient();
          process.nextTick(() => {
            mockClient.emit('connect');
          });
          return mockClient as unknown as Redis;
        }
      },
    },
  ],
  exports: ['REDIS_CLIENT', CacheService],
})
export class RedisModule {
  constructor() {}
}
