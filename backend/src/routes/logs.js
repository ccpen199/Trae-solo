const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { type = '', action = '', operator = '', domain_id = '', cert_id = '', page = 1, pageSize = 50 } = req.query;
  
  let query = `
    SELECT l.*, d.full_domain, c.common_name
    FROM change_logs l
    LEFT JOIN domains d ON l.domain_id = d.id
    LEFT JOIN certificates c ON l.cert_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (type) {
    query += ` AND l.change_type = ?`;
    params.push(type);
  }

  if (action) {
    query += ` AND l.action LIKE ?`;
    params.push(`%${action}%`);
  }

  if (operator) {
    query += ` AND l.operator LIKE ?`;
    params.push(`%${operator}%`);
  }

  if (domain_id) {
    query += ` AND l.domain_id = ?`;
    params.push(domain_id);
  }

  if (cert_id) {
    query += ` AND l.cert_id = ?`;
    params.push(cert_id);
  }

  query += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const logs = db.prepare(query).all(...params);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM change_logs l
    WHERE 1=1
    ${type ? 'AND l.change_type = ?' : ''}
    ${action ? 'AND l.action LIKE ?' : ''}
    ${operator ? 'AND l.operator LIKE ?' : ''}
  `;
  const countParams = [];
  if (type) countParams.push(type);
  if (action) countParams.push(`%${action}%`);
  if (operator) countParams.push(`%${operator}%`);

  const { total } = db.prepare(countQuery).get(...countParams);

  res.json({ logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', (req, res) => {
  const log = db.prepare(`
    SELECT l.*, d.full_domain, c.common_name, t.id as task_id
    FROM change_logs l
    LEFT JOIN domains d ON l.domain_id = d.id
    LEFT JOIN certificates c ON l.cert_id = c.id
    LEFT JOIN renewal_tasks t ON l.task_id = t.id
    WHERE l.id = ?
  `).get(req.params.id);
  
  if (!log) {
    return res.status(404).json({ error: '记录不存在' });
  }

  res.json({ log });
});

router.post('/', (req, res) => {
  const { domain_id, cert_id, task_id, change_type, action, description, old_value, new_value, screenshot_path, rollback_action, status, failure_reason } = req.body;

  if (!change_type || !action) {
    return res.status(400).json({ error: '变更类型和操作不能为空' });
  }

  const stmt = db.prepare(`
    INSERT INTO change_logs (domain_id, cert_id, task_id, change_type, action, description, old_value, new_value, operator, screenshot_path, rollback_action, status, failure_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    domain_id || null,
    cert_id || null,
    task_id || null,
    change_type,
    action,
    description || null,
    old_value || null,
    new_value || null,
    req.user.username,
    screenshot_path || null,
    rollback_action || null,
    status || 'success',
    failure_reason || null
  );

  const log = db.prepare('SELECT * FROM change_logs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ log });
});

router.get('/stats/summary', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = db.prepare(`
    SELECT 
      change_type,
      COUNT(*) as count
    FROM change_logs
    WHERE DATE(created_at) = DATE('now')
    GROUP BY change_type
  `).all();

  const recentActivity = db.prepare(`
    SELECT l.*, d.full_domain, c.common_name
    FROM change_logs l
    LEFT JOIN domains d ON l.domain_id = d.id
    LEFT JOIN certificates c ON l.cert_id = c.id
    ORDER BY l.created_at DESC
    LIMIT 10
  `).all();

  res.json({ stats, recentActivity });
});

module.exports = router;
