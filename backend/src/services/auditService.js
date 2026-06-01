const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const createAuditLog = async (userId, action, resourceType, resourceId, oldValue, newValue, ipAddress, userAgent) => {
  const auditId = 'AUD-' + uuidv4().slice(0, 8).toUpperCase();
  await db.run(
    'INSERT INTO audit_logs (audit_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [auditId, userId, action, resourceType, resourceId, oldValue ? JSON.stringify(oldValue) : null, newValue ? JSON.stringify(newValue) : null, ipAddress, userAgent]
  );
};

const createAlert = async (alertType, severity, title, message, appId, taskId, callLogId) => {
  const alertId = 'ALT-' + uuidv4().slice(0, 8).toUpperCase();
  await db.run(
    'INSERT INTO alerts (alert_id, alert_type, severity, title, message, app_id, task_id, call_log_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [alertId, alertType, severity, title, message, appId, taskId, callLogId]
  );
};

module.exports = {
  createAuditLog,
  createAlert
};
