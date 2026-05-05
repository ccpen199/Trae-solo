import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DEALER' | 'MEMBER' | 'GUEST';

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
    dealerLevel?: number;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
        dealerLevel: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: '用户不存在或已被禁用' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
      dealerLevel: user.dealerLevel ?? undefined,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: '令牌无效或已过期' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

export const requireDealerLevel = (minLevel: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role !== 'DEALER') {
      return res.status(403).json({ error: '仅限经销商访问' });
    }

    const userLevel = req.user.dealerLevel ?? 1;
    if (userLevel < minLevel) {
      return res.status(403).json({ error: `需要经销商等级 ${minLevel} 及以上` });
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          dealerLevel: true,
        },
      });

      if (user && user.status === 'ACTIVE') {
        req.user = {
          id: user.id,
          username: user.username,
          role: user.role as UserRole,
          dealerLevel: user.dealerLevel ?? undefined,
        };
      }
    } catch (error) {
      // Token 无效但不阻止请求
    }
  }

  next();
};
