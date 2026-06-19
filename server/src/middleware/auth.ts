import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { error } from '../utils/response';
import { getDB } from '../models/database';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      deviceId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json(error('未登录', 401));
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json(error('登录已过期', 401));
  }

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
  if (!user) {
    return res.status(401).json(error('用户不存在', 401));
  }

  if ((user as any).is_blocked) {
    return res.status(403).json(error('账号已被封禁', 403));
  }

  req.user = user;
  next();
}

export function deviceMiddleware(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.headers['x-device-id'] as string;
  req.deviceId = deviceId || '';
  next();
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json(error('未登录', 401));
  }

  const payload = verifyToken(token);
  if (!payload || !payload.adminId) {
    return res.status(401).json(error('登录已过期', 401));
  }

  const db = getDB();
  const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(payload.adminId);
  if (!admin) {
    return res.status(401).json(error('管理员不存在', 401));
  }

  (req as any).admin = admin;
  next();
}
