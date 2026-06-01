import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import db from '../db';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ code: 401, message: '未认证', data: null });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ code: 403, message: '权限不足，需要角色: ' + roles.join(','), data: null });
      return;
    }

    next();
  };
}

export function checkPermission(action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ code: 401, message: '未认证', data: null });
      return;
    }

    if (req.user.role === 'admin') {
      next();
      return;
    }

    const clusterId = req.params.clusterId || req.body.cluster_id;
    const namespace = req.params.namespace || req.body.namespace;

    const stmt = db.prepare(`
      SELECT id FROM permissions
      WHERE user_id = ? AND action = ?
        AND (cluster_id = ? OR cluster_id IS NULL)
        AND (namespace = ? OR namespace IS NULL)
      LIMIT 1
    `);

    const perm = stmt.get(req.user.userId, action, clusterId || null, namespace || null) as { id: string } | undefined;

    if (!perm) {
      res.status(403).json({ code: 403, message: '无权限执行此操作', data: null });
      return;
    }

    next();
  };
}
