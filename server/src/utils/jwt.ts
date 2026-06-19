import jwt from 'jsonwebtoken';
import { config } from '../config';

export function generateToken(payload: object): string {
  return jwt.sign(payload, config.jwtSecret as jwt.Secret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, config.jwtSecret as jwt.Secret);
  } catch {
    return null;
  }
}
