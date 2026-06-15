import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SM4 } from 'gm-crypto';
import type { Sm4Config } from '../../config/configuration';

@Injectable()
export class Sm4Util {
  private readonly sm4: typeof SM4;
  private readonly key: string;
  private readonly iv: string;
  private readonly mode: number;

  constructor(private readonly configService: ConfigService) {
    const sm4Config = this.configService.get<Sm4Config>('sm4');
    this.key = sm4Config?.secretKey || '0123456789abcdef0123456789abcdef';
    this.iv = sm4Config?.iv || 'abcdef9876543210';
    this.mode = SM4.constants.CBC;
    this.sm4 = SM4;
  }

  encrypt(plainText: string): string {
    if (!plainText) {
      return plainText;
    }
    return this.sm4.encrypt(plainText, this.key, {
      mode: this.mode,
      iv: this.iv,
      inputEncoding: 'utf8',
      outputEncoding: 'base64',
    }) as string;
  }

  decrypt(cipherText: string): string {
    if (!cipherText) {
      return cipherText;
    }
    return this.sm4.decrypt(cipherText, this.key, {
      mode: this.mode,
      iv: this.iv,
      inputEncoding: 'base64',
      outputEncoding: 'utf8',
    }) as string;
  }

  encryptObject<T extends Record<string, unknown>>(obj: T): string {
    const jsonStr = JSON.stringify(obj);
    return this.encrypt(jsonStr);
  }

  decryptObject<T>(cipherText: string): T {
    const jsonStr = this.decrypt(cipherText);
    return JSON.parse(jsonStr) as T;
  }

  encryptValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string') {
      return this.encrypt(value);
    }
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map((item) => this.encryptValue(item));
      }
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = this.encryptValue(val);
      }
      return result;
    }
    return value;
  }

  decryptValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        return this.decrypt(value);
      } catch {
        return value;
      }
    }
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map((item) => this.decryptValue(item));
      }
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = this.decryptValue(val);
      }
      return result;
    }
    return value;
  }
}
