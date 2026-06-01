const { db } = require('../models/database');

const getCallLogs = (req, res) => {
  const { appId, taskId, status, operationType, startDate, endDate, errorCode } = req.query;

  let query = `
    SELECT l.*, a.app_name, e.env_name, u.real_name as creator_name
    FROM call_logs l
    LEFT JOIN applications a ON l.app_id = a.id
    LEFT JOIN environments e ON l.env_id = e.id
    LEFT JOIN users u ON l.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (appId) {
    query += ' AND l.app_id = ?';
    params.push(appId);
  }

  if (taskId) {
    query += ' AND l.task_id = ?';
    params.push(taskId);
  }

  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }

  if (operationType) {
    query += ' AND l.operation_type = ?';
    params.push(operationType);
  }

  if (errorCode) {
    query += ' AND l.error_code = ?';
    params.push(errorCode);
  }

  if (startDate) {
    query += ' AND l.created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND l.created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY l.created_at DESC LIMIT 200';

  const logs = db.prepare(query).all(...params);

  res.json({ logs });
};

const getCallLogById = (req, res) => {
  const log = db.prepare(`
    SELECT l.*, a.app_name, e.env_name, u.real_name as creator_name
    FROM call_logs l
    LEFT JOIN applications a ON l.app_id = a.id
    LEFT JOIN environments e ON l.env_id = e.id
    LEFT JOIN users u ON l.created_by = u.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!log) {
    return res.status(404).json({ error: '日志不存在' });
  }

  res.json({ log });
};

const getAuditLogs = (req, res) => {
  const { userId, action, resourceType, status, startDate, endDate } = req.query;

  let query = `
    SELECT a.*, u.username, u.real_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (userId) {
    query += ' AND a.user_id = ?';
    params.push(userId);
  }

  if (action) {
    query += ' AND a.action LIKE ?';
    params.push(`%${action}%`);
  }

  if (resourceType) {
    query += ' AND a.resource_type = ?';
    params.push(resourceType);
  }

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  if (startDate) {
    query += ' AND a.created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND a.created_at <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY a.created_at DESC LIMIT 200';

  const logs = db.prepare(query).all(...params);

  res.json({ auditLogs: logs });
};

module.exports = {
  getCallLogs,
  getCallLogById,
  getAuditLogs
};
