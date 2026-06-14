const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

function parseJsonField(field) {
  try {
    return field ? JSON.parse(field) : null;
  } catch (e) {
    return field;
  }
}

function formatServiceItem(item) {
  if (!item) return item;
  return {
    ...item,
    acceptance_conditions: parseJsonField(item.acceptance_conditions),
    handling_materials: parseJsonField(item.handling_materials),
    handling_process: parseJsonField(item.handling_process),
    handling_time_limit: parseJsonField(item.handling_time_limit),
    charging_standards: parseJsonField(item.charging_standards),
    faq: parseJsonField(item.faq)
  };
}

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, keyword, region_code, region_level, department_id, service_type, item_type, is_hot, is_online } = req.query;
  const offset = (page - 1) * pageSize;

  let sql = 'SELECT s.*, d.name as department_name, r.name as region_name FROM service_items s LEFT JOIN departments d ON s.department_id = d.id LEFT JOIN regions r ON s.region_code = r.code WHERE s.status = 1';
  let countSql = 'SELECT COUNT(*) as total FROM service_items WHERE status = 1';
  let params = [];
  let countParams = [];

  if (keyword) {
    sql += ' AND (s.item_name LIKE ? OR s.item_code LIKE ?)';
    countSql += ' AND (item_name LIKE ? OR item_code LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw);
    countParams.push(kw, kw);
  }
  if (region_code) {
    sql += ' AND s.region_code = ?';
    countSql += ' AND region_code = ?';
    params.push(region_code);
    countParams.push(region_code);
  }
  if (region_level) {
    sql += ' AND s.region_level = ?';
    countSql += ' AND region_level = ?';
    params.push(region_level);
    countParams.push(region_level);
  }
  if (department_id) {
    sql += ' AND s.department_id = ?';
    countSql += ' AND department_id = ?';
    params.push(department_id);
    countParams.push(department_id);
  }
  if (service_type) {
    sql += ' AND s.service_type = ?';
    countSql += ' AND service_type = ?';
    params.push(service_type);
    countParams.push(service_type);
  }
  if (item_type) {
    sql += ' AND s.item_type = ?';
    countSql += ' AND item_type = ?';
    params.push(item_type);
    countParams.push(item_type);
  }
  if (is_hot) {
    sql += ' AND s.is_hot = ?';
    countSql += ' AND is_hot = ?';
    params.push(is_hot);
    countParams.push(is_hot);
  }
  if (is_online) {
    sql += ' AND s.is_online = ?';
    countSql += ' AND is_online = ?';
    params.push(is_online);
    countParams.push(is_online);
  }

  sql += ' ORDER BY s.is_hot DESC, s.sort_order ASC, s.id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, parseInt(pageSize), offset];

  db.get(countSql, countParams, (err, countRow) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    db.all(sql, queryParams, (err, rows) => {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      if (keyword && rows.length === 0) {
        const fallbackSql = 'SELECT s.*, d.name as department_name, r.name as region_name FROM service_items s LEFT JOIN departments d ON s.department_id = d.id LEFT JOIN regions r ON s.region_code = r.code WHERE s.status = 1 ORDER BY s.is_hot DESC, s.sort_order ASC, s.id DESC LIMIT ? OFFSET ?';
        db.get('SELECT COUNT(*) as total FROM service_items WHERE status = 1', [], (err, fallbackCount) => {
          if (err) return res.status(500).json({ code: 500, message: err.message });
          db.all(fallbackSql, [parseInt(pageSize), offset], (err, fallbackRows) => {
            if (err) return res.status(500).json({ code: 500, message: err.message });
            res.json({
              code: 200,
              data: {
                list: fallbackRows.map(formatServiceItem),
                total: fallbackCount.total,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                fallbackKeyword: keyword
              }
            });
          });
        });
        return;
      }
      res.json({
        code: 200,
        data: {
          list: rows.map(formatServiceItem),
          total: countRow.total,
          page: parseInt(page),
          pageSize: parseInt(pageSize)
        }
      });
    });
  });
});

