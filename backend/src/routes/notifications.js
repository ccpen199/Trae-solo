const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { page = 1, pageSize = 20, unread } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = ['user_id = ?'];
  let params = [req.user.id];
  
  if (unread === 'true') {
    where.push('read = 0');
  }
  
  const whereClause = where.join(' AND ');
  
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE ${whereClause}
  `).get(...params).count;
  
  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
  `).get(req.user.id).count;
  
  res.json({
    data: notifications,
    total,
    unreadCount,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/:id/read', authenticate, (req, res) => {
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  
  if (!notification) {
    return res.status(404).json({ error: '通知不存在' });
  }
  
  if (notification.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此通知' });
  }
  
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  
  res.json({ message: '已标记为已读' });
});

router.post('/read-all', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(req.user.id);
  
  res.json({ message: '已全部标记为已读' });
});

module.exports = router;
