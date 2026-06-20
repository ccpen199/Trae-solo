import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  traceId?: string;
  timestamp?: string;
}

export const success = <T>(res: Response, data?: T, message = 'success') => {
  const resp: ApiResponse<T> = {
    code: 0,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  return res.json(resp);
};

export const error = (res: Response, message: string, code = 500, httpStatus = 200) => {
  const resp: ApiResponse = {
    code,
    message,
    timestamp: new Date().toISOString()
  };
  return res.status(httpStatus).json(resp);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const authRequired = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return error(res, '未授权访问', 401, 401);
  }
  try {
    const token = header.slice(7);
    const decoded: any = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.sub;
    req.user = decoded;
    next();
  } catch (e) {
    return error(res, 'Token无效或已过期', 401, 401);
  }
};

export const adminRequired = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return error(res, '未登录', 401, 401);
  if (req.user.role !== 'admin' && req.user.role !== 'reviewer') {
    return error(res, '权限不足', 403, 403);
  }
  next();
};
