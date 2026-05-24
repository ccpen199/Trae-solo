const express = require('express');
const db = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/my', authenticate, (req, res) => {
  const { read, page = 1, pageSize = 20 } = req.query;
  let sql = `
    SELECT * FROM notifications 
    WHERE user_id = ?
  `;
  const params = [req.user.id];
  
  if (read !== undefined) {
    sql += ' AND read = ?';
    params.push(read === 'true' ? 1 : 0);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (page - 1) * pageSize);
  
  const notifications = db.prepare(sql).all(...params);
  res.json(notifications);
});

router.get('/unread-count', authenticate, (req, res) => {
  const count = db.prepare(`
    SELECT COUNT(*) as count FROM notifications 
    WHERE user_id = ? AND read = 0
  `).get(req.user.id).count;
  res.json({ unread_count: count });
});

router.post('/:id/read', authenticate, (req, res) => {
  db.prepare(`
    UPDATE notifications SET read = 1 
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);
  res.json({ message: '已标记已读' });
});

router.post('/read-all', authenticate, (req, res) => {
  db.prepare(`
    UPDATE notifications SET read = 1 
    WHERE user_id = ?
  `).run(req.user.id);
  res.json({ message: '全部已读' });
});

module.exports = router;
