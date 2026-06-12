import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database';
import { v4 as uuidv4 } from 'uuid';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    username: string;
    role: string;
    name: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const user = db.prepare('SELECT id, tenant_id, username, role, name FROM users WHERE id = ? AND status = ?').get(decoded.userId, 'active') as any;
    if (!user) return res.status(401).json({ error: '用户不存在或已禁用' });
    req.user = { id: user.id, tenantId: user.tenant_id, username: user.username, role: user.role, name: user.name };
    next();
  } catch (e) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}

export function rbacMiddleware(resource: string, action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: '未认证' });
    const role = req.user.role;
    if (role === 'admin') return next();
    const perm = db.prepare('SELECT id FROM permissions WHERE (role = ? OR role = ?) AND (resource = ? OR resource = ?) AND (action = ? OR action = ?)').get(role, '*', resource, '*', action, '*');
    if (!perm) return res.status(403).json({ error: '无权限执行此操作' });
    next();
  };
}

export function auditMiddleware(action: string, resourceType?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.json.bind(res);
    res.json = (body: any) => {
      if (req.user && (res.statusCode < 400)) {
        try {
          const resourceId = req.params.id || body?.id;
          db.prepare('INSERT INTO audit_logs (id, tenant_id, user_id, action, resource_type, resource_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
            uuidv4(), req.user.tenantId, req.user.id, action, resourceType, resourceId,
            JSON.stringify({ body: req.body, params: req.params, query: req.query }).slice(0, 1000),
            req.ip || req.socket.remoteAddress
          );
        } catch (e) {
          console.error('audit log error:', e);
        }
      }
      return originalSend(body);
    };
    next();
  };
}
