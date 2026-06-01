const express = require('express');
const db = require('../utils/db');
const { authenticateToken, requireAdmin, logOperation } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get('/stats', (req, res) => {
  const stats = {
    total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    active_users: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count,
    total_goals: db.prepare('SELECT COUNT(*) as count FROM goals').get().count,
    total_krs: db.prepare('SELECT COUNT(*) as count FROM key_results').get().count,
    total_execution_records: db.prepare('SELECT COUNT(*) as count FROM execution_records').get().count,
    total_deviations: db.prepare('SELECT COUNT(*) as count FROM deviation_analyses').get().count,
    total_reviews: db.prepare('SELECT COUNT(*) as count FROM annual_reviews').get().count,
    total_operations: db.prepare('SELECT COUNT(*) as count FROM operation_logs').get().count
  };
  
  res.json(stats);
});

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.*,
           (SELECT COUNT(*) FROM goals g WHERE g.user_id = u.id) as goal_count,
           (SELECT MAX(created_at) FROM operation_logs ol WHERE ol.user_id = u.id AND ol.action = 'login') as last_login
    FROM users u
    ORDER BY u.created_at DESC
  `).all();
  
  res.json(users);
});

router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, display_name, role, is_active } = req.body;
  
  const existing = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  
  if (!existing) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE users SET
      username = COALESCE(?, username),
      email = COALESCE(?, email),
      display_name = COALESCE(?, display_name),
      role = COALESCE(?, role),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(username, email, display_name, role, is_active, id);
  
  logOperation(req, 'admin_update_user', 'user', id, { username, role, is_active });
  
  res.json({ id, message: '用户更新成功' });
});

router.get('/operation-logs', (req, res) => {
  const { user_id, action, page = 1, page_size = 50 } = req.query;
  
  let sql = `
    SELECT ol.*, u.username, u.display_name
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND ol.user_id = ?';
    params.push(user_id);
  }
  
  if (action) {
    sql += ' AND ol.action = ?';
    params.push(action);
  }
  
  const countSql = sql.replace('SELECT ol.*, u.username, u.display_name', 'SELECT COUNT(*) as count');
  const total = db.prepare(countSql).get(...params).count;
  
  sql += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  
  const logs = db.prepare(sql).all(...params);
  
  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      page_size: parseInt(page_size),
      total,
      total_pages: Math.ceil(total / parseInt(page_size))
    }
  });
});

router.get('/operations', (req, res) => {
  const actions = db.prepare(`
    SELECT DISTINCT action FROM operation_logs ORDER BY action
  `).all().map(a => a.action);
  
  res.json({ actions });
});

router.get('/system-info', (req, res) => {
  const dbStats = db.prepare('SELECT * FROM sqlite_master WHERE type = "table"').all();
  
  res.json({
    version: '1.0.0',
    database: 'SQLite',
    database_path: require('path').join(__dirname, '../../../data/app.sqlite'),
    tables: dbStats.map(t => t.name),
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    env: process.env.NODE_ENV
  });
});

router.post('/maintenance/cleanup', (req, res) => {
  const { days = 365 } = req.body;
  
  const cutoffDate = require('dayjs')().subtract(days, 'day').format('YYYY-MM-DD');
  
  const deletedLogs = db.prepare(`
    DELETE FROM operation_logs WHERE created_at < ?
  `).run(cutoffDate);
  
  logOperation(req, 'admin_cleanup_logs', 'maintenance', null, { days, deleted_count: deletedLogs.changes });
  
  res.json({
    message: '清理完成',
    deleted_logs: deletedLogs.changes
  });
});

module.exports = router;
