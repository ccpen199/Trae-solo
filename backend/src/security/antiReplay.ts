import Redis from 'ioredis';
import { config } from '@config/index';

export interface ReplayProtectionResult {
  isReplay: boolean;
  isTimestampValid: boolean;
  message?: string;
}

export class AntiReplayProtection {
  private static redis: Redis;
  private static readonly NONCE_KEY_PREFIX = 'iot:nonce:';
  private static readonly NONCE_EXPIRE_SECONDS = config.security.nonceExpireSeconds;
  private static readonly TIMESTAMP_TOLERANCE = 300;

  static init(redisClient: Redis): void {
    this.redis = redisClient;
  }

  static async checkReplayAttack(
    deviceId: string,
    nonce: string,
    timestamp: number
  ): Promise<ReplayProtectionResult> {
    if (!this.redis) {
      throw new Error('AntiReplayProtection not initialized');
    }

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
    const result = await this.redis.setnx(key, timestamp.toString());

    if (result === 0) {
      return {
        isReplay: true,
        isTimestampValid: true,
        message: 'Duplicate nonce detected, possible replay attack',
      };
    }

    await this.redis.expire(key, this.NONCE_EXPIRE_SECONDS);

    return {
      isReplay: false,
      isTimestampValid: true,
    };
  }

  static async checkRequestReplay(
    requestId: string,
    timestamp: number
  ): Promise<ReplayProtectionResult> {
    if (!this.redis) {
      throw new Error('AntiReplayProtection not initialized');
    }

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
    const result = await this.redis.setnx(key, timestamp.toString());

    if (result === 0) {
      return {
        isReplay: true,
        isTimestampValid: true,
        message: 'Duplicate request detected, possible replay attack',
      };
    }

    await this.redis.expire(key, this.NONCE_EXPIRE_SECONDS);

    return {
      isReplay: false,
      isTimestampValid: true,
    };
  }

  static async clearDeviceNonces(deviceId: string): Promise<void> {
    if (!this.redis) {
      throw new Error('AntiReplayProtection not initialized');
    }

    const pattern = `${this.NONCE_KEY_PREFIX}${deviceId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  static async isNonceUsed(deviceId: string, nonce: string): Promise<boolean> {
    if (!this.redis) {
      throw new Error('AntiReplayProtection not initialized');
    }

    const key = `${this.NONCE_KEY_PREFIX}${deviceId}:${nonce}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}
