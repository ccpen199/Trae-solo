const express = require('express');
const db = require('../database');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireRoles('admin'), (req, res) => {
  const { actor_id, action, entity_type, start_time, end_time, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT al.*,
           u.username as actor_name
    FROM audit_logs al
    LEFT JOIN users u ON al.actor_id = u.id
  `;

  const conditions = [];
  const params = [];

  if (actor_id) {
    conditions.push('al.actor_id = ?');
    params.push(actor_id);
  }

  if (action) {
    conditions.push('al.action = ?');
    params.push(action);
  }

  if (entity_type) {
    conditions.push('al.entity_type = ?');
    params.push(entity_type);
  }

  if (start_time) {
    conditions.push('al.created_at >= ?');
    params.push(Math.floor(new Date(start_time).getTime() / 1000));
  }

  if (end_time) {
    conditions.push('al.created_at <= ?');
    params.push(Math.floor(new Date(end_time).getTime() / 1000));
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const logs = db.prepare(query).all(...params);

  let countQuery = 'SELECT COUNT(*) as total FROM audit_logs al';
  if (conditions.length > 0) {
    countQuery += ' WHERE ' + conditions.join(' AND ');
  }

  const countResult = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({
    data: logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: countResult.total
    }
  });
});

router.get('/stats', authenticateToken, requireRoles('admin'), (req, res) => {
  const { start_time, end_time } = req.query;

  let timeCondition = '';
  const params = [];

  if (start_time) {
    timeCondition += ' AND created_at >= ?';
    params.push(Math.floor(new Date(start_time).getTime() / 1000));
  }

  if (end_time) {
    timeCondition += ' AND created_at <= ?';
    params.push(Math.floor(new Date(end_time).getTime() / 1000));
  }

  const byAction = db.prepare(`
    SELECT action, COUNT(*) as count 
    FROM audit_logs 
    WHERE 1=1 ${timeCondition}
    GROUP BY action
    ORDER BY count DESC
  `).all(...params);

  const byEntityType = db.prepare(`
    SELECT entity_type, COUNT(*) as count 
    FROM audit_logs 
    WHERE 1=1 ${timeCondition}
    GROUP BY entity_type
    ORDER BY count DESC
  `).all(...params);

  const byUser = db.prepare(`
    SELECT u.username, u.role, COUNT(al.id) as action_count
    FROM audit_logs al
    LEFT JOIN users u ON al.actor_id = u.id
    WHERE 1=1 ${timeCondition}
    GROUP BY u.id, u.username, u.role
    ORDER BY action_count DESC
    LIMIT 20
  `).all(...params);

  res.json({
    by_action: byAction,
    by_entity_type: byEntityType,
    by_user: byUser
  });
});

router.get('/:id', authenticateToken, requireRoles('admin'), (req, res) => {
  const log = db.prepare(`
    SELECT al.*,
           u.username as actor_name
    FROM audit_logs al
    LEFT JOIN users u ON al.actor_id = u.id
    WHERE al.id = ?
  `).get(req.params.id);

  if (!log) {
    return res.status(404).json({ error: '审计日志不存在' });
  }

  try {
    log.details = JSON.parse(log.details);
  } catch (e) {
    // 保持原样
  }

  res.json(log);
});

module.exports = router;
