const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog, createAlert } = require('../utils/audit');
const { checkPermission } = require('../middleware/auth');

function validateSecret(data) {
  const errors = [];
  if (!data.app_id) errors.push({ field: 'app_id', message: '应用ID不能为空' });
  if (!data.env_id) errors.push({ field: 'env_id', message: '环境ID不能为空' });
  if (!data.secret_type || !['client_secret', 'api_key', 'certificate', 'private_key'].includes(data.secret_type)) {
    errors.push({ field: 'secret_type', message: '密钥类型无效' });
  }
  if (!data.secret_key || data.secret_key.trim().length === 0) {
    errors.push({ field: 'secret_key', message: '密钥名称不能为空' });
  }
  return errors;
}

router.get('/', checkPermission('secret:read'), (req, res) => {
  const { app_id, env_id, secret_type, status } = req.query;
  
  let query = `
    SELECT s.*, a.name as app_name, e.name as env_name, u.real_name as creator_name
    FROM secrets s
    JOIN applications a ON s.app_id = a.id
    JOIN environments e ON s.env_id = e.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (app_id) { query += ' AND s.app_id = ?'; params.push(app_id); }
  if (env_id) { query += ' AND s.env_id = ?'; params.push(env_id); }
  if (secret_type) { query += ' AND s.secret_type = ?'; params.push(secret_type); }
  if (status) { query += ' AND s.status = ?'; params.push(status); }
  
  query += ' ORDER BY s.created_at DESC';
  const secrets = db.prepare(query).all(...params);
  
  secrets.forEach(s => {
    s.secret_value = '***' + s.secret_value.slice(-4);
  });
  
  res.json({ data: secrets });
});

router.post('/', checkPermission('secret:write'), (req, res) => {
  const errors = validateSecret(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: '验证失败', details: errors });
  }
  
  const secretValue = req.body.secret_value || uuidv4().replace(/-/g, '');
  
  try {
    const result = db.prepare(`
      INSERT INTO secrets (app_id, env_id, secret_type, secret_key, secret_value, status, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.body.app_id,
      req.body.env_id,
      req.body.secret_type,
      req.body.secret_key,
      secretValue,
      req.body.status || 'active',
      req.body.expires_at || null,
      req.user.id
    );
    
    createAuditLog(req.user.id, 'create', 'secret', result.lastInsertRowid, null, { ...req.body, secret_value: '***' }, req.ip, req.get('User-Agent'));
    
    res.status(201).json({ id: result.lastInsertRowid, secret_key: req.body.secret_key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', checkPermission('secret:write'), (req, res) => {
  const oldSecret = db.prepare('SELECT * FROM secrets WHERE id = ?').get(req.params.id);
  if (!oldSecret) {
    return res.status(404).json({ error: '密钥不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE secrets
      SET secret_type = ?, secret_key = ?, status = ?, expires_at = ?
      WHERE id = ?
    `).run(req.body.secret_type, req.body.secret_key, req.body.status || 'active', req.body.expires_at || null, req.params.id);
    
    createAuditLog(req.user.id, 'update', 'secret', req.params.id, { ...oldSecret, secret_value: '***' }, { ...req.body, secret_value: '***' }, req.ip, req.get('User-Agent'));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', checkPermission('secret:delete'), (req, res) => {
  const oldSecret = db.prepare('SELECT * FROM secrets WHERE id = ?').get(req.params.id);
  if (!oldSecret) {
    return res.status(404).json({ error: '密钥不存在' });
  }
  
  try {
    db.prepare('DELETE FROM secrets WHERE id = ?').run(req.params.id);
    createAuditLog(req.user.id, 'delete', 'secret', req.params.id, { ...oldSecret, secret_value: '***' }, null, req.ip, req.get('User-Agent'));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/rotate', checkPermission('secret:write'), (req, res) => {
  const oldSecret = db.prepare('SELECT * FROM secrets WHERE id = ?').get(req.params.id);
  if (!oldSecret) {
    return res.status(404).json({ error: '密钥不存在' });
  }
  
  const newSecretValue = uuidv4().replace(/-/g, '');
  
  try {
    db.prepare(`
      UPDATE secrets
      SET secret_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newSecretValue, req.params.id);
    
    createAuditLog(req.user.id, 'rotate', 'secret', req.params.id, { key: oldSecret.secret_key }, { key: oldSecret.secret_key, rotated: true }, req.ip, req.get('User-Agent'));
    
    res.json({ success: true, message: '密钥已轮换' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
