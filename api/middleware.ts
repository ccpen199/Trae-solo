import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';
import type { UserRole, UserResponse, AuthRequest, AuthPayload } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'etc-secret-key-change-in-production';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' });
    return;
  }

  try {
    const token = header.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

    const user = db.prepare(`
      SELECT u.id, u.username, u.role, u.name, u.phone, u.email, u.fleet_id, u.created_at, u.updated_at,
             f.name as fleet_name
      FROM users u
      LEFT JOIN fleets f ON u.fleet_id = f.id
      WHERE u.id = ?
    `).get(decoded.id) as UserResponse | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' });
      return;
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ success: false, error: '令牌无效或已过期' });
  }
}

export const requireAuth = authenticate;

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未认证' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: '权限不足' });
      return;
    }

    next();
  };
}

export const requireRole = requireRoles;

export function scopeToOwn(fleetField = 'fleet_id', ownerField = 'owner_id') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: '未认证' });
      return;
    }

    if (req.user.role === 'admin' || req.user.role === 'operation' || req.user.role === 'maintenance') {
      next();
      return;
    }

    if (req.user.role === 'fleet_admin' && req.user.fleet_id) {
      req.query[fleetField] = String(req.user.fleet_id);
      next();
      return;
    }

    if (req.user.role === 'owner') {
      req.query[ownerField] = String(req.user.id);
      next();
      return;
    }

    next();
  };
}

export function signToken(user: { id: number }): string {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

export function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] as string ||
         req.socket.remoteAddress || '127.0.0.1';
}

export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || '';
}
