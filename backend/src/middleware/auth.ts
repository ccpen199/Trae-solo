import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    security_level: number;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'clue_management_secret_key_2024';
    const decoded = jwt.verify(token, secret) as any;
    
    const user = db.prepare('SELECT id, username, role, security_level FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: '无效的认证令牌' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}

export function requireSecurityLevel(level: number) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    if (req.user.security_level < level) {
      return res.status(403).json({ error: '保密等级不足，无法访问此线索' });
    }
    next();
  };
}

export function logOperation(action: string, targetType?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    next();
    if (res.statusCode < 400 && req.user) {
      const targetId = req.params.id || (req.body as any).id;
      const details = JSON.stringify(req.body);
      const ip = req.ip || req.connection.remoteAddress;
      
      db.prepare(`
        INSERT INTO operation_logs (user_id, action, target_type, target_id, details, ip)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, action, targetType, targetId, details.substring(0, 500), ip);
    }
  };
}
