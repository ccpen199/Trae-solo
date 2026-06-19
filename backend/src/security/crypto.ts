import CryptoJS from 'crypto-js';
import { createHmac, randomBytes } from 'crypto';
import { config } from '@config/index';

export class CryptoService {
  private static readonly AES_KEY = config.security.aesKey;
  private static readonly AES_IV = config.security.aesIv;
  private static readonly HMAC_SECRET = config.security.deviceSecretSalt;

  static encryptAES(plaintext: string | object): string {
    const data = typeof plaintext === 'object' ? JSON.stringify(plaintext) : plaintext;
    const ciphertext = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(this.AES_KEY), {
      iv: CryptoJS.enc.Utf8.parse(this.AES_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
    return ciphertext;
  }

  static decryptAES(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(this.AES_KEY), {
      iv: CryptoJS.enc.Utf8.parse(this.AES_IV),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static decryptAESToObject<T>(ciphertext: string): T {
    const plaintext = this.decryptAES(ciphertext);
    return JSON.parse(plaintext) as T;
  }

  static hmacSHA256(data: string, secret?: string): string {
    const hmacSecret = secret || this.HMAC_SECRET;
    return createHmac('sha256', hmacSecret).update(data).digest('hex');
  }

  static hmacSHA256WithDeviceSecret(deviceSecret: string, data: string): string {
    return createHmac('sha256', deviceSecret).update(data).digest('hex');
  }

  static generateNonce(): string {
    return randomBytes(16).toString('hex');
  }

  static generateRandomString(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  static generateDeviceSecret(deviceId: string): string {
    const salt = this.HMAC_SECRET;
    const timestamp = Date.now().toString();
    return this.hmacSHA256(`${deviceId}${salt}${timestamp}`).slice(0, 32);
  }

  static verifySignature(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.hmacSHA256(data, secret);
    return expectedSignature === signature;
  }

  static verifyDeviceSignature(
    deviceId: string,
    nonce: string,
    timestamp: number,
    signature: string,
    deviceSecret: string
  ): boolean {
    const data = `${deviceId}${nonce}${timestamp}`;
    const expectedSignature = this.hmacSHA256WithDeviceSecret(deviceSecret, data);
    return expectedSignature === signature;
  }

  static generateAuthChallenge(): { random: string; timestamp: number } {
    return {
      random: this.generateNonce(),
      timestamp: Date.now(),
    };
  }

  static verifyAuthResponse(
    deviceId: string,
    serverRandom: string,
    clientRandom: string,
    signature: string,
    deviceSecret: string
  ): boolean {
    const data = `${deviceId}${serverRandom}${clientRandom}`;
    const expectedSignature = this.hmacSHA256WithDeviceSecret(deviceSecret, data);
    return expectedSignature === signature;
  }

  static hashPassword(password: string): string {
    return this.hmacSHA256(password, this.HMAC_SECRET);
  }

  static generateTransactionSign(
    transactionNo: string,
    userId: string,
    amount: number,
    timestamp: number
  ): string {
    const data = `${transactionNo}${userId}${amount.toFixed(2)}${timestamp}`;
    return this.hmacSHA256(data);
  }

  static verifyTransactionSign(
    transactionNo: string,
    userId: string,
    amount: number,
    timestamp: number,
    signature: string
  ): boolean {
    const expectedSign = this.generateTransactionSign(transactionNo, userId, amount, timestamp);
    return expectedSign === signature;
  }
}
