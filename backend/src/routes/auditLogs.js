const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { checkPermission } = require('../middleware/auth');

router.get('/', checkPermission('audit:read'), (req, res) => {
  const { user_id, action, resource_type, start_date, end_date, page = 1, page_size = 20 } = req.query;
  
  let query = `
    SELECT a.*, u.real_name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) { query += ' AND a.user_id = ?'; params.push(user_id); }
  if (action) { query += ' AND a.action = ?'; params.push(action); }
  if (resource_type) { query += ' AND a.resource_type = ?'; params.push(resource_type); }
  if (start_date) { query += ' AND a.created_at >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND a.created_at <= ?'; params.push(end_date); }
  
  const total = db.prepare(query.replace('SELECT a.*', 'SELECT COUNT(*) as count')).get(...params).count;
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  
  const logs = db.prepare(query).all(...params);
  
  res.json({ data: logs, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/timeline', checkPermission('audit:read'), (req, res) => {
  const { resource_type, resource_id, limit = 50 } = req.query;
  
  let query = `
    SELECT a.*, u.real_name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (resource_type) { query += ' AND a.resource_type = ?'; params.push(resource_type); }
  if (resource_id) { query += ' AND a.resource_id = ?'; params.push(resource_id); }
  
  query += ' ORDER BY a.created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  const logs = db.prepare(query).all(...params);
  
  const timeline = logs.map(log => ({
    id: log.id,
    time: log.created_at,
    type: log.action,
    user: log.user_name,
    resource: `${log.resource_type}:${log.resource_id}`,
    description: `${log.user_name} ${getActionText(log.action)} ${getResourceText(log.resource_type)}`,
    old_value: log.old_value,
    new_value: log.new_value
  }));
  
  res.json({ data: timeline });
});

function getActionText(action) {
  const map = {
    create: '创建了',
    update: '更新了',
    delete: '删除了',
    approve: '审批了',
    execute: '执行了',
    rotate: '轮换了',
    assign: '分配了',
    close: '关闭了',
    batch_update: '批量更新了'
  };
  return map[action] || action;
}

function getResourceText(type) {
  const map = {
    application: '应用',
    environment: '环境',
    secret: '密钥',
    change_order: '变更单',
    execution_task: '执行任务',
    alert: '告警'
  };
  return map[type] || type;
}

module.exports = router;
