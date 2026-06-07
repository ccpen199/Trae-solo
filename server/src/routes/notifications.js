import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query;
    const db = getDB();
    const conditions = ['n.user_id = ?'];
    const params = [req.user.id];

    if (type) {
      conditions.push('n.type = ?');
      params.push(type);
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM notifications n ${where}`).get(...params).cnt;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(`
      SELECT n.* FROM notifications n ${where}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);

    res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unread-count', (req, res) => {
  try {
    const db = getDB();
    const count = db.prepare('SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).cnt;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', (req, res) => {
  try {
    const db = getDB();
    const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: '通知不存在' });
    }
    res.json({ message: '已标记为已读' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', (req, res) => {
  try {
    const db = getDB();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
    res.json({ message: '已全部标记为已读' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', roleMiddleware('admin', 'super_admin', 'operator'), (req, res) => {
  try {
    const { user_id, title, content, type, link } = req.body;
    if (!user_id || !title || !content) {
      return res.status(400).json({ error: '用户ID、标题和内容不能为空' });
    }

    const db = getDB();
    const result = db.prepare(`
      INSERT INTO notifications (user_id, title, content, type, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(user_id, title, content, type || 'system', link || null);

    res.status(201).json({ id: result.lastInsertRowid, message: '通知创建成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
