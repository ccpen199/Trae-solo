import express from 'express';
import db from '../database/index.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/records', (req, res) => {
  const { status = 0, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT r.*, u.nickname, u.username, u.avatar
    FROM risk_records r
    JOIN users u ON r.user_id = u.id
    WHERE r.status = ?
    ORDER BY r.severity DESC, r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(status), parseInt(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM risk_records WHERE status = ?').get(parseInt(status)).count;

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/:recordId/handle', (req, res) => {
  const recordId = parseInt(req.params.recordId);
  const { action, reason } = req.body;

  const record = db.prepare('SELECT * FROM risk_records WHERE id = ?').get(recordId);
  if (!record) {
    return res.status(404).json({ error: '风控记录不存在' });
  }

  if (action === 'ban') {
    db.prepare('UPDATE users SET status = 0 WHERE id = ?').run(record.user_id);
    db.prepare(`
      UPDATE risk_records 
      SET status = 1, handler_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, recordId);
  } else if (action === 'limit') {
    db.prepare(`
      UPDATE risk_records 
      SET status = 1, handler_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, recordId);
  } else if (action === 'restore') {
    db.prepare('UPDATE users SET status = 1 WHERE id = ?').run(record.user_id);
    db.prepare(`
      UPDATE risk_records 
      SET status = 2, handler_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, recordId);
  } else if (action === 'ignore') {
    db.prepare(`
      UPDATE risk_records 
      SET status = 2, handler_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, recordId);
  }

  res.json({ success: true });
});

router.get('/stats/abnormal-growth', (req, res) => {
  const days = parseInt(req.query.days || 7);

  const data = db.prepare(`
    SELECT 
      user_id,
      COUNT(*) as new_followers,
      u.nickname,
      u.username
    FROM relations r
    JOIN users u ON r.following_id = u.id
    WHERE r.created_at >= datetime('now', ?)
    GROUP BY user_id
    HAVING new_followers >= 50
    ORDER BY new_followers DESC
    LIMIT 50
  `).all(`-${days} days`);

  res.json({ list: data });
});

router.get('/logs/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const { page = 1, pageSize = 50 } = req.query;
  const offset = (page - 1) * pageSize;

  const logs = db.prepare(`
    SELECT * FROM action_logs
    WHERE user_id = ? OR target_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, userId, parseInt(pageSize), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM action_logs
    WHERE user_id = ? OR target_id = ?
  `).get(userId, userId).count;

  res.json({ list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

export default router;
