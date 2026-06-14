import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { success, error } from '../utils/common';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        userType: string;
        name: string;
      };
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.json(error('未提供认证令牌', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crowdsourcing-platform-secret-key-2026') as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.json(error('认证令牌无效或已过期', 401));
  }
};

export const requireUserType = (...types: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.json(error('用户未认证', 401));
    }

    if (!types.includes(req.user.userType)) {
      return res.json(error('权限不足', 403));
    }

    next();
  };
};

export const requireAdmin = requireUserType('admin');
export const requirePlatform = requireUserType('platform', 'admin');
export const requireOps = requireUserType('ops', 'admin');
export const requireEmployer = requirePlatform;
export const requireProvider = requireOps;
