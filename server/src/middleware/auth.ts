import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    avatar: string | null;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未登录或登录已过期',
    });
  }
  
  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, status: 1 },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    });
    
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用',
      });
    }
    
    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录',
    });
  }
};

// 可选的认证中间件，如果有 token 就解析，没有也放行
export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, status: 1 },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
      },
    });
    
    if (user) {
      req.userId = user.id;
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};
