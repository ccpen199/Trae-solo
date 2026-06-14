import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
    email: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'talent-platform-shandong-2024-secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '认证令牌无效或已过期' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足，需要角色: ' + roles.join(', ') });
    }
    
    next();
  };
};

export const getCurrentUser = async (req: AuthRequest) => {
  if (!req.user) return null;
  return prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      jobseekerProfile: true,
      hrProfile: { include: { company: true } },
      schoolProfile: { include: { school: true } },
      regulatorProfile: true,
    },
  });
};
