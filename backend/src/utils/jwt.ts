import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'logistics-platform-jwt-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  enterpriseId?: string | null;
  enterpriseCode?: string | null;
  enterpriseName?: string | null;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload as string | object | Buffer, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
