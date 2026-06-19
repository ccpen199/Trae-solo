import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getDb } from './database.js';
import type { User } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'recycle-b2b-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: User;
  userEnterprise?: any;
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as User | undefined;
    
    if (!user) {
      res.status(401).json({ error: '用户不存在' });
      return;
    }
    
    req.user = user;
    
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(user.id);
    if (enterprise) {
      req.userEnterprise = enterprise;
    }
    
    next();
  } catch (err) {
    res.status(401).json({ error: '认证令牌无效或已过期' });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: '权限不足，需要角色: ' + roles.join(', ') });
      return;
    }
    next();
  };
}

export function requireVerifiedEnterprise(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.userEnterprise) {
    res.status(403).json({ error: '请先完成企业认证' });
    return;
  }
  if (req.userEnterprise.verification_status !== 'approved') {
    res.status(403).json({ error: '企业认证尚未通过审核' });
    return;
  }
  next();
}
