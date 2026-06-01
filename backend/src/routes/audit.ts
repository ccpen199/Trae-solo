import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest, requireRoles } from '../middleware/auth';
import { findAll, count } from '../dao/base';

const router = Router();

router.get('/', authMiddleware, requireRoles('admin'), (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const page_size = parseInt(req.query.page_size as string) || 50;
  const module = req.query.module as string;
  const action = req.query.action as string;
  const user_id = req.query.user_id as string;

  const where: Record<string, any> = {};
  if (module) where.module = module;
  if (action) where.action = action;
  if (user_id) where.user_id = parseInt(user_id);

  const total = count('audit_logs', { where });
  const data = findAll('audit_logs', {
    where,
    orderBy: 'created_at',
    orderDir: 'DESC',
    limit: page_size,
    offset: (page - 1) * page_size,
  });

  const result = data.map((log: any) => {
    const user = log.user_id ? db.prepare('SELECT id, name, username, role FROM users WHERE id = ?').get(log.user_id) : null;
    return { ...log, user };
  });

  res.json({
    data: result,
    total,
    page,
    page_size,
  });
});

export default router;
