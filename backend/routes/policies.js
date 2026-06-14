const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, keyword, policy_type, is_hot } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM policy_interpretations WHERE status = 1';
  let countSql = 'SELECT COUNT(*) as total FROM policy_interpretations WHERE status = 1';
  let params = [];
  let countParams = [];

  if (keyword) {
    sql += ' AND (title LIKE ? OR content LIKE ?)';
    countSql += ' AND (title LIKE ? OR content LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw);
    countParams.push(kw, kw);
  }
  if (policy_type) {
    sql += ' AND policy_type = ?';
    countSql += ' AND policy_type = ?';
    params.push(policy_type);
    countParams.push(policy_type);
  }
  if (is_hot) {
    sql += ' AND is_hot = ?';
    countSql += ' AND is_hot = ?';
    params.push(is_hot);
    countParams.push(is_hot);
  }

  sql += ' ORDER BY is_hot DESC, sort_order ASC, publish_time DESC, id DESC LIMIT ? OFFSET ?';
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

router.get('/hot', (req, res) => {
  db.all('SELECT * FROM policy_interpretations WHERE status = 1 AND is_hot = 1 ORDER BY sort_order ASC, publish_time DESC LIMIT 5',
    (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM policy_interpretations WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '政策解读不存在' });

    db.run('UPDATE policy_interpretations SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);

    res.json({ code: 200, data: row });
  });
});

router.post('/', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('创建政策解读', '政策解读', 'policy'), (req, res) => {
  const { title, content, policy_type, publish_department, file_url, is_hot, sort_order } = req.body;

  if (!title) {
    return res.status(400).json({ code: 400, message: '标题不能为空' });
  }

  db.run('INSERT INTO policy_interpretations (title, content, policy_type, publish_department, publish_time, file_url, is_hot, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, content, policy_type, publish_department, new Date().toISOString(), file_url, is_hot || 0, sort_order || 0],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.put('/:id', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('更新政策解读', '政策解读', 'policy'), (req, res) => {
  const { title, content, policy_type, publish_department, file_url, is_hot, sort_order, status } = req.body;

  db.run('UPDATE policy_interpretations SET title = ?, content = ?, policy_type = ?, publish_department = ?, file_url = ?, is_hot = ?, sort_order = ?, status = ? WHERE id = ?',
    [title, content, policy_type, publish_department, file_url, is_hot, sort_order, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '更新成功' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除政策解读', '政策解读', 'policy'), (req, res) => {
  db.run('UPDATE policy_interpretations SET status = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
