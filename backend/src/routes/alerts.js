const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { is_read, type, limit = 50 } = req.query;

  let sql = `
    SELECT a.*
    FROM alerts a
    WHERE 1=1
  `;

  const params = [];

  if (is_read !== undefined) {
    sql += ' AND a.is_read = ?';
    params.push(is_read ? 1 : 0);
  }
  if (type) {
    sql += ' AND a.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY a.created_at DESC LIMIT ?';
  params.push(limit);

  const alerts = db.prepare(sql).all(...params);
  res.json(alerts);
});

router.get('/unread-count', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE is_read = 0').get().count;
  res.json({ count });
});

router.put('/:id/read', (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) {
    return res.status(404).json({ error: '告警不存在' });
  }

  db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: '已标记为已读' });
});

router.put('/read-all', (req, res) => {
  db.prepare('UPDATE alerts SET is_read = 1 WHERE is_read = 0').run();
  res.json({ message: '全部标记为已读' });
});

module.exports = router;
