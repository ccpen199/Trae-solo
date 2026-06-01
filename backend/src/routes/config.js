const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { permissionMiddleware, createAuditLog, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/versions', (req, res) => {
  const { app_id, env_id, status } = req.query;
  
  let query = `
    SELECT cv.*, a.name as app_name, e.name as env_name, u.name as creator_name
    FROM config_versions cv
    JOIN applications a ON cv.app_id = a.id
    JOIN environments e ON cv.env_id = e.id
    JOIN users u ON cv.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) {
    query += ' AND cv.app_id = ?';
    params.push(app_id);
  }
  if (env_id) {
    query += ' AND cv.env_id = ?';
    params.push(env_id);
  }
  if (status) {
    query += ' AND cv.status = ?';
    params.push(status);
  }

  query += ' ORDER BY cv.created_at DESC';

  const versions = db.prepare(query).all(...params);
  res.json(versions);
});

router.get('/versions/:id', (req, res) => {
  const version = db.prepare(`
    SELECT cv.*, a.name as app_name, e.name as env_name, u.name as creator_name
    FROM config_versions cv
    JOIN applications a ON cv.app_id = a.id
    JOIN environments e ON cv.env_id = e.id
    JOIN users u ON cv.created_by = u.id
    WHERE cv.id = ?
  `).get(req.params.id);

  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }

  const keys = db.prepare('SELECT * FROM config_keys WHERE version_id = ?').all(req.params.id);
  const timeline = db.prepare(`
    SELECT tel.*, u.name as operator_name
    FROM task_execution_logs tel
    JOIN execution_tasks et ON tel.task_id = et.id
    JOIN users u ON tel.operator_id = u.id
    WHERE et.version_id = ?
    ORDER BY tel.created_at DESC
  `).all(req.params.id);

  res.json({ ...version, keys, timeline });
});

router.post('/versions', permissionMiddleware('config', 'write'), (req, res) => {
  const { app_id, env_id, version, config_content, config_type, comment } = req.body;
  const user = req.user;

  const validation = [];
  if (!app_id) validation.push('应用ID不能为空');
  if (!env_id) validation.push('环境ID不能为空');
  if (!version || !/^v\d+\.\d+\.\d+$/.test(version)) validation.push('版本号格式必须为 vX.Y.Z (如 v1.0.0)');
  if (!config_content) {
    validation.push('配置内容不能为空');
  } else {
    try {
      JSON.parse(config_content);
    } catch (e) {
      validation.push('配置内容必须是有效的JSON格式');
    }
  }

  if (validation.length > 0) {
    return res.status(400).json({ error: '字段验证失败', details: validation });
  }

  const existing = db.prepare('SELECT COUNT(*) as count FROM config_versions WHERE app_id = ? AND env_id = ? AND version = ?').get(app_id, env_id, version);
  if (existing.count > 0) {
    return res.status(400).json({ error: '该版本号已存在' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO config_versions (id, app_id, env_id, version, config_content, config_type, comment, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, app_id, env_id, version, config_content, config_type || 'json', comment || '', user.id);

  createAuditLog(user.id, user.name, 'create_config_version', 'config_version', id, { version, app_id }, req.ip);

  const newVersion = db.prepare('SELECT * FROM config_versions WHERE id = ?').get(id);
  res.status(201).json(newVersion);
});

router.put('/versions/:id/status', permissionMiddleware('config', 'write'), (req, res) => {
  const { status } = req.body;
  const user = req.user;
  const versionId = req.params.id;

  if (!['draft', 'pending', 'approved', 'rejected', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const version = db.prepare('SELECT * FROM config_versions WHERE id = ?').get(versionId);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }

  const beforeState = version.status;
  
  db.prepare('UPDATE config_versions SET status = ? WHERE id = ?').run(status, versionId);

  createAuditLog(user.id, user.name, 'change_config_status', 'config_version', versionId, {
    from: beforeState,
    to: status
  }, req.ip);

  res.json({ message: '状态已更新' });
});

router.get('/keys', (req, res) => {
  const { app_id, env_id, is_secret } = req.query;
  
  let query = `
    SELECT ck.*, a.name as app_name, e.name as env_name, u.name as creator_name
    FROM config_keys ck
    JOIN applications a ON ck.app_id = a.id
    JOIN environments e ON ck.env_id = e.id
    JOIN users u ON ck.created_by = u.id
    WHERE ck.status = 'active'
  `;
  const params = [];

  if (app_id) {
    query += ' AND ck.app_id = ?';
    params.push(app_id);
  }
  if (env_id) {
    query += ' AND ck.env_id = ?';
    params.push(env_id);
  }
  if (is_secret !== undefined) {
    query += ' AND ck.is_secret = ?';
    params.push(is_secret ? 1 : 0);
  }

  query += ' ORDER BY ck.key_name';

  const keys = db.prepare(query).all(...params);
  
  keys.forEach(key => {
    if (key.is_secret) {
      key.key_value = '******';
    }
  });

  res.json(keys);
});

router.post('/keys', permissionMiddleware('config', 'write'), (req, res) => {
  const { app_id, env_id, key_name, key_value, is_secret } = req.body;
  const user = req.user;

  const validation = [];
  if (!app_id) validation.push('应用ID不能为空');
  if (!env_id) validation.push('环境ID不能为空');
  if (!key_name || key_name.length < 2) validation.push('配置键名至少2个字符');
  if (!key_value) validation.push('配置值不能为空');

  if (validation.length > 0) {
    return res.status(400).json({ error: '字段验证失败', details: validation });
  }

  const existing = db.prepare('SELECT COUNT(*) as count FROM config_keys WHERE app_id = ? AND env_id = ? AND key_name = ? AND status = ?').get(app_id, env_id, key_name, 'active');
  if (existing.count > 0) {
    return res.status(400).json({ error: '该配置键已存在' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO config_keys (id, app_id, env_id, key_name, key_value, is_secret, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, app_id, env_id, key_name, key_value, is_secret ? 1 : 0, user.id);

  createAuditLog(user.id, user.name, 'create_config_key', 'config_key', id, { key_name, app_id }, req.ip);

  const key = db.prepare('SELECT * FROM config_keys WHERE id = ?').get(id);
  if (key.is_secret) {
    key.key_value = '******';
  }
  res.status(201).json(key);
});

module.exports = router;
