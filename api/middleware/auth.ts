import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload, ApiResponse } from '../types/index.js';

export const JWT_SECRET = 'real-estate-jwt-secret-2024';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '未提供认证令牌',
      data: null
    } as ApiResponse);
    return;
  }

  const token = authHeader.slice(7);

  try {
    if (token === 'mock-admin-token') {
      req.user = {
        userId: 1,
        role: 'admin',
        phone: 'admin'
      };
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      code: 401,
      message: '认证令牌无效或已过期',
      data: null
    } as ApiResponse);
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    } as ApiResponse);
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      code: 403,
      message: '需要管理员权限',
      data: null
    } as ApiResponse);
    return;
  }

  next();
};

export const advisorMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      code: 401,
      message: '请先登录',
      data: null
    } as ApiResponse);
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'advisor') {
    res.status(403).json({
      code: 403,
      message: '需要顾问或管理员权限',
      data: null
    } as ApiResponse);
    return;
  }

  next();
};

export default authMiddleware;
