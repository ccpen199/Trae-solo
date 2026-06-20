import type { Request, Response, NextFunction } from 'express';
import { mockUsers } from '@shared/mock/data.js';
import type { User } from '@shared/types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    const defaultUser = mockUsers[0];
    req.user = defaultUser;
    next();
    return;
  }
  
  const user = mockUsers.find(u => u.id === token);
  if (user) {
    req.user = user;
    next();
  } else {
    req.user = mockUsers[0];
    next();
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: '需要管理员权限' });
    return;
  }
  next();
};
