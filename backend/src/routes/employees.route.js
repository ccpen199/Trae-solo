const express = require('express');
const { getDb } = require('../database/init');

const router = express.Router();
const db = getDb();

router.get('/', (req, res) => {
  try {
    const { departmentId, limit = 100, offset = 0 } = req.query;

    let sql = `
      SELECT e.*, r.code as role_code, r.name as role_name, d.name as department_name
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.status = 1
    `;
    const params = [];

    if (departmentId) {
      sql += ' AND e.department_id = ?';
      params.push(departmentId);
    }

    sql += ' ORDER BY e.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const rows = db.prepare(sql).all(...params);

    res.json({
      success: true,
      data: rows.map(row => ({
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        phone: row.phone,
        avatar: row.avatar,
        roleId: row.role_id,
        roleCode: row.role_code,
        roleName: row.role_name,
        departmentId: row.department_id,
        departmentName: row.department_name,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const row = db.prepare(`
      SELECT e.*, r.code as role_code, r.name as role_name, d.name as department_name
      FROM employees e
      LEFT JOIN roles r ON e.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = ?
    `).get(id);

    if (!row) {
      return res.status(404).json({ success: false, message: '员工不存在' });
    }

    res.json({
      success: true,
      data: {
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        phone: row.phone,
        avatar: row.avatar,
        roleId: row.role_id,
        roleCode: row.role_code,
        roleName: row.role_name,
        departmentId: row.department_id,
        departmentName: row.department_name,
        status: row.status,
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
