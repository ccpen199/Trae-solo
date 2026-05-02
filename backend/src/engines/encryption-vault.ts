import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/index.js';
import dotenv from 'dotenv';

dotenv.config();

const MASTER_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'Xm9169StorageEncryptionKey2024';

export interface EncryptionKey {
  id: string;
  keyName: string;
  keyType: string;
  encryptedKey: string;
  iv: string | null;
  associatedData: string | null;
  ownerId: string;
  isActive: number;
  createdAt: string;
  expiresAt: string | null;
  rotatedAt: string | null;
  previousKeyId: string | null;
}

export interface EncryptionResult {
  encryptedData: Buffer;
  iv: Buffer;
  authTag?: Buffer;
  keyId: string;
}

export interface DecryptionResult {
  decryptedData: Buffer;
  keyId: string;
}

export class EncryptionVaultEngine {
  private masterKey: Buffer;
  private algorithm: string;
  private keyLength: number;

  constructor() {
    this.masterKey = crypto.scryptSync(MASTER_ENCRYPTION_KEY, 'salt', 32);
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
  }

  generateKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  encryptWithKey(data: Buffer, key: Buffer): { encryptedData: Buffer; iv: Buffer; authTag: Buffer } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return { encryptedData, iv, authTag };
  }

  decryptWithKey(
    encryptedData: Buffer, 
    key: Buffer, 
    iv: Buffer, 
    authTag: Buffer
  ): Buffer {
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  encryptMasterKey(dataKey: Buffer): { encryptedKey: string; iv: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
    
    const encryptedKey = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    const combined = Buffer.concat([authTag, encryptedKey]);
    
    return {
      encryptedKey: combined.toString('base64'),
      iv: iv.toString('base64')
    };
  }

  decryptMasterKey(encryptedKey: string, ivBase64: string): Buffer {
    const iv = Buffer.from(ivBase64, 'base64');
    const combined = Buffer.from(encryptedKey, 'base64');
    
    const authTag = combined.subarray(0, 16);
    const encryptedData = combined.subarray(16);
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  createKey(
    ownerId: string,
    keyName: string,
    expiresInDays?: number
  ): EncryptionKey {
    const dataKey = this.generateKey();
    const { encryptedKey, iv } = this.encryptMasterKey(dataKey);
    
    const keyId = uuidv4();
    let expiresAt: string | null = null;
    
    if (expiresInDays) {
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + expiresInDays);
      expiresAt = expireTime.toISOString();
    }
    
    const insertStmt = db.prepare(`
      INSERT INTO encryption_keys (
        id, key_name, key_type, encrypted_key, iv,
        owner_id, is_active, expires_at
      ) VALUES (?, ?, 'aes-256-gcm', ?, ?, ?, 1, ?)
    `);
    
    insertStmt.run(
      keyId,
      keyName,
      encryptedKey,
      iv,
      ownerId,
      expiresAt
    );
    
    return this.getKeyById(keyId) as EncryptionKey;
  }

  getKeyById(keyId: string): EncryptionKey | null {
    const stmt = db.prepare('SELECT * FROM encryption_keys WHERE id = ?');
    const result = stmt.get(keyId);
    if (!result) return null;
    
    const row = result as Record<string, unknown>;
    return {
      id: row.id as string,
      keyName: row.key_name as string,
      keyType: row.key_type as string,
      encryptedKey: row.encrypted_key as string,
      iv: row.iv as string | null,
      associatedData: row.associated_data as string | null,
      ownerId: row.owner_id as string,
      isActive: row.is_active as number,
      createdAt: row.created_at as string,
      expiresAt: row.expires_at as string | null,
      rotatedAt: row.rotated_at as string | null,
      previousKeyId: row.previous_key_id as string | null
    };
  }

  getUserKeys(ownerId: string): EncryptionKey[] {
    const stmt = db.prepare(`
      SELECT * FROM encryption_keys 
      WHERE owner_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `);
    const results = stmt.all(ownerId) as Array<Record<string, unknown>>;
    
    return results.map(row => ({
      id: row.id as string,
      keyName: row.key_name as string,
      keyType: row.key_type as string,
      encryptedKey: row.encrypted_key as string,
      iv: row.iv as string | null,
      associatedData: row.associated_data as string | null,
      ownerId: row.owner_id as string,
      isActive: row.is_active as number,
      createdAt: row.created_at as string,
      expiresAt: row.expires_at as string | null,
      rotatedAt: row.rotated_at as string | null,
      previousKeyId: row.previous_key_id as string | null
    }));
  }

  encryptData(
    data: Buffer,
    keyId: string
  ): EncryptionResult {
    const key = this.getKeyById(keyId);
    if (!key) {
      throw new Error('加密密钥不存在');
    }
    
    if (key.isActive !== 1) {
      throw new Error('加密密钥已停用');
    }
    
    if (key.expiresAt && new Date() > new Date(key.expiresAt)) {
      throw new Error('加密密钥已过期');
    }
    
    const dataKey = this.decryptMasterKey(key.encryptedKey, key.iv || '');
    const { encryptedData, iv, authTag } = this.encryptWithKey(data, dataKey);
    
    const combined = Buffer.concat([authTag, encryptedData]);
    
    return {
      encryptedData: combined,
      iv,
      authTag,
      keyId
    };
  }

  decryptData(
    encryptedData: Buffer,
    iv: Buffer,
    keyId: string
  ): DecryptionResult {
    const key = this.getKeyById(keyId);
    if (!key) {
      throw new Error('解密密钥不存在');
    }
    
    const authTag = encryptedData.subarray(0, 16);
    const actualEncryptedData = encryptedData.subarray(16);
    
    const dataKey = this.decryptMasterKey(key.encryptedKey, key.iv || '');
    const decryptedData = this.decryptWithKey(actualEncryptedData, dataKey, iv, authTag);
    
    return {
      decryptedData,
      keyId
    };
  }

  rotateKey(keyId: string): EncryptionKey {
    const oldKey = this.getKeyById(keyId);
    if (!oldKey) {
      throw new Error('密钥不存在');
    }
    
    const newDataKey = this.generateKey();
    const { encryptedKey, iv } = this.encryptMasterKey(newDataKey);
    
    const newKeyId = uuidv4();
    
    const insertStmt = db.prepare(`
      INSERT INTO encryption_keys (
        id, key_name, key_type, encrypted_key, iv,
        owner_id, is_active, previous_key_id, rotated_at
      ) VALUES (?, ?, 'aes-256-gcm', ?, ?, ?, 1, ?, datetime('now'))
    `);
    
    insertStmt.run(
      newKeyId,
      `${oldKey.keyName}_rotated_${Date.now()}`,
      encryptedKey,
      iv,
      oldKey.ownerId,
      keyId
    );
    
    const deactivateStmt = db.prepare(`
      UPDATE encryption_keys 
      SET is_active = 0, rotated_at = datetime('now')
      WHERE id = ?
    `);
    deactivateStmt.run(keyId);
    
    return this.getKeyById(newKeyId) as EncryptionKey;
  }

  revokeKey(keyId: string, ownerId: string): boolean {
    const key = this.getKeyById(keyId);
    if (!key) return false;
    
    if (key.ownerId !== ownerId) {
      return false;
    }
    
    const stmt = db.prepare(`
      UPDATE encryption_keys 
      SET is_active = 0
      WHERE id = ?
    `);
    const result = stmt.run(keyId);
    
    return result.changes > 0;
  }

  encryptFileSync(
    filePath: string,
    keyId: string
  ): { encryptedPath: string; keyId: string; iv: string } {
    const data = fs.readFileSync(filePath);
    const result = this.encryptData(data, keyId);
    
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const encryptedPath = path.join(dir, `${baseName}_encrypted${ext}`);
    
    const combined = Buffer.concat([result.iv, result.encryptedData]);
    fs.writeFileSync(encryptedPath, combined);
    
    return {
      encryptedPath,
      keyId: result.keyId,
      iv: result.iv.toString('base64')
    };
  }

  decryptFileSync(
    encryptedPath: string,
    keyId: string,
    ivBase64: string,
    outputPath?: string
  ): string {
    const combined = fs.readFileSync(encryptedPath);
    const iv = Buffer.from(ivBase64, 'base64');
    
    const result = this.decryptData(combined, iv, keyId);
    
    const actualOutputPath = outputPath || encryptedPath.replace('_encrypted', '');
    fs.writeFileSync(actualOutputPath, result.decryptedData);
    
    return actualOutputPath;
  }

  calculateFileHash(filePath: string, algorithm: 'md5' | 'sha256' = 'md5'): string {
    const data = fs.readFileSync(filePath);
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  calculateBufferHash(buffer: Buffer, algorithm: 'md5' | 'sha256' = 'md5'): string {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }
}

export const encryptionVaultEngine = new EncryptionVaultEngine();
