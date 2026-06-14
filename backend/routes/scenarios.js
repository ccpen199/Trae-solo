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

function formatScenario(s) {
  if (!s) return s;
  return {
    ...s,
    target_users: parseJsonField(s.target_users),
    service_items: parseJsonField(s.service_items)
  };
}

router.get('/', (req, res) => {
  const { is_hot } = req.query;
  let sql = 'SELECT * FROM scenario_services WHERE status = 1';
  let params = [];

  if (is_hot) {
    sql += ' AND is_hot = ?';
    params.push(is_hot);
  }
  sql += ' ORDER BY sort_order ASC, id DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, data: rows.map(formatScenario) });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM scenario_services WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    if (!row) return res.status(404).json({ code: 404, message: '场景服务不存在' });

    const scenario = formatScenario(row);

    if (scenario.service_items && scenario.service_items.length > 0) {
      const placeholders = scenario.service_items.map(() => '?').join(',');
      db.all(`SELECT id, item_code, item_name, service_type, department_id, region_code FROM service_items WHERE id IN (${placeholders}) AND status = 1`,
        scenario.service_items, (err, items) => {
          scenario.items = items || [];
          res.json({ code: 200, data: scenario });
        });
    } else {
      scenario.items = [];
      res.json({ code: 200, data: scenario });
    }
  });
});

router.post('/', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('创建场景服务', '场景服务', 'scenario'), (req, res) => {
  const { scenario_code, scenario_name, description, icon, banner, service_items, target_users, handling_guide, is_hot, sort_order } = req.body;

  if (!scenario_code || !scenario_name) {
    return res.status(400).json({ code: 400, message: '场景编码和名称不能为空' });
  }

  db.run('INSERT INTO scenario_services (scenario_code, scenario_name, description, icon, banner, service_items, target_users, handling_guide, is_hot, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      scenario_code, scenario_name, description, icon, banner,
      JSON.stringify(service_items || []),
      JSON.stringify(target_users || []),
      handling_guide, is_hot || 0, sort_order || 0
    ],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, data: { id: this.lastID }, message: '创建成功' });
    });
});

router.put('/:id', authenticateToken, requireRole(['super_admin', 'province_admin']), auditLog('更新场景服务', '场景服务', 'scenario'), (req, res) => {
  const { scenario_name, description, icon, banner, service_items, target_users, handling_guide, is_hot, sort_order, status } = req.body;

  db.run('UPDATE scenario_services SET scenario_name = ?, description = ?, icon = ?, banner = ?, service_items = ?, target_users = ?, handling_guide = ?, is_hot = ?, sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [
      scenario_name, description, icon, banner,
      JSON.stringify(service_items || []),
      JSON.stringify(target_users || []),
      handling_guide, is_hot, sort_order, status, req.params.id
    ],
    function(err) {
      if (err) return res.status(500).json({ code: 500, message: err.message });
      res.json({ code: 200, message: '更新成功' });
    });
});

router.delete('/:id', authenticateToken, requireRole(['super_admin']), auditLog('删除场景服务', '场景服务', 'scenario'), (req, res) => {
  db.run('UPDATE scenario_services SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ code: 500, message: err.message });
    res.json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
