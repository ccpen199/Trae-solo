const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { is_read, page = 1, pageSize = 20 } = req.query;
  
  let whereClause = 'user_id = ?';
  const params = [req.user.id];

  if (is_read !== undefined && is_read !== '') {
    whereClause += ' AND is_read = ?';
    params.push(is_read === 'true' ? 1 : 0);
  }

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM messages WHERE ${whereClause}
  `);
  const { total } = countStmt.get(...params);

  const offset = (page - 1) * pageSize;
  const messages = db.prepare(`
    SELECT m.*, mo.order_no, mo.title
    FROM messages m
    LEFT JOIN main_orders mo ON m.main_order_id = mo.id
    WHERE ${whereClause}
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    data: messages,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/unread-count', (req, res) => {
  const result = db.prepare(
    'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id);
  
  res.json({ data: { count: result.count } });
});

router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  
  const message = db.prepare('SELECT * FROM messages WHERE id = ? AND user_id = ?').get(id, req.user.id);
  
  if (!message) {
    return res.status(404).json({ message: '消息不存在' });
  }

  db.prepare(`
    UPDATE messages 
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  res.json({ message: '标记已读成功' });
});

router.post('/read-all', (req, res) => {
  db.prepare(`
    UPDATE messages 
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND is_read = 0
  `).run(req.user.id);

  res.json({ message: '全部已读成功' });
});

module.exports = router;
