const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = 'SELECT a.*, u.name as owner_name FROM applications a LEFT JOIN users u ON a.owner_id = u.id WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const apps = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM applications WHERE 1=1' + (status ? ' AND status = ?' : '');
  const total = db.prepare(countQuery).get(status ? [status] : []).total;
  
  res.json({
    list: apps,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', (req, res) => {
  const app = db.prepare(`
    SELECT a.*, u.name as owner_name 
    FROM applications a 
    LEFT JOIN users u ON a.owner_id = u.id 
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }
  
  const environments = db.prepare('SELECT * FROM environments WHERE app_id = ?').get(req.params.id);
  const versions = db.prepare('SELECT * FROM versions WHERE app_id = ? ORDER BY created_at DESC').all(req.params.id);
  const apiKeys = db.prepare('SELECT * FROM api_keys WHERE app_id = ?').all(req.params.id);
  
  res.json({
    ...app,
    environments,
    versions,
    apiKeys
  });
});

router.post('/', (req, res) => {
  const { name, description, owner_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '应用名称不能为空' });
  }
  
  const appId = 'sdk-' + uuidv4().slice(0, 8);
  
  try {
    const result = db.prepare(`
      INSERT INTO applications (app_id, name, description, owner_id, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(appId, name, description || '', owner_id || null);
    
    db.prepare(`
      INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `audit-${Date.now()}`,
      1,
      'create',
      'application',
      result.lastInsertRowid,
      JSON.stringify({ name, app_id: appId }),
      req.ip
    );
    
    res.json({
      id: result.lastInsertRowid,
      app_id: appId,
      name,
      description,
      status: 'active'
    });
  } catch (err) {
    res.status(500).json({ error: '创建应用失败: ' + err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, description, owner_id, status } = req.body;
  
  const oldApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!oldApp) {
    return res.status(404).json({ error: '应用不存在' });
  }
  
  const validation = validateAppUpdate(req.body, oldApp);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error, field: validation.field });
  }
  
  db.prepare(`
    UPDATE applications 
    SET name = ?, description = ?, owner_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || oldApp.name, description ?? oldApp.description, owner_id ?? oldApp.owner_id, status || oldApp.status, req.params.id);
  
  db.prepare(`
    INSERT INTO audit_logs (log_id, user_id, action, resource_type, resource_id, old_value, new_value, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `audit-${Date.now()}`,
    1,
    'update',
    'application',
    req.params.id,
    JSON.stringify(oldApp),
    JSON.stringify(req.body),
    req.ip
  );
  
  res.json({ message: '更新成功' });
});

function validateAppUpdate(data, oldData) {
  if (data.name && data.name.trim() === '') {
    return { valid: false, error: '应用名称不能为空', field: 'name' };
  }
  if (data.status && !['active', 'inactive', 'archived'].includes(data.status)) {
    return { valid: false, error: '无效的状态值', field: 'status' };
  }
  if (data.status === 'archived' && oldData.status === 'active') {
    const activeKeys = db.prepare('SELECT COUNT(*) as count FROM api_keys WHERE app_id = ? AND status = ?').get(oldData.id, 'active').count;
    if (activeKeys > 0) {
      return { valid: false, error: '存在活跃密钥，请先禁用后再归档', field: 'status' };
    }
  }
  return { valid: true };
}

router.post('/:id/environments', (req, res) => {
  const { name, type, config } = req.body;
  const appId = req.params.id;
  
  if (!name || !type) {
    return res.status(400).json({ error: '环境名称和类型不能为空' });
  }
  
  const result = db.prepare(`
    INSERT INTO environments (app_id, name, type, config, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(appId, name, type, config ? JSON.stringify(config) : null);
  
  res.json({
    id: result.lastInsertRowid,
    name,
    type,
    status: 'active'
  });
});

router.post('/:id/versions', (req, res) => {
  const { version, description, changelog, status } = req.body;
  const appId = req.params.id;
  
  if (!version) {
    return res.status(400).json({ error: '版本号不能为空' });
  }
  
  const existing = db.prepare('SELECT * FROM versions WHERE app_id = ? AND version = ?').get(appId, version);
  if (existing) {
    return res.status(400).json({ error: '该版本号已存在', field: 'version' });
  }
  
  const result = db.prepare(`
    INSERT INTO versions (app_id, version, description, changelog, status, created_by)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(appId, version, description || '', changelog || '', status || 'draft');
  
  res.json({
    id: result.lastInsertRowid,
    version,
    description,
    status: status || 'draft'
  });
});

router.post('/:id/keys', (req, res) => {
  const { env_id, name, permissions, expires_at } = req.body;
  const appId = req.params.id;
  
  if (!name) {
    return res.status(400).json({ error: '密钥名称不能为空' });
  }
  
  const key = 'sk-' + uuidv4().replace(/-/g, '').slice(0, 16);
  const secret = 'secret-' + uuidv4().replace(/-/g, '').slice(0, 24);
  
  const result = db.prepare(`
    INSERT INTO api_keys (app_id, env_id, key, secret, name, permissions, status, expires_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 1)
  `).run(appId, env_id || null, key, secret, name, permissions ? JSON.stringify(permissions) : null, expires_at || null);
  
  res.json({
    id: result.lastInsertRowid,
    key,
    secret,
    name,
    status: 'active'
  });
});

router.put('/:id/keys/:keyId/status', (req, res) => {
  const { status } = req.body;
  
  if (!['active', 'inactive', 'revoked'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  db.prepare('UPDATE api_keys SET status = ? WHERE id = ?').run(status, req.params.keyId);
  
  res.json({ message: '状态更新成功' });
});

module.exports = router;
