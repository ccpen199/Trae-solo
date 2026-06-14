const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', (req, res) => {
  const { level, parent_code } = req.query;
  let sql = 'SELECT * FROM regions WHERE status = 1';
  let params = [];

  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }
  if (parent_code) {
    sql += ' AND parent_code = ?';
    params.push(parent_code);
  }
  sql += ' ORDER BY sort_order ASC, code ASC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows });
  });
});

router.get('/tree', (req, res) => {
  db.all('SELECT * FROM regions WHERE status = 1 ORDER BY sort_order ASC, code ASC', (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });

    const buildTree = (parentCode = null) => {
      return rows
        .filter(r => r.parent_code === parentCode)
        .map(r => ({
          ...r,
          children: buildTree(r.code)
        }));
    };

    res.json({ code: 200, data: buildTree(null) });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM regions WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '数据不存在' });
    res.json({ code: 200, data: row });
  });
});

router.post('/', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('创建区域', '区域管理', 'region'), (req, res) => {
  const { code, name, level, parent_code, sort_order } = req.body;
  if (!code || !name || !level) {
    return res.status(400).json({ code: 400, message: '编码、名称、级别不能为空' });
  }

  db.run('INSERT INTO regions (code, name, level, parent_code, sort_order) VALUES (?, ?, ?, ?, ?)',
    [code, name, level, parent_code, sort_order || 0],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.put('/:id', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('更新区域', '区域管理', 'region'), (req, res) => {
  const { name, level, parent_code, sort_order, status } = req.body;
  db.run('UPDATE regions SET name = ?, level = ?, parent_code = ?, sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, level, parent_code, sort_order, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '更新成功' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除区域', '区域管理', 'region'), (req, res) => {
  db.run('UPDATE regions SET status = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
