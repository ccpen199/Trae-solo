import { Router } from 'express';
import db from '../db';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthRequest, res) => {
  const { page = 1, pageSize = 30, is_read, type } = req.query as any;
  const offset = (page - 1) * pageSize;
  let where = ['user_id = ?'];
  let params: any[] = [req.user.id];
  if (is_read !== undefined) { where.push('is_read = ?'); params.push(is_read ? 1 : 0); }
  if (type) { where.push('type = ?'); params.push(type); }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const total = (db.prepare(`SELECT COUNT(*) c FROM notifications ${whereSql}`).get(...params) as any).c;
  const list = db.prepare(`SELECT * FROM notifications ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);
  const unreadCount = (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id) as any).c;
  res.json({ list, total, page: +page, pageSize: +pageSize, unread_count: unreadCount });
});

router.patch('/:id/read', (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: '已标记已读' });
});

router.patch('/all/read', (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
  res.json({ message: '全部已标记已读' });
});

router.get('/unread-count', (req: AuthRequest, res) => {
  const unreadCount = (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id) as any).c;
  const byType = db.prepare('SELECT type, COUNT(*) c FROM notifications WHERE user_id = ? AND is_read = 0 GROUP BY type').all(req.user.id);
  res.json({ unread_count: unreadCount, by_type: byType });
});

export default router;
