const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

router.get('/', (req, res) => {
  const { region_code, parent_id } = req.query;
  let sql = 'SELECT d.*, r.name as region_name FROM departments d LEFT JOIN regions r ON d.region_code = r.code WHERE d.status = 1';
  let params = [];

  if (region_code) {
    sql += ' AND d.region_code = ?';
    params.push(region_code);
  }
  if (parent_id) {
    sql += ' AND d.parent_id = ?';
    params.push(parent_id);
  }
  sql += ' ORDER BY d.sort_order ASC, d.code ASC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT d.*, r.name as region_name FROM departments d LEFT JOIN regions r ON d.region_code = r.code WHERE d.id = ?',
    [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '数据不存在' });
    res.json({ code: 200, data: row });
  });
});

router.post('/', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('创建部门', '部门管理', 'department'), (req, res) => {
  const { code, name, region_code, parent_id, description, contact_info, contact_person, contact_phone, address, sort_order } = req.body;
  if (!code || !name) {
    return res.status(400).json({ code: 400, message: '编码和名称不能为空' });
  }

  db.run('INSERT INTO departments (code, name, region_code, parent_id, description, contact_info, contact_person, contact_phone, address, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [code, name, region_code, parent_id, description, contact_info, contact_person, contact_phone, address, sort_order || 0],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.put('/:id', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin']), auditLog('更新部门', '部门管理', 'department'), (req, res) => {
  const { name, region_code, parent_id, description, contact_info, contact_person, contact_phone, address, sort_order, status } = req.body;
  db.run('UPDATE departments SET name = ?, region_code = ?, parent_id = ?, description = ?, contact_info = ?, contact_person = ?, contact_phone = ?, address = ?, sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, region_code, parent_id, description, contact_info, contact_person, contact_phone, address, sort_order, status, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '更新成功' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除部门', '部门管理', 'department'), (req, res) => {
  db.run('UPDATE departments SET status = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
