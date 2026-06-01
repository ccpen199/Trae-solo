const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/logs', (req, res) => {
  const { user_id, action, resource_type, start_date, end_date, page = 1, pageSize = 50 } = req.query;
  
  let query = `
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (user_id) {
    query += ' AND al.user_id = ?';
    params.push(user_id);
  }
  if (action) {
    query += ' AND al.action = ?';
    params.push(action);
  }
  if (resource_type) {
    query += ' AND al.resource_type = ?';
    params.push(resource_type);
  }
  if (start_date) {
    query += ' AND al.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND al.created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const logs = db.prepare(query).all(...params);
  
  const { total } = db.prepare('SELECT COUNT(*) as total FROM audit_logs WHERE 1=1').get();

  res.json({ list: logs, total });
});

router.get('/stats', requireRoles(['admin', 'security']), (req, res) => {
  const stats = {};

  stats.applications = db.prepare(`
    SELECT status, COUNT(*) as count FROM applications GROUP BY status
  `).all();

  stats.change_orders = db.prepare(`
    SELECT status, COUNT(*) as count FROM change_orders GROUP BY status
  `).all();

  stats.tasks = db.prepare(`
    SELECT status, COUNT(*) as count FROM execution_tasks GROUP BY status
  `).all();

  stats.users = db.prepare('SELECT COUNT(*) as total FROM users').get();

  stats.exceptions = db.prepare(`
    SELECT status, COUNT(*) as count FROM exception_records GROUP BY status
  `).all();

  const today = new Date().toISOString().split('T')[0];
  stats.today_approvals = db.prepare(`
    SELECT COUNT(*) as count FROM approval_records 
    WHERE DATE(created_at) = ? AND action = 'approve'
  `).get(today);

  stats.today_executions = db.prepare(`
    SELECT COUNT(*) as count FROM execution_tasks 
    WHERE DATE(created_at) = ?
  `).get(today);

  res.json(stats);
});

router.get('/reports/overview', requireRoles(['admin', 'security']), (req, res) => {
  const { start_date, end_date } = req.query;

  const data = {};

  data.approvals_by_user = db.prepare(`
    SELECT u.name, COUNT(*) as count, ar.action
    FROM approval_records ar
    LEFT JOIN users u ON ar.approver_id = u.id
    WHERE 1=1
    ${start_date ? 'AND DATE(ar.created_at) >= ?' : ''}
    ${end_date ? 'AND DATE(ar.created_at) <= ?' : ''}
    GROUP BY ar.approver_id, ar.action
    ORDER BY count DESC
  `).all(...(start_date ? [start_date] : []), ...(end_date ? [end_date] : []));

  data.tasks_by_status = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM execution_tasks
    WHERE 1=1
    ${start_date ? 'AND DATE(created_at) >= ?' : ''}
    ${end_date ? 'AND DATE(created_at) <= ?' : ''}
    GROUP BY status
  `).all(...(start_date ? [start_date] : []), ...(end_date ? [end_date] : []));

  data.changes_by_type = db.prepare(`
    SELECT change_type, COUNT(*) as count
    FROM change_orders
    WHERE 1=1
    ${start_date ? 'AND DATE(created_at) >= ?' : ''}
    ${end_date ? 'AND DATE(created_at) <= ?' : ''}
    GROUP BY change_type
  `).all(...(start_date ? [start_date] : []), ...(end_date ? [end_date] : []));

  data.daily_activity = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      SUM(CASE WHEN resource_type = 'change_order' THEN 1 ELSE 0 END) as change_orders,
      SUM(CASE WHEN resource_type = 'execution_task' THEN 1 ELSE 0 END) as tasks,
      COUNT(*) as total
    FROM audit_logs
    WHERE 1=1
    ${start_date ? 'AND DATE(created_at) >= ?' : ''}
    ${end_date ? 'AND DATE(created_at) <= ?' : ''}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `).all(...(start_date ? [start_date] : []), ...(end_date ? [end_date] : []));

  res.json(data);
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, email, created_at FROM users').all();
  res.json(users);
});

module.exports = router;
