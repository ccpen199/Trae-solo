const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken, auditLog } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { status, owner_id, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT a.*, u.name as owner_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (owner_id) {
    query += ' AND a.owner_id = ?';
    params.push(owner_id);
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const applications = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM applications WHERE 1=1';
  const { total } = db.prepare(countQuery).get();

  res.json({
    list: applications,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.get('/:id', (req, res) => {
  const application = db.prepare(`
    SELECT a.*, u.name as owner_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!application) {
    return res.status(404).json({ error: '应用不存在' });
  }

  res.json(application);
});

router.post('/', (req, res) => {
  const { app_name, description, owner_id } = req.body;
  
  if (!app_name) {
    return res.status(400).json({ error: '应用名称不能为空' });
  }

  const app_id = 'APP-' + uuidv4().substring(0, 8).toUpperCase();

  const stmt = db.prepare(`
    INSERT INTO applications (app_id, app_name, description, owner_id, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  
  const result = stmt.run(app_id, app_name, description, owner_id || req.user.id);
  const appId = result.lastInsertRowid;

  auditLog(req, 'create', 'application', appId, null, { app_id, app_name });

  res.json({
    id: appId,
    app_id,
    app_name,
    status: 'pending'
  });
});

router.put('/:id', (req, res) => {
  const { app_name, description, owner_id, status } = req.body;
  
  const oldApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!oldApp) {
    return res.status(404).json({ error: '应用不存在' });
  }

  const stmt = db.prepare(`
    UPDATE applications
    SET app_name = COALESCE(?, app_name),
        description = COALESCE(?, description),
        owner_id = COALESCE(?, owner_id),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(app_name, description, owner_id, status, req.params.id);

  auditLog(req, 'update', 'application', req.params.id, oldApp, { app_name, description, owner_id, status });

  res.json({ message: '更新成功' });
});

router.get('/:id/environments', (req, res) => {
  const environments = db.prepare(`
    SELECT * FROM environments WHERE app_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  res.json(environments);
});

router.post('/:id/environments', (req, res) => {
  const { env_name, env_type, config } = req.body;
  
  if (!env_name || !env_type) {
    return res.status(400).json({ error: '环境名称和类型不能为空' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO environments (app_id, env_name, env_type, config)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(req.params.id, env_name, env_type, JSON.stringify(config || {}));
    
    auditLog(req, 'create', 'environment', result.lastInsertRowid, null, { env_name, env_type });
    
    res.json({ id: result.lastInsertRowid, env_name, env_type });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: '环境名称已存在' });
    }
    throw err;
  }
});

router.get('/:id/api-keys', (req, res) => {
  const keys = db.prepare(`
    SELECT k.*, e.env_name, u.name as creator_name
    FROM api_keys k
    LEFT JOIN environments e ON k.env_id = e.id
    LEFT JOIN users u ON k.created_by = u.id
    WHERE k.app_id = ?
    ORDER BY k.created_at DESC
  `).all(req.params.id);

  keys.forEach(k => {
    k.api_key = '***' + k.api_key.slice(-4);
  });

  res.json(keys);
});

router.post('/:id/api-keys', (req, res) => {
  const { key_name, env_id, expires_at } = req.body;
  
  if (!key_name) {
    return res.status(400).json({ error: '密钥名称不能为空' });
  }

  const api_key = 'AK-' + uuidv4().replace(/-/g, '').toUpperCase();

  const stmt = db.prepare(`
    INSERT INTO api_keys (app_id, env_id, key_name, api_key, created_by, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(req.params.id, env_id, key_name, api_key, req.user.id, expires_at);

  auditLog(req, 'create', 'api_key', result.lastInsertRowid, null, { key_name });

  res.json({
    id: result.lastInsertRowid,
    key_name,
    api_key
  });
});

module.exports = router;
