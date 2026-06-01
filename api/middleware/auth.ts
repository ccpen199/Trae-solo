import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Admin } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'lottery-platform-secret-key-2024';

export interface AuthRequest extends Request {
  admin?: Admin;
}

export const authMiddleware = (requiredRoles?: Admin['role'][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        data: null,
        timestamp: Date.now()
      });
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as Admin;
      
      if (requiredRoles && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({
          code: 403,
          message: '权限不足',
          data: null,
          timestamp: Date.now()
        });
      }
      
      req.admin = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        code: 401,
        message: '认证令牌无效或已过期',
        data: null,
        timestamp: Date.now()
      });
    }
  };
};
