import jwt from 'jsonwebtoken';
import { UserRole } from '@shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'stayglobal-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN) : 86400;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ? parseInt(process.env.JWT_REFRESH_EXPIRES_IN) : 604800;

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getTokenExpiry(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number };
  return decoded?.exp || 0;
}
