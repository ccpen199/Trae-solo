import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { error } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET || 'funding-platform-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    schoolId?: number;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(error('未提供认证令牌'));
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      role: string;
      schoolId?: number;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json(error('认证令牌无效或已过期'));
  }
}

export function signToken(payload: { id: number; username: string; role: string; schoolId?: number }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
