import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, ApiResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore-jwt-secret-key-2026';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, message: '未提供认证令牌', error: 'No token provided' } as ApiResponse);
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: '令牌无效或已过期', error: 'Invalid or expired token' } as ApiResponse);
    return;
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({ success: false, message: '未登录' } as ApiResponse);
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, message: '权限不足' } as ApiResponse);
      return;
    }

    next();
  };
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
