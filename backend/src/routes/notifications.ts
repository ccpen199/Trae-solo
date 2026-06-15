import { Router, Request, Response } from 'express';
import { getDB } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { page = 1, limit = 20, read } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (read !== undefined) {
    whereClause += ' AND read = ?';
    params.push(read === 'true' ? 1 : 0);
  }

  const notifications = db.prepare(`
    SELECT * FROM notifications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    ${whereClause}
  `).get(...params) as any;

  const unreadCount = db.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
  ).get(req.user!.id) as any;

  res.json({ notifications, total: total.count, unread_count: unreadCount.count });
});

router.post('/:id/read', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id) as any;
  
  if (!notification || notification.user_id !== req.user!.id) {
    return res.status(404).json({ error: '通知不存在' });
  }

  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);

  res.json({ success: true });
});

router.post('/read-all', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user!.id);

  res.json({ success: true });
});

export default router;
