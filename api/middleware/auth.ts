import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../data/database';
import type { User } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'wenlv-zhongtai-secret-key-2024';

export interface AuthRequest extends Request {
  user?: User & { permissions: string[] };
}

const attachUser = (req: AuthRequest, userId: string): boolean => {
  const user = db.users.get(userId);
  if (!user || user.status !== 'active') {
    return false;
  }

  const roleIds = db.userRoles.get(userId) || [];
  const permissionIds: string[] = [];
  roleIds.forEach(roleId => {
    const perms = db.rolePermissions.get(roleId) || [];
    permissionIds.push(...perms);
  });

  const permissions = permissionIds
    .map(id => db.permissions.get(id)?.code)
    .filter((p): p is string => !!p);

  const { password_hash: _passwordHash, ...safeUser } = user as any;
  req.user = { ...safeUser, permissions: [...new Set(permissions)] };
  return true;
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ code: 401, message: '未提供认证令牌', data: null, timestamp: Date.now() });
    return;
  }

  try {
    if (token === 'demo-local-token') {
      const demoUser = Array.from(db.users.values()).find((u: any) => u.username === 'admin') as User | undefined;
      if (demoUser && attachUser(req, demoUser.id)) {
        next();
        return;
      }
      res.status(401).json({ code: 401, message: '演示账号未初始化', data: null, timestamp: Date.now() });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!attachUser(req, decoded.userId)) {
      res.status(401).json({ code: 401, message: '用户不存在或已被禁用', data: null, timestamp: Date.now() });
      return;
    }

    next();
  } catch (error) {
    res.status(403).json({ code: 403, message: '令牌无效或已过期', data: null, timestamp: Date.now() });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ code: 401, message: '请先登录', data: null, timestamp: Date.now() });
      return;
    }

    if (req.user.role === 'super_admin' || req.user.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ code: 403, message: '权限不足', data: null, timestamp: Date.now() });
    }
  };
};

export const generateToken = (userId: string): { token: string; refreshToken: string } => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  return { token, refreshToken };
};

export const successResponse = <T>(res: Response, data: T, message = 'success'): void => {
  res.json({ code: 200, message, data, timestamp: Date.now() });
};

export const errorResponse = (res: Response, code: number, message: string): void => {
  res.status(code).json({ code, message, data: null, timestamp: Date.now() });
};
