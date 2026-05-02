import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../entities';
import * as response from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'air-cargo-management-secret-key-2024';

export interface AuthPayload {
  id: string;
  username: string;
  role: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  const payload: AuthPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(response.unauthorized('未提供认证Token'));
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json(response.unauthorized('Token无效或已过期'));
  }

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id: payload.id });

  if (!user || !user.active) {
    return res.status(401).json(response.unauthorized('用户不存在或已被禁用'));
  }

  req.user = user;
  next();
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json(response.unauthorized('未登录'));
    }

    if (allowedRoles.includes('admin') || user.role === 'admin') {
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json(response.forbidden('无权限执行此操作'));
    }

    next();
  };
}

export function getRoleDisplay(role: string): string {
  const roleMap: Record<string, string> = {
    forwarder: '货代',
    airline: '航司',
    warehouse: '仓库',
    security: '安检',
    consignee: '收货人',
    admin: '管理员',
  };
  return roleMap[role] || role;
}

export function getRolePriority(role: string): number {
  const priorityMap: Record<string, number> = {
    admin: 0,
    forwarder: 1,
    airline: 2,
    warehouse: 3,
    security: 4,
    consignee: 5,
  };
  return priorityMap[role] ?? 99;
}
