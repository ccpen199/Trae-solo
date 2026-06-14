import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证令牌',
      data: null,
      timestamp: Date.now()
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changzhou-public-service-jwt-secret-key-2024') as {
      id: number;
      username: string;
      role: string;
    };

    const tokenRecord = db.prepare('SELECT * FROM access_tokens WHERE token = ? AND expires_at > datetime(\"now\")').get(token);
    
    if (!tokenRecord) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌已过期或无效',
        data: null,
        timestamp: Date.now()
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '认证令牌无效',
      data: null,
      timestamp: Date.now()
    });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null,
      timestamp: Date.now()
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 403,
      message: '需要管理员权限',
      data: null,
      timestamp: Date.now()
    });
  }

  next();
};

export const roleMiddleware = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '请先登录',
        data: null,
        timestamp: Date.now()
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null,
        timestamp: Date.now()
      });
    }

    next();
  };
};
