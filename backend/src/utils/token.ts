import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { getDb } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'js_hrss_jwt_secret_2024';
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '604800', 10);

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' }, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET as jwt.Secret, { expiresIn: '30d' as jwt.SignOptions['expiresIn'] });
}

export function saveTokens(userId: string, accessToken: string, refreshToken: string) {
  const db = getDb();
  const expiresAt = dayjs().add(7, 'day').toISOString();
  
  db.prepare(`
    INSERT INTO auth_tokens (user_id, token, refresh_token, token_type, expires_at)
    VALUES (?, ?, ?, 'access', ?)
  `).run(userId, accessToken, refreshToken, expiresAt);
}

export function revokeToken(token: string) {
  const db = getDb();
  db.prepare(`
    UPDATE auth_tokens SET revoked = 1 WHERE token = ?
  `).run(token);
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateVerifyCode(length = 6): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateLicenseNumber(prefix = 'JS'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

export function generateMatterCode(prefix = 'JS'): string {
  const now = dayjs();
  const dateStr = now.format('YYYYMMDD');
  const random = Math.random().toString().substring(2, 6);
  return `${prefix}${dateStr}${random}`;
}

export function generateQRCodeData(data: string): string {
  const timestamp = Date.now();
  const hash = Buffer.from(`${data}_${timestamp}_${JWT_SECRET}`)
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 32);
  return `JS_HRSS_${hash}_${timestamp}`;
}

export function verifyQRCode(qrCode: string): { valid: boolean; data?: any; expiresAt?: number } {
  try {
    const parts = qrCode.split('_');
    if (parts.length !== 4) return { valid: false };
    
    const [prefix, hash, timestampStr] = parts;
    const timestamp = parseInt(timestampStr);
    const expiresAt = timestamp + 60 * 1000;
    
    if (Date.now() > expiresAt) {
      return { valid: false };
    }
    
    return {
      valid: true,
      expiresAt,
      data: { hash, timestamp }
    };
  } catch {
    return { valid: false };
  }
}
