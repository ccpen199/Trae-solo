import { Device } from '@models/Device';
import { CryptoService } from './crypto';
import { AntiReplayProtection } from './antiReplay';

export interface DeviceAuthRequest {
  deviceId: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

export interface DeviceAuthResponse {
  success: boolean;
  token?: string;
  serverNonce?: string;
  serverTimestamp?: number;
  serverSignature?: string;
  error?: string;
}

export interface DeviceAuthSession {
  deviceId: string;
  sessionKey: string;
  createdAt: number;
  expiresAt: number;
  isAuthenticated: boolean;
}

export class DeviceAuthService {
  private static readonly AUTH_SESSION_PREFIX = 'iot:auth:session:';
  private static readonly SESSION_EXPIRE_SECONDS = 3600 * 24;

  static async authenticateDevice(
    authRequest: DeviceAuthRequest
  ): Promise<DeviceAuthResponse> {
    const { deviceId, nonce, timestamp, signature } = authRequest;

    const replayCheck = await AntiReplayProtection.checkReplayAttack(
      deviceId,
      nonce,
      timestamp
    );

    if (!replayCheck.isTimestampValid) {
      return {
        success: false,
        error: replayCheck.message || 'Invalid timestamp',
      };
    }

    if (replayCheck.isReplay) {
      return {
        success: false,
        error: 'Replay attack detected',
      };
    }

    const device = await Device.findOne({ deviceId }).select('+deviceSecret');
    if (!device) {
      return {
        success: false,
        error: 'Device not found',
      };
    }

    const signatureValid = CryptoService.verifyDeviceSignature(
      deviceId,
      nonce,
      timestamp,
      signature,
      device.deviceSecret
    );

    if (!signatureValid) {
      return {
        success: false,
        error: 'Invalid signature',
      };
    }

    const serverNonce = CryptoService.generateNonce();
    const serverTimestamp = Date.now();
    const serverSignature = CryptoService.hmacSHA256WithDeviceSecret(
      device.deviceSecret,
      `${deviceId}${serverNonce}${serverTimestamp}`
    );

    const sessionKey = this.generateSessionKey(deviceId, device.deviceSecret);
    await this.createAuthSession(deviceId, sessionKey);

    return {
      success: true,
      token: sessionKey,
      serverNonce,
      serverTimestamp,
      serverSignature,
    };
  }

  static async verifySessionToken(
    deviceId: string,
    token: string
  ): Promise<boolean> {
    const session = await this.getAuthSession(deviceId);
    if (!session || !session.isAuthenticated) {
      return false;
    }

    if (Date.now() > session.expiresAt) {
      return false;
    }

    return session.sessionKey === token;
  }

  private static generateSessionKey(deviceId: string, deviceSecret: string): string {
    const timestamp = Date.now();
    const random = CryptoService.generateNonce();
    return CryptoService.hmacSHA256WithDeviceSecret(
      deviceSecret,
      `${deviceId}${timestamp}${random}`
    );
  }

  private static async createAuthSession(
    deviceId: string,
    sessionKey: string
  ): Promise<void> {
    const session: DeviceAuthSession = {
      deviceId,
      sessionKey,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_EXPIRE_SECONDS * 1000,
      isAuthenticated: true,
    };

    const sessionJson = JSON.stringify(session);
    const { default: Redis } = await import('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    await redis.setex(
      `${this.AUTH_SESSION_PREFIX}${deviceId}`,
      this.SESSION_EXPIRE_SECONDS,
      sessionJson
    );

    redis.disconnect();
  }

  private static async getAuthSession(
    deviceId: string
  ): Promise<DeviceAuthSession | null> {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    const sessionJson = await redis.get(`${this.AUTH_SESSION_PREFIX}${deviceId}`);
    redis.disconnect();

    if (!sessionJson) {
      return null;
    }

    try {
      return JSON.parse(sessionJson) as DeviceAuthSession;
    } catch {
      return null;
    }
  }

  static async revokeSession(deviceId: string): Promise<void> {
    const { default: Redis } = await import('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    await redis.del(`${this.AUTH_SESSION_PREFIX}${deviceId}`);
    redis.disconnect();
  }

  static async refreshSession(deviceId: string): Promise<string | null> {
    const device = await Device.findOne({ deviceId }).select('+deviceSecret');
    if (!device) {
      return null;
    }

    const newSessionKey = this.generateSessionKey(deviceId, device.deviceSecret);
    await this.createAuthSession(deviceId, newSessionKey);
    return newSessionKey;
  }
}
