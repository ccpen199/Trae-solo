const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

function createAuditLog(userId, action, resourceType, resourceId, oldValue, newValue, ipAddress, userAgent) {
  const auditId = uuidv4();
  db.prepare(`
    INSERT INTO audit_logs (audit_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(auditId, userId, action, resourceType, resourceId, 
    typeof oldValue === 'object' ? JSON.stringify(oldValue) : oldValue,
    typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
    ipAddress, userAgent);
}

function createAlert(type, level, title, description, appId, envId, assigneeId, suggestedAction) {
  const alertId = uuidv4();
  db.prepare(`
    INSERT INTO alerts (alert_id, type, level, title, description, app_id, env_id, assignee_id, suggested_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(alertId, type, level, title, description, appId, envId, assigneeId, suggestedAction);
}

function checkSecretExpiry() {
  const expiringSecrets = db.prepare(`
    SELECT s.*, a.name as app_name, e.name as env_name
    FROM secrets s
    JOIN applications a ON s.app_id = a.id
    JOIN environments e ON s.env_id = e.id
    WHERE s.status = 'active' AND s.expires_at IS NOT NULL AND s.expires_at <= datetime('now', '+7 days')
  `).all();
  
  expiringSecrets.forEach(secret => {
    const existingAlert = db.prepare('SELECT * FROM alerts WHERE type = ? AND app_id = ? AND status = ?').get('secret_expiry', secret.app_id, 'open');
    if (!existingAlert) {
      createAlert(
        'secret_expiry',
        'warning',
        `密钥即将过期: ${secret.secret_key}`,
        `应用 ${secret.app_name} 在 ${secret.env_name} 环境的密钥 ${secret.secret_key} 将于 ${secret.expires_at} 过期`,
        secret.app_id,
        secret.env_id,
        null,
        '请联系应用负责人及时更新密钥'
      );
    }
  });
}

module.exports = { createAuditLog, createAlert, checkSecretExpiry };
