import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../database';
import type { AuthenticatedRequest, Resident, ResidentRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'neighborhood-platform-secret-key-2024';

export { JWT_SECRET };

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const authHeader = authReq.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const db = getDb();
    const resident = db.prepare('SELECT * FROM residents WHERE id = ? AND status = ?').get(decoded.id, 'active') as Resident | undefined;

    if (!resident) {
      res.status(401).json({ success: false, error: '用户不存在或已禁用' });
      return;
    }

    authReq.user = resident;
    next();
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' });
  }
}

export function requireRole(...roles: ResidentRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ success: false, error: '未认证' });
      return;
    }

    if (!roles.includes(authReq.user.role)) {
      res.status(403).json({ success: false, error: '权限不足' });
      return;
    }

    next();
  };
}

export function requireCommunity(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.user) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  if (!authReq.community) {
    res.status(400).json({ success: false, error: '未指定社区' });
    return;
  }

  if (authReq.user.role !== 'platform_admin' && authReq.user.community_id !== authReq.community.id) {
    res.status(403).json({ success: false, error: '不属于当前社区' });
    return;
  }

  next();
}
