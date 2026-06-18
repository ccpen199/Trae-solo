import jwt from 'jsonwebtoken';
import config from '../config';

export interface JwtPayload {
  userId: string;
  phone?: string;
}

const JWT_SECRET: string = config.jwt.secret;
const JWT_EXPIRES_IN: string = config.jwt.expiresIn;

export const sign = (payload: JwtPayload): string => {
  return (jwt as any).sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verify = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export default { sign, verify };
