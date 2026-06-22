import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { error } from '../utils/response.js';
import { TokenPayload } from '@shared/types';

declare module 'express' {
  export interface Request {
    user?: TokenPayload;
  }
}

export const authenticateRider = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, '未提供认证令牌', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dispatch-secret-key-2024') as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, '认证令牌无效或已过期', 401);
  }
};

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, '未提供认证令牌', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dispatch-secret-key-2024') as TokenPayload & { isAdmin?: boolean };
    if (!decoded.isAdmin) {
      return error(res, '需要管理员权限', 403);
    }
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, '认证令牌无效或已过期', 401);
  }
};

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dispatch-secret-key-2024', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};
