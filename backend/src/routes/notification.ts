import express from 'express';
import { getDb } from '../database.js';
import { authMiddleware, type AuthRequest } from '../middleware.js';

const router = express.Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const { is_read, type, page = '1', pageSize = '30' } = req.query;
  const db = getDb();

  const where: string[] = ['user_id = ?'];
  const params: any[] = [req.user!.id];

  if (is_read !== undefined) {
    where.push('is_read = ?');
    params.push(is_read === 'true' ? 1 : 0);
  }
  if (type) {
    where.push('type = ?');
    params.push(type);
  }

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  params.push(parseInt(pageSize as string), offset);

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE ${where.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(req.user!.id) as any;

  const counts = db.prepare(`
    SELECT type, COUNT(*) as count 
    FROM notifications 
    WHERE user_id = ? AND is_read = 0
    GROUP BY type
  `).all(req.user!.id) as any[];

  const typeCount: Record<string, number> = {};
  counts.forEach(c => { typeCount[c.type] = c.count; });

  res.json({
    notifications,
    unread_count: unreadCount.count,
    type_count: typeCount
  });
});

router.get('/unread-count', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(req.user!.id) as any;

  res.json({ unread_count: result.count });
});

router.put('/:id/read', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id) as any;
  if (!notif || notif.user_id !== req.user!.id) {
    res.status(403).json({ error: '无权操作' });
    return;
  }

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '已标记为已读' });
});

router.put('/read-all', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user!.id);
  res.json({ message: '已全部标记为已读' });
});

export default router;
