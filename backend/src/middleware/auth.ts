import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt';
import { unauthorizedResponse } from '../utils/response';
import { getDb } from '../database';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    avatar_config: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json(unauthorizedResponse('未提供认证令牌'));
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json(unauthorizedResponse('认证令牌无效或已过期'));
    }
    
    const db = getDb();
    const user = db
      .prepare('SELECT id, username, nickname, avatar_config FROM users WHERE id = ?')
      .get(payload.userId) as { id: string; username: string; nickname: string; avatar_config: string } | undefined;
    
    if (!user) {
      return res.status(401).json(unauthorizedResponse('用户不存在'));
    }
    
    req.userId = payload.userId;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json(unauthorizedResponse('认证失败'));
  }
};

export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return next();
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return next();
    }
    
    const db = getDb();
    const user = db
      .prepare('SELECT id, username, nickname, avatar_config FROM users WHERE id = ?')
      .get(payload.userId) as { id: string; username: string; nickname: string; avatar_config: string } | undefined;
    
    if (user) {
      req.userId = payload.userId;
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};
