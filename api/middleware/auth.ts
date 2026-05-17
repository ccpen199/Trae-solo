import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { error } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'fandeng-reading-secret-key-2024';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    phone: string;
    is_vip: number;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return error(res, '请先登录', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      is_vip: decoded.is_vip
    };
    next();
  } catch (err) {
    return error(res, '登录已过期，请重新登录', 401);
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = {
        id: decoded.id,
        phone: decoded.phone,
        is_vip: decoded.is_vip
      };
    } catch (err) {
      // Token invalid, continue without user
    }
  }
  next();
}
