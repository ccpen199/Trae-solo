const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRole(['super_admin', 'province_admin']), (req, res) => {
  const { page = 1, pageSize = 20, module, operation, username, start_date, end_date } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM audit_logs WHERE 1=1';
  let params = [];
  let countParams = [];

  if (module) {
    sql += ' AND module = ?';
    countSql += ' AND module = ?';
    params.push(module);
    countParams.push(module);
  }
  if (operation) {
    sql += ' AND operation = ?';
    countSql += ' AND operation = ?';
    params.push(operation);
    countParams.push(operation);
  }
  if (username) {
    sql += ' AND username LIKE ?';
    countSql += ' AND username LIKE ?';
    const kw = `%${username}%`;
    params.push(kw);
    countParams.push(kw);
  }
  if (start_date) {
    sql += ' AND DATE(created_at) >= DATE(?)';
    countSql += ' AND DATE(created_at) >= DATE(?)';
    params.push(start_date);
    countParams.push(start_date);
  }
  if (end_date) {
    sql += ' AND DATE(created_at) <= DATE(?)';
    countSql += ' AND DATE(created_at) <= DATE(?)';
    params.push(end_date);
    countParams.push(end_date);
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

router.get('/operation', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin']), (req, res) => {
  const { page = 1, pageSize = 20, application_id, operator_id } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT ol.*, a.application_no, s.item_name FROM operation_logs ol LEFT JOIN applications a ON ol.application_id = a.id LEFT JOIN service_items s ON a.service_item_id = s.id WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM operation_logs WHERE 1=1';
  let params = [];
  let countParams = [];

  if (application_id) {
    sql += ' AND ol.application_id = ?';
    countSql += ' AND application_id = ?';
    params.push(application_id);
    countParams.push(application_id);
  }
  if (operator_id) {
    sql += ' AND ol.operator_id = ?';
    countSql += ' AND operator_id = ?';
    params.push(operator_id);
    countParams.push(operator_id);
  }

  sql += ' ORDER BY ol.id DESC LIMIT ? OFFSET ?';
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

router.get('/modules', authenticateToken, requireRole(['super_admin', 'province_admin']), (req, res) => {
  db.all('SELECT DISTINCT module FROM audit_logs WHERE module IS NOT NULL ORDER BY module', [], (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows.map(r => r.module) });
  });
});

router.get('/operations', authenticateToken, requireRole(['super_admin', 'province_admin']), (req, res) => {
  db.all('SELECT DISTINCT operation FROM audit_logs WHERE operation IS NOT NULL ORDER BY operation', [], (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows.map(r => r.operation) });
  });
});

router.get('/:id', authenticateToken, requireRole(['super_admin', 'province_admin']), (req, res) => {
  db.get('SELECT * FROM audit_logs WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '日志不存在' });

    try {
      row.detail = row.detail ? JSON.parse(row.detail) : null;
    } catch (e) {}

    res.json({ code: 200, data: row });
  });
});

module.exports = router;
