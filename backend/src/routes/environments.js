const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { db } = require('../models/database');
const { authMiddleware, createAuditLog } = require('../middleware/auth');
const { createAlert, getResponsibleUserId } = require('../utils/alert');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { app_id, type, status } = req.query;
  let query = `
    SELECT e.*, a.name as app_name, u.name as creator_name
    FROM environments e
    LEFT JOIN applications a ON e.app_id = a.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) { query += ' AND e.app_id = ?'; params.push(app_id); }
  if (type) { query += ' AND e.type = ?'; params.push(type); }
  if (status) { query += ' AND e.status = ?'; params.push(status); }

  query += ' ORDER BY e.created_at DESC';

  const envs = db.prepare(query).all(...params);
  res.json({ data: envs });
});

router.post('/', (req, res) => {
  const { app_id, name, type, base_url, status = 'active' } = req.body;

  const validationErrors = [];
  if (!app_id) validationErrors.push('必须关联应用');
  if (!name) validationErrors.push('环境名称不能为空');
  if (!type) validationErrors.push('环境类型不能为空');
  if (!base_url) validationErrors.push('基础URL不能为空');

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: '字段校验失败', details: validationErrors });
  }

  const envId = uuidv4();
  const result = db.prepare(`
    INSERT INTO environments (env_id, app_id, name, type, base_url, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(envId, app_id, name, type, base_url, status, req.user.id);

  createAuditLog(req.user.id, 'create', 'environment', envId, null, JSON.stringify(req.body), '创建新环境');

  const env = db.prepare('SELECT * FROM environments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(env);
});

router.put('/:id', (req, res) => {
  const env = db.prepare('SELECT * FROM environments WHERE id = ?').get(req.params.id);
  if (!env) {
    return res.status(404).json({ error: '环境不存在' });
  }

  const oldValue = JSON.stringify(env);
  const { name, base_url, status } = req.body;
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (base_url !== undefined) { updates.push('base_url = ?'); params.push(base_url); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    db.prepare(`UPDATE environments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    createAuditLog(req.user.id, 'update', 'environment', env.env_id, oldValue, JSON.stringify(req.body), '更新环境配置');
  }

  const updatedEnv = db.prepare('SELECT * FROM environments WHERE id = ?').get(req.params.id);
  res.json(updatedEnv);
});

router.get('/:id/keys', (req, res) => {
  const keys = db.prepare(`
    SELECT k.*, u.name as creator_name
    FROM api_keys k
    LEFT JOIN users u ON k.created_by = u.id
    WHERE k.env_id = ?
    ORDER BY k.created_at DESC
  `).all(req.params.id);

  keys.forEach(k => {
    delete k.key_value;
  });

  res.json({ data: keys });
});

router.post('/:id/keys', (req, res) => {
  const { name, permissions, expires_at } = req.body;
  const env = db.prepare('SELECT * FROM environments WHERE id = ?').get(req.params.id);

  if (!env) {
    return res.status(404).json({ error: '环境不存在' });
  }

  if (!name) {
    return res.status(400).json({ error: '密钥名称不能为空' });
  }

  const keyValue = 'sk_' + crypto.randomBytes(32).toString('hex');
  const keyId = uuidv4();

  const result = db.prepare(`
    INSERT INTO api_keys (key_id, app_id, env_id, key_value, name, permissions, expires_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(keyId, env.app_id, env.id, keyValue, name, JSON.stringify(permissions || []), expires_at, req.user.id);

  createAuditLog(req.user.id, 'create', 'api_key', keyId, null, JSON.stringify({ name, env_id: env.id }), '创建API密钥');

  const key = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(key);
});

router.post('/:envId/keys/:keyId/revoke', (req, res) => {
  const key = db.prepare('SELECT * FROM api_keys WHERE id = ? AND env_id = ?').get(req.params.keyId, req.params.envId);
  if (!key) {
    return res.status(404).json({ error: '密钥不存在' });
  }

  const oldValue = JSON.stringify(key);
  db.prepare('UPDATE api_keys SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('revoked', req.params.keyId);

  createAuditLog(req.user.id, 'revoke', 'api_key', key.key_id, oldValue, JSON.stringify({ status: 'revoked' }), '吊销API密钥');

  createAlert('config_misuse', 'medium', 'API密钥已吊销', `密钥 ${key.name} 已被吊销`, {
    app_id: key.app_id,
    responsible_user_id: getResponsibleUserId(key.app_id),
    suggested_action: '请更新使用此密钥的服务配置'
  });

  res.json({ message: '密钥已吊销' });
});

module.exports = router;
