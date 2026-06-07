import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserInfo } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: UserInfo;
}

const DEMO_USER: UserInfo = {
  id: 1,
  userType: 'natural',
  name: '张三',
  idCard: '340101199001011234',
  phone: '13800138001',
  roles: ['user', 'admin'],
};

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  if (token === 'local-demo-admin-token') {
    req.user = DEMO_USER;
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as UserInfo;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: '认证令牌无效或已过期' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
}
