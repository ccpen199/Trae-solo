const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const validator = require('../utils/validator');
const { permissionMiddleware, auditMiddleware } = require('../middleware/auth');

router.get('/', (req, res) => {
  const { status, owner, search } = req.query;
  let query = 'SELECT * FROM applications WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (owner) {
    query += ' AND owner = ?';
    params.push(owner);
  }
  if (search) {
    query += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC';
  const apps = db.prepare(query).all(...params);
  
  const appsWithEnv = apps.map(app => {
    const envs = db.prepare('SELECT * FROM environments WHERE app_id = ?').all(app.id);
    const configs = db.prepare('SELECT COUNT(*) as count FROM webhook_configs WHERE app_id = ?').get(app.id);
    return { ...app, environments: envs, configCount: configs.count };
  });

  res.json(appsWithEnv);
});

router.get('/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }
  
  const envs = db.prepare('SELECT * FROM environments WHERE app_id = ?').all(app.id);
  const owner = db.prepare('SELECT id, name, username FROM users WHERE id = ?').get(app.owner);
  
  res.json({ ...app, environments: envs, owner });
});

router.post('/', permissionMiddleware(['admin', 'devops']), auditMiddleware('create', 'application'), (req, res) => {
  const { name, code, description, owner } = req.body;
  
  if (!name || !code || !owner) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const existing = db.prepare('SELECT * FROM applications WHERE code = ?').get(code);
  if (existing) {
    return res.status(400).json({ error: '应用编码已存在' });
  }

  const id = `app-${Date.now()}`;
  db.prepare(`
    INSERT INTO applications (id, name, code, description, owner, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(id, name, code, description || '', owner);

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.status(201).json(app);
});

router.put('/:id', permissionMiddleware(['admin', 'devops', 'owner']), auditMiddleware('update', 'application'), (req, res) => {
  const { name, description, owner, status } = req.body;
  const appId = req.params.id;

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  db.prepare(`
    UPDATE applications 
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        owner = COALESCE(?, owner),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, owner, status, appId);

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  res.json(updated);
});

router.post('/:id/environments', permissionMiddleware(['admin', 'devops']), auditMiddleware('create', 'environment'), (req, res) => {
  const { name, type, config } = req.body;
  const appId = req.params.id;

  if (!name || !type) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const id = `env-${Date.now()}`;
  db.prepare(`
    INSERT INTO environments (id, app_id, name, type, config)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, appId, name, type, config ? JSON.stringify(config) : '{}');

  const env = db.prepare('SELECT * FROM environments WHERE id = ?').get(id);
  res.status(201).json(env);
});

module.exports = router;
