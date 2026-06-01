const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');

const createAlert = (type, severity, title, description, options = {}) => {
  const { app_id = null, task_id = null, order_id = null, responsible_user_id = null, suggested_action = null } = options;
  
  const alertId = uuidv4();
  db.prepare(`
    INSERT INTO alerts (alert_id, type, severity, title, description, app_id, task_id, order_id, responsible_user_id, suggested_action)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(alertId, type, severity, title, description, app_id, task_id, order_id, responsible_user_id, suggested_action);

  return alertId;
};

const getResponsibleUserId = (appId) => {
  const app = db.prepare('SELECT owner_id FROM applications WHERE id = ?').get(appId);
  return app ? app.owner_id : null;
};

module.exports = { createAlert, getResponsibleUserId };
