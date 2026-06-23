import Redis from 'ioredis';
import { config } from '@config/index';
import { logger } from '@utils/logger';

export interface ReplayProtectionResult {
  isReplay: boolean;
  isTimestampValid: boolean;
  message?: string;
}

export class AntiReplayProtection {
  private static redis: Redis | null = null;
  private static useMemory: boolean = false;
  private static memoryNonceCache: Map<string, { timestamp: number; expireAt: number }> = new Map();
  private static readonly NONCE_KEY_PREFIX = 'iot:nonce:';
  private static readonly NONCE_EXPIRE_SECONDS = config.security.nonceExpireSeconds;
  private static readonly TIMESTAMP_TOLERANCE = 300;

  static init(redisClient: Redis | null): void {
    this.redis = redisClient;
    this.useMemory = !redisClient;
    if (this.useMemory) {
      logger.warn('[AntiReplay] 使用内存模式（仅用于开发/演示）');
      this.startMemoryCleanup();
    } else {
      logger.info('[AntiReplay] 使用 Redis 模式');
    }
  }

  private static startMemoryCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      for (const [key, value] of this.memoryNonceCache) {
        if (value.expireAt < now) {
          this.memoryNonceCache.delete(key);
          cleaned++;
        }
      }
      if (cleaned > 0) {
        logger.debug(`[AntiReplay] 清理过期内存 nonce: ${cleaned} 个`);
      }
    }, 60000);
  }

  private static async setnx(key: string, value: string): Promise<number> {
    if (this.useMemory) {
      if (this.memoryNonceCache.has(key)) {
        return 0;
      }
      this.memoryNonceCache.set(key, {
        timestamp: parseInt(value),
        expireAt: Date.now() + this.NONCE_EXPIRE_SECONDS * 1000,
      });
      return 1;
    }
    if (this.redis) {
      return this.redis.setnx(key, value);
    }
    return 1;
  }

  private static async expire(key: string, seconds: number): Promise<void> {
    if (this.useMemory) {
      const entry = this.memoryNonceCache.get(key);
      if (entry) {
        entry.expireAt = Date.now() + seconds * 1000;
      }
      return;
    }
    if (this.redis) {
      await this.redis.expire(key, seconds);
    }
  }

  private static async exists(key: string): Promise<number> {
    if (this.useMemory) {
      return this.memoryNonceCache.has(key) ? 1 : 0;
    }
    if (this.redis) {
      return this.redis.exists(key);
    }
    return 0;
  }

  private static async keys(pattern: string): Promise<string[]> {
    if (this.useMemory) {
      const result: string[] = [];
      for (const key of this.memoryNonceCache.keys()) {
        if (key.startsWith(pattern.replace('*', ''))) {
          result.push(key);
        }
      }
      return result;
    }
    if (this.redis) {
      return this.redis.keys(pattern);
    }
    return [];
  }

  private static async del(keys: string[]): Promise<void> {
    if (this.useMemory) {
      for (const key of keys) {
        this.memoryNonceCache.delete(key);
      }
      return;
    }
    if (this.redis && keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  static async checkReplayAttack(
    deviceId: string,
    nonce: string,
    timestamp: number
  ): Promise<ReplayProtectionResult> {
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - timestamp);

    if (timeDiff > this.TIMESTAMP_TOLERANCE) {
      return {
        isReplay: false,
        isTimestampValid: false,
        message: `Timestamp deviation exceeds ${this.TIMESTAMP_TOLERANCE} seconds`,
      };
    }

    const key = `${this.NONCE_KEY_PREFIX}${deviceId}:${nonce}`;
    const result = await this.setnx(key, timestamp.toString());

    if (result === 0) {
      return {
        isReplay: true,
        isTimestampValid: true,
        message: 'Duplicate nonce detected, possible replay attack',
      };
    }

    await this.expire(key, this.NONCE_EXPIRE_SECONDS);

    return {
      isReplay: false,
      isTimestampValid: true,
    };
  }

  static async checkRequestReplay(
    requestId: string,
    timestamp: number
  ): Promise<ReplayProtectionResult> {
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - timestamp);

    if (timeDiff > this.TIMESTAMP_TOLERANCE) {
      return {
        isReplay: false,
        isTimestampValid: false,
        message: `Timestamp deviation exceeds ${this.TIMESTAMP_TOLERANCE} seconds`,
      };
    }

    const key = `${this.NONCE_KEY_PREFIX}request:${requestId}`;
    const result = await this.setnx(key, timestamp.toString());

    if (result === 0) {
      return {
        isReplay: true,
        isTimestampValid: true,
        message: 'Duplicate request detected, possible replay attack',
      };
    }

    await this.expire(key, this.NONCE_EXPIRE_SECONDS);

    return {
      isReplay: false,
      isTimestampValid: true,
    };
  }

  static async clearDeviceNonces(deviceId: string): Promise<void> {
    const pattern = `${this.NONCE_KEY_PREFIX}${deviceId}:*`;
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.del(keys);
    }
  }

  static async isNonceUsed(deviceId: string, nonce: string): Promise<boolean> {
    const key = `${this.NONCE_KEY_PREFIX}${deviceId}:${nonce}`;
    const exists = await this.exists(key);
    return exists === 1;
  }
}
