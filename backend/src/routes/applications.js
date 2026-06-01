const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { createAuditLog } = require('../utils/audit');
const { checkPermission } = require('../middleware/auth');

function validateApp(data) {
  const errors = [];
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: '应用名称不能为空' });
  }
  if (!data.type || !['web', 'mobile', 'api', 'desktop'].includes(data.type)) {
    errors.push({ field: 'type', message: '应用类型无效' });
  }
  if (data.status && !['development', 'testing', 'production', 'disabled'].includes(data.status)) {
    errors.push({ field: 'status', message: '状态无效' });
  }
  return errors;
}

router.get('/', checkPermission('app:read'), (req, res) => {
  const { status, type, owner_id, keyword, page = 1, page_size = 20 } = req.query;
  
  let query = `
    SELECT a.*, u.real_name as owner_name, c.real_name as creator_name,
           (SELECT COUNT(*) FROM environments WHERE app_id = a.id) as env_count,
           (SELECT COUNT(*) FROM secrets WHERE app_id = a.id) as secret_count
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN users c ON a.created_by = c.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }
  if (owner_id) {
    query += ' AND a.owner_id = ?';
    params.push(owner_id);
  }
  if (keyword) {
    query += ' AND (a.name LIKE ? OR a.app_id LIKE ? OR a.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  const total = db.prepare(query.replace('SELECT a.*', 'SELECT COUNT(*) as count')).get(...params).count;
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));
  
  const apps = db.prepare(query).all(...params);
  
  res.json({
    data: apps,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  });
});

router.get('/:id', checkPermission('app:read'), (req, res) => {
  const app = db.prepare(`
    SELECT a.*, u.real_name as owner_name, c.real_name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN users c ON a.created_by = c.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }
  
  const environments = db.prepare('SELECT * FROM environments WHERE app_id = ? ORDER BY created_at DESC').all(req.params.id);
  const versions = db.prepare('SELECT * FROM app_versions WHERE app_id = ? ORDER BY created_at DESC').all(req.params.id);
  const secrets = db.prepare(`
    SELECT s.*, e.name as env_name, u.real_name as creator_name
    FROM secrets s
    JOIN environments e ON s.env_id = e.id
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.app_id = ?
    ORDER BY s.created_at DESC
  `).all(req.params.id);
  
  res.json({
    ...app,
    environments,
    versions,
    secrets
  });
});

router.post('/', checkPermission('app:write'), (req, res) => {
  const errors = validateApp(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: '验证失败', details: errors });
  }
  
  const appId = `app_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
  
  try {
    const result = db.prepare(`
      INSERT INTO applications (app_id, name, description, type, owner_id, status, callback_urls, logout_urls, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      appId,
      req.body.name,
      req.body.description || '',
      req.body.type,
      req.body.owner_id || null,
      req.body.status || 'development',
      JSON.stringify(req.body.callback_urls || []),
      JSON.stringify(req.body.logout_urls || []),
      req.user.id
    );
    
    createAuditLog(req.user.id, 'create', 'application', result.lastInsertRowid, null, req.body, req.ip, req.get('User-Agent'));
    
    res.status(201).json({ id: result.lastInsertRowid, app_id: appId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', checkPermission('app:write'), (req, res) => {
  const oldApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!oldApp) {
    return res.status(404).json({ error: '应用不存在' });
  }
  
  const errors = validateApp(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: '验证失败', details: errors });
  }
  
  try {
    db.prepare(`
      UPDATE applications
      SET name = ?, description = ?, type = ?, owner_id = ?, status = ?, callback_urls = ?, logout_urls = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      req.body.name,
      req.body.description || '',
      req.body.type,
      req.body.owner_id || null,
      req.body.status || 'development',
      JSON.stringify(req.body.callback_urls || []),
      JSON.stringify(req.body.logout_urls || []),
      req.params.id
    );
    
    createAuditLog(req.user.id, 'update', 'application', req.params.id, oldApp, req.body, req.ip, req.get('User-Agent'));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', checkPermission('app:delete'), (req, res) => {
  const oldApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!oldApp) {
    return res.status(404).json({ error: '应用不存在' });
  }
  
  try {
    db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
    createAuditLog(req.user.id, 'delete', 'application', req.params.id, oldApp, null, req.ip, req.get('User-Agent'));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batch', checkPermission('app:write'), (req, res) => {
  const { ids, action, data } = req.body;
  const results = [];
  
  const stmt = db.prepare(`UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  
  const transaction = db.transaction((ids) => {
    ids.forEach(id => {
      const oldApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
      if (oldApp) {
        stmt.run(data.status, id);
        createAuditLog(req.user.id, 'batch_update', 'application', id, oldApp, data, req.ip, req.get('User-Agent'));
        results.push({ id, success: true });
      } else {
        results.push({ id, success: false, error: '应用不存在' });
      }
    });
  });
  
  try {
    transaction(ids);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
