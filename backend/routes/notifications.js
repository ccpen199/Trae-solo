const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { page = 1, pageSize = 20, is_read, type } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  let countSql = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
  let params = [req.user.id];
  let countParams = [req.user.id];

  if (is_read !== undefined) {
    sql += ' AND is_read = ?';
    countSql += ' AND is_read = ?';
    params.push(is_read);
    countParams.push(is_read);
  }
  if (type) {
    sql += ' AND type = ?';
    countSql += ' AND type = ?';
    params.push(type);
    countParams.push(type);
  }

  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, parseInt(pageSize), offset];

  db.get(countSql, countParams, (err, countRow) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    db.all(sql, queryParams, (err, rows) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({
        code: 200,
        data: {
          list: rows,
          total: countRow.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

router.get('/unread-count', authenticateToken, (req, res) => {
  db.get('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { unread_count: row?.unread || 0 } });
    });
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      if (!row) return res.status(404).json({ code: 404, message: '通知不存在' });

      if (row.is_read === 0) {
        db.run('UPDATE notifications SET is_read = 1, read_time = ? WHERE id = ?',
          [new Date().toISOString(), req.params.id]);
        row.is_read = 1;
      }

      res.json({ code: 200, data: row });
    });
});

router.put('/:id/read', authenticateToken, (req, res) => {
  db.run('UPDATE notifications SET is_read = 1, read_time = ? WHERE id = ? AND user_id = ?',
    [new Date().toISOString(), req.params.id, req.user.id], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '已标记为已读' });
    });
});

router.put('/read-all', authenticateToken, (req, res) => {
  db.run('UPDATE notifications SET is_read = 1, read_time = ? WHERE user_id = ? AND is_read = 0',
    [new Date().toISOString(), req.user.id], (err) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '全部已标记为已读' });
    });
});

router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

router.delete('/clear-read', authenticateToken, (req, res) => {
  db.run('DELETE FROM notifications WHERE user_id = ? AND is_read = 1', [req.user.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '已清除已读通知' });
  });
});

module.exports = router;