router.get('/hot', (req, res) => {
  db.all('SELECT s.*, d.name as department_name, r.name as region_name FROM service_items s LEFT JOIN departments d ON s.department_id = d.id LEFT JOIN regions r ON s.region_code = r.code WHERE s.status = 1 AND s.is_hot = 1 ORDER BY s.sort_order ASC, s.id DESC LIMIT 10',
    (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows.map(formatServiceItem) });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT s.*, d.name as department_name, d.code as department_code, r.name as region_name FROM service_items s LEFT JOIN departments d ON s.department_id = d.id LEFT JOIN regions r ON s.region_code = r.code WHERE s.id = ?',
    [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '事项不存在' });
    res.json({ code: 200, data: formatServiceItem(row) });
  });
});

router.get('/code/:code', (req, res) => {
  db.get('SELECT s.*, d.name as department_name, r.name as region_name FROM service_items s LEFT JOIN departments d ON s.department_id = d.id LEFT JOIN regions r ON s.region_code = r.code WHERE s.item_code = ?',
    [req.params.code], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '事项不存在' });
    res.json({ code: 200, data: formatServiceItem(row) });
  });
});

router.post('/', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin', 'staff']), auditLog('创建服务事项', '服务事项', 'service_item'), (req, res) => {
  const {
    item_code, item_name, item_type, service_type, department_id, region_code, region_level,
    legal_basis, handling_object, acceptance_conditions, handling_materials, handling_process,
    handling_time_limit, charging_standards, consulting_phone, complaint_phone, handling_location,
    online_handling_url, work_time, faq, is_online, is_hot, sort_order, access_mode
  } = req.body;

  if (!item_code || !item_name || !department_id || !region_code || !region_level) {
    return res.status(400).json({ code: 400, message: '必填项不能为空' });
  }

  const now = new Date().toISOString();
  db.run(`INSERT INTO service_items (
    item_code, item_name, item_type, service_type, department_id, region_code, region_level,
    legal_basis, handling_object, acceptance_conditions, handling_materials, handling_process,
    handling_time_limit, charging_standards, consulting_phone, complaint_phone, handling_location,
    online_handling_url, work_time, faq, is_online, is_hot, sort_order, access_mode, publish_time, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item_code, item_name, item_type, service_type, department_id, region_code, region_level,
      legal_basis, handling_object,
      JSON.stringify(acceptance_conditions),
      JSON.stringify(handling_materials),
      JSON.stringify(handling_process),
      JSON.stringify(handling_time_limit),
      JSON.stringify(charging_standards),
      consulting_phone, complaint_phone, handling_location, online_handling_url, work_time,
      JSON.stringify(faq), is_online || 0, is_hot || 0, sort_order || 0, access_mode || 'api', now, req.user.id
    ],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.put('/:id', authenticateToken, requireRole(['super_admin', 'province_admin', 'city_admin', 'county_admin', 'staff']), auditLog('更新服务事项', '服务事项', 'service_item'), (req, res) => {
  const {
    item_name, item_type, service_type, department_id, region_code, region_level,
    legal_basis, handling_object, acceptance_conditions, handling_materials, handling_process,
    handling_time_limit, charging_standards, consulting_phone, complaint_phone, handling_location,
    online_handling_url, work_time, faq, is_online, is_hot, sort_order, access_mode, status
  } = req.body;

  db.run(`UPDATE service_items SET
    item_name = ?, item_type = ?, service_type = ?, department_id = ?, region_code = ?, region_level = ?,
    legal_basis = ?, handling_object = ?, acceptance_conditions = ?, handling_materials = ?, handling_process = ?,
    handling_time_limit = ?, charging_standards = ?, consulting_phone = ?, complaint_phone = ?, handling_location = ?,
    online_handling_url = ?, work_time = ?, faq = ?, is_online = ?, is_hot = ?, sort_order = ?, access_mode = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
    [
      item_name, item_type, service_type, department_id, region_code, region_level,
      legal_basis, handling_object,
      JSON.stringify(acceptance_conditions),
      JSON.stringify(handling_materials),
      JSON.stringify(handling_process),
      JSON.stringify(handling_time_limit),
      JSON.stringify(charging_standards),
      consulting_phone, complaint_phone, handling_location, online_handling_url, work_time,
      JSON.stringify(faq), is_online, is_hot, sort_order, access_mode, status, req.params.id
    ],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '更新成功' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('删除服务事项', '服务事项', 'service_item'), (req, res) => {
  db.run('UPDATE service_items SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
