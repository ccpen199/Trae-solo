const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole, normalizeRoles } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM roles WHERE COALESCE(status, 1) = 1 ORDER BY id ASC', (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: normalizeRoles(rows) });
  });
});

router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM roles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '角色不存在' });
    res.json({ code: 200, data: normalizeRoles([row])[0] });
  });
});

router.post('/', authenticateToken, requireRole(['super_admin']), auditLog('创建角色', '角色管理', 'role'), (req, res) => {
  const { name, code, description, level, permissions } = req.body;
  if (!name || !code) {
    return res.status(400).json({ code: 400, message: '角色名称和编码不能为空' });
  }

  db.run('INSERT INTO roles (name, code, description, level, permissions) VALUES (?, ?, ?, ?, ?)',
    [name, code, description, level || 'user', permissions],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.put('/:id', authenticateToken, requireRole(['super_admin']), auditLog('更新角色', '角色管理', 'role'), (req, res) => {
  const { name, description, level, permissions, status } = req.body;
  db.run('UPDATE roles SET name = ?, description = ?, level = ?, permissions = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, description, level, permissions, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '更新成功' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除角色', '角色管理', 'role'), (req, res) => {
  db.run('UPDATE roles SET status = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
