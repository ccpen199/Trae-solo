import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: UserRole;
        status: UserStatus;
      };
    }
  }
}

export interface AuthPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);
    
    const session = await prisma.session.findFirst({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            status: true
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: '无效的认证令牌'
      });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({
        success: false,
        error: '认证令牌已过期'
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      
      if (decoded.userId !== session.user.id) {
        return res.status(401).json({
          success: false,
          error: '无效的认证令牌'
        });
      }
    } catch (e) {
      return res.status(401).json({
        success: false,
        error: '认证令牌已过期或无效'
      });
    }

    if (session.user.status === UserStatus.BANNED) {
      return res.status(403).json({
        success: false,
        error: '您的账号已被封禁'
      });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: '认证失败'
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要登录'
      });
    }

    if (req.user.status === UserStatus.MUTED) {
      const now = new Date();
      await prisma.user.findUnique({
        where: { id: req.user.id }
      }).then(user => {
        if (user?.mutedUntil && user.mutedUntil > now) {
          return res.status(403).json({
            success: false,
            error: `您已被禁言，将在 ${user.mutedUntil.toLocaleString()} 后解禁`
          });
        }
        next();
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    const session = await prisma.session.findFirst({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            status: true
          }
        }
      }
    });

    if (session && session.expiresAt > new Date()) {
      try {
        jwt.verify(token, config.jwt.secret);
        req.user = session.user;
      } catch (e) {
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const generateToken = (userId: string, username: string, role: UserRole): string => {
  return jwt.sign(
    { userId, username, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};
