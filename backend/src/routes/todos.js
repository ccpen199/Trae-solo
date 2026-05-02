const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { is_read, status, document_id } = req.query;
  let query = `
    SELECT tm.*, d.title as document_title, d.main_order_no, d.status as document_status
    FROM todo_messages tm
    JOIN documents d ON tm.document_id = d.id
    WHERE tm.user_id = ?
  `;
  const params = [req.user.id];

  if (is_read !== undefined) {
    query += ' AND tm.is_read = ?';
    params.push(parseInt(is_read));
  }

  if (status) {
    query += ' AND tm.status = ?';
    params.push(status);
  }

  if (document_id) {
    query += ' AND tm.document_id = ?';
    params.push(parseInt(document_id));
  }

  query += ' ORDER BY tm.created_at DESC';

  const messages = db.prepare(query).all(...params);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM todo_messages WHERE user_id = ? AND is_read = 0
  `).get(req.user.id);

  res.json({ messages, unreadCount: unreadCount.count });
});

router.post('/:id/read', authenticateToken, (req, res) => {
  const messageId = parseInt(req.params.id);

  const message = db.prepare('SELECT * FROM todo_messages WHERE id = ?').get(messageId);
  if (!message) {
    return res.status(404).json({ error: '消息不存在' });
  }

  if (message.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能标记自己的消息' });
  }

  db.prepare('UPDATE todo_messages SET is_read = 1 WHERE id = ?').run(messageId);
  res.json({ message: '已标记为已读' });
});

router.post('/:id/complete', authenticateToken, (req, res) => {
  const messageId = parseInt(req.params.id);

  const message = db.prepare('SELECT * FROM todo_messages WHERE id = ?').get(messageId);
  if (!message) {
    return res.status(404).json({ error: '消息不存在' });
  }

  if (message.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能处理自己的消息' });
  }

  db.prepare('UPDATE todo_messages SET status = ? WHERE id = ?').run('completed', messageId);
  res.json({ message: '已标记为完成' });
});

router.post('/read-all', authenticateToken, (req, res) => {
  db.prepare('UPDATE todo_messages SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
  res.json({ message: '已全部标记为已读' });
});

module.exports = router;
