const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const validator = require('../utils/validator');
const { permissionMiddleware, auditMiddleware } = require('../middleware/auth');

router.get('/', (req, res) => {
  const { app_id, env_id, status, search } = req.query;
  let query = `
    SELECT wc.*, a.name as app_name, e.name as env_name, e.type as env_type
    FROM webhook_configs wc
    JOIN applications a ON wc.app_id = a.id
    JOIN environments e ON wc.env_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) {
    query += ' AND wc.app_id = ?';
    params.push(app_id);
  }
  if (env_id) {
    query += ' AND wc.env_id = ?';
    params.push(env_id);
  }
  if (status) {
    query += ' AND wc.status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (wc.name LIKE ? OR wc.url LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ' ORDER BY wc.created_at DESC';
  const configs = db.prepare(query).all(...params);
  
  const maskedConfigs = configs.map(c => validator.maskSensitiveData(c));
  res.json(maskedConfigs);
});

router.get('/:id', (req, res) => {
  const config = db.prepare(`
    SELECT wc.*, a.name as app_name, e.name as env_name, e.type as env_type
    FROM webhook_configs wc
    JOIN applications a ON wc.app_id = a.id
    JOIN environments e ON wc.env_id = e.id
    WHERE wc.id = ?
  `).get(req.params.id);
  
  if (!config) {
    return res.status(404).json({ error: '配置不存在' });
  }

  const pendingChanges = db.prepare(
    'SELECT * FROM change_orders WHERE config_id = ? AND status = ? ORDER BY created_at DESC'
  ).all(req.params.id, 'pending');

  const history = db.prepare(
    'SELECT * FROM change_orders WHERE config_id = ? ORDER BY created_at DESC LIMIT 10'
  ).all(req.params.id);

  res.json({
    ...validator.maskSensitiveData(config),
    pendingChanges,
    changeHistory: history
  });
});

router.post('/', permissionMiddleware(['admin', 'devops', 'owner']), auditMiddleware('create', 'config'), (req, res) => {
  const { app_id, env_id, name, url, method, headers, secret_key, timeout, retry_count } = req.body;
  const userId = req.user.id;

  if (!app_id || !env_id || !name || !url) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const id = `config-${Date.now()}`;
  db.prepare(`
    INSERT INTO webhook_configs (
      id, app_id, env_id, name, version, url, method, headers,
      secret_key, timeout, retry_count, status, created_by
    ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(
    id, app_id, env_id, name, url, method || 'POST',
    headers ? JSON.stringify(headers) : JSON.stringify({ 'Content-Type': 'application/json' }),
    secret_key || '', timeout || 30000, retry_count || 3, userId
  );

  const config = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(id);
  res.status(201).json(validator.maskSensitiveData(config));
});

router.post('/:id/change', permissionMiddleware(['admin', 'devops', 'owner']), auditMiddleware('request_change', 'config'), (req, res) => {
  const { change_type, new_value, reason } = req.body;
  const configId = req.params.id;
  const userId = req.user.id;

  const validation = validator.validateConfigChange(configId, userId, change_type, new_value);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const config = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(configId);
  const oldValue = config[change_type];

  const changeId = `change-${Date.now()}`;
  db.prepare(`
    INSERT INTO change_orders (
      id, config_id, change_type, old_value, new_value, reason, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(changeId, configId, change_type, String(oldValue), String(new_value), reason, userId);

  const change = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(changeId);
  res.status(201).json(change);
});

router.post('/change/:changeId/approve', permissionMiddleware(['admin', 'devops']), auditMiddleware('approve_change', 'change_order'), (req, res) => {
  const changeId = req.params.changeId;
  const userId = req.user.id;

  const change = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(changeId);
  if (!change) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  if (change.status !== 'pending') {
    return res.status(400).json({ error: '变更单状态不正确' });
  }

  const config = db.prepare('SELECT * FROM webhook_configs WHERE id = ?').get(change.config_id);
  
  db.prepare(`
    UPDATE webhook_configs 
    SET ${change.change_type} = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(change.new_value, change.config_id);

  db.prepare(`
    UPDATE change_orders 
    SET status = 'approved', approver = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(userId, changeId);

  res.json({ success: true, message: '变更已批准并生效' });
});

router.post('/change/:changeId/reject', permissionMiddleware(['admin', 'devops']), auditMiddleware('reject_change', 'change_order'), (req, res) => {
  const changeId = req.params.changeId;
  const userId = req.user.id;

  const change = db.prepare('SELECT * FROM change_orders WHERE id = ?').get(changeId);
  if (!change) {
    return res.status(404).json({ error: '变更单不存在' });
  }

  db.prepare(`
    UPDATE change_orders 
    SET status = 'rejected', approver = ?, approved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(userId, changeId);

  res.json({ success: true, message: '变更已拒绝' });
});

module.exports = router;
