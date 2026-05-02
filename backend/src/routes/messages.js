const express = require('express');
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { type, is_read, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT m.*,
           u.username as sender_name
    FROM messages m
    LEFT JOIN users u ON m.created_by = u.id
    WHERE m.recipient_id = ?
  `;

  const conditions = [];
  const params = [req.user.id];

  if (type) {
    conditions.push('m.type = ?');
    params.push(type);
  }

  if (is_read !== undefined) {
    conditions.push('m.is_read = ?');
    params.push(is_read === 'true' ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const messages = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM messages m WHERE m.recipient_id = ?';
  if (conditions.length > 0) {
    countQuery += ' AND ' + conditions.join(' AND ');
  }

  const countResult = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM messages 
    WHERE recipient_id = ? AND is_read = 0
  `).get(req.user.id);

  res.json({
    data: messages,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countResult.total
    },
    unread_count: unreadCount.count
  });
});

router.get('/unread', authenticateToken, (req, res) => {
  const counts = db.prepare(`
    SELECT 
      type,
      COUNT(*) as count
    FROM messages 
    WHERE recipient_id = ? AND is_read = 0
    GROUP BY type
  `).all(req.user.id);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM messages 
    WHERE recipient_id = ? AND is_read = 0
  `).get(req.user.id);

  res.json({
    total: total.count,
    by_type: counts.reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {})
  });
});

router.post('/:id/read', authenticateToken, (req, res) => {
  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id);
  
  if (!message) {
    return res.status(404).json({ error: '消息不存在' });
  }

  if (message.recipient_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '权限不足' });
  }

  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);

  res.json({ message: '消息已标记为已读' });
});

router.post('/read-all', authenticateToken, (req, res) => {
  const { type } = req.body;

  let query = 'UPDATE messages SET is_read = 1 WHERE recipient_id = ?';
  const params = [req.user.id];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  const result = db.prepare(query).run(...params);

  res.json({ 
    message: '已标记所有消息为已读',
    updated_count: result.changes
  });
});

module.exports = router;
