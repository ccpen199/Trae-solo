import { Router, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest, rbacMiddleware, auditMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, rbacMiddleware('user', 'read'), (req: AuthRequest, res) => {
  const { role, keyword } = req.query;
  let sql = 'SELECT id, username, name, email, role, status, points, created_at FROM users WHERE tenant_id = ?';
  const params: any[] = [req.user!.tenantId];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (keyword) { sql += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY created_at DESC LIMIT 100';
  const users = db.prepare(sql).all(...params);
  res.json({ users });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, username, name, email, role, avatar, phone, points, status, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

router.get('/audit/logs', authMiddleware, rbacMiddleware('audit', 'read'), (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const size = parseInt(req.query.size as string) || 20;
  const logs = db.prepare('SELECT a.*, u.name as user_name FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id WHERE a.tenant_id = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?')
    .all(req.user!.tenantId, size, (page - 1) * size);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM audit_logs WHERE tenant_id = ?').get(req.user!.tenantId) as { cnt: number };
  res.json({ logs, total: total.cnt, page, size });
});

export default router;
