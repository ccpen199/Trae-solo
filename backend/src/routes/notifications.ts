import { Router } from 'express';
import { db } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const unreadOnly = req.query.unread === 'true';
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [req.user!.id];
  if (unreadOnly) { sql += ' AND is_read = 0'; }
  sql += ' ORDER BY created_at DESC LIMIT 50';
  const notifications = db.prepare(sql).all(...params);
  res.json({ notifications });
});

router.get('/unread-count', authMiddleware, (req: AuthRequest, res) => {
  const result = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user!.id) as { cnt: number };
  res.json({ count: result.cnt });
});

router.post('/:id/read', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  res.json({ success: true });
});

router.post('/read-all', authMiddleware, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
  res.json({ success: true });
});

export default router;
