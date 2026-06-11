import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/connection.js';
import type { User, UserRole } from '../../../shared/types.js';

interface AuthRequest extends Request {
  user?: User & { permissions: string[] };
}

const JWT_SECRET = process.env.JWT_SECRET || 'smart_community_2024_secret_key';

const rolePermissions: Record<UserRole, string[]> = {
  owner: ['access:manage', 'workorder:create', 'workorder:view', 'mall:view', 'mall:order', 'social:view', 'social:post', 'profile:view'],
  tenant: ['access:use', 'workorder:create', 'workorder:view', 'mall:view', 'mall:order', 'social:view', 'social:post', 'profile:view'],
  visitor: ['access:use', 'mall:view'],
  property: ['access:manage', 'workorder:manage', 'workorder:view', 'risk:view', 'risk:manage', 'analytics:view', 'property:dashboard'],
  merchant: ['mall:manage', 'product:manage', 'coupon:manage', 'order:view', 'merchant:dashboard', 'analytics:view']
};

export function authMiddleware(requiredRoles?: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: '未提供认证令牌' });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as User | undefined;
      
      if (!user) {
        return res.status(401).json({ success: false, error: '用户不存在' });
      }

      if (requiredRoles && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ success: false, error: '权限不足' });
      }

      req.user = {
        ...user,
        permissions: rolePermissions[user.role] || []
      };

      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: '认证令牌无效' });
    }
  };
}

export default authMiddleware;
