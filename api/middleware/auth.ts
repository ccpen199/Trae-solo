import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { ApiResponse, UserInfo } from '@shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'jiangsu-medical-insurance-secret-key-2024';

export interface AuthRequest extends Request {
  user?: UserInfo;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse<null> = {
      code: 401,
      message: '未提供认证令牌',
      data: null
    };
    res.status(401).json(response);
    return;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserInfo;
    req.user = decoded;
    next();
  } catch (error) {
    const response: ApiResponse<null> = {
      code: 401,
      message: '认证令牌无效或已过期',
      data: null
    };
    res.status(401).json(response);
  }
}

export function generateToken(userInfo: UserInfo): string {
  return jwt.sign(userInfo, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): UserInfo | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserInfo;
  } catch {
    return null;
  }
}
