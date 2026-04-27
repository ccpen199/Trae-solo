import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, UserRole, UserRoleType } from '../config';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        name: string;
        role: string;
        department?: string | null;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
  department?: string;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: '用户不存在或已禁用' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
};

export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，无法执行此操作' });
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
      };
    }
  } catch {
  }

  next();
};
