import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { parseJson } from '../utils/json';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        nickname: true,
        avatar: true,
        role: true,
        interestTags: true,
        latitude: true,
        longitude: true,
        locationName: true,
        isVerified: true,
        creditScore: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.userId = user.id;
    req.user = { ...user, interestTags: parseJson<string[]>(user.interestTags, []) };
    next();
  } catch (error) {
    res.status(401).json({ error: '认证失败' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};
