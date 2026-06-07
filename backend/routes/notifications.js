const express = require('express');
const { getDB } = require('../db/init');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, (req, res) => {
  const db = getDB();
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.user.id, Number(limit), Number(offset));

  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

  res.json({ notifications, unreadCount, page: Number(page), limit: Number(limit) });
});

router.put('/:id/read', verifyToken, (req, res) => {
  const db = getDB();
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', verifyToken, (req, res) => {
  const db = getDB();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
  res.json({ message: 'All marked as read' });
});

module.exports = router;
