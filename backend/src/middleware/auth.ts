import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    real_name: string;
    role_id: number;
    store_id: number | null;
    role: string;
    permissions: string[];
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pos-secret') as any;
    const user = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.role_id, u.store_id, u.status,
             r.name as role_name, r.permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: '用户不存在或已禁用' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role_id: user.role_id,
      store_id: user.store_id,
      role: user.role_name,
      permissions: JSON.parse(user.permissions || '[]')
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: '认证令牌无效' });
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const perms = req.user.permissions;
    if (perms.includes('*') || perms.includes(permission)) {
      return next();
    }

    const [module, action] = permission.split(':');
    if (perms.includes(`${module}:*`)) {
      return next();
    }

    return res.status(403).json({ error: '权限不足' });
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }
    if (roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: '角色权限不足' });
  };
};

export const logOperation = (module: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const send = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode < 400) {
        try {
          const ip = req.ip || req.connection.remoteAddress || '';
          db.prepare(`
            INSERT INTO operation_logs (user_id, action, module, content, ip)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            req.user?.id || null,
            action,
            module,
            typeof body === 'string' ? body : JSON.stringify(body).substring(0, 500),
            ip
          );
        } catch (e) {
          console.error('操作日志记录失败:', e);
        }
      }
      return send(body);
    };
    next();
  };
};
