import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'health-platform-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
