const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { authMiddleware, createAuditLog } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const { status, owner_id, page = 1, page_size = 20 } = req.query;
  let query = `
    SELECT a.*, u.name as owner_name, u2.name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN users u2 ON a.created_by = u2.id
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
  params.push(parseInt(page_size), (parseInt(page) - 1) * parseInt(page_size));

  const apps = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM applications WHERE 1=1').get().count;

  res.json({ data: apps, total, page: parseInt(page), page_size: parseInt(page_size) });
});

router.get('/:id', (req, res) => {
  const app = db.prepare(`
    SELECT a.*, u.name as owner_name, u2.name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN users u2 ON a.created_by = u2.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  const environments = db.prepare('SELECT * FROM environments WHERE app_id = ?').all(req.params.id);
  const versions = db.prepare('SELECT * FROM app_versions WHERE app_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);
  const keys = db.prepare('SELECT * FROM api_keys WHERE app_id = ?').all(req.params.id);
  const tasks = db.prepare('SELECT * FROM stress_tasks WHERE app_id = ? ORDER BY created_at DESC LIMIT 10').all(req.params.id);

  res.json({
    ...app,
    environments,
    versions,
    keys,
    tasks
  });
});

router.post('/', (req, res) => {
  const { name, description, owner_id, status = 'active' } = req.body;

  const validationErrors = [];
  if (!name) validationErrors.push('应用名称不能为空');
  if (!owner_id) validationErrors.push('必须指定应用负责人');

  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(owner_id);
  if (!owner) validationErrors.push('指定的负责人不存在');

  if (validationErrors.length > 0) {
    return res.status(400).json({ error: '字段校验失败', details: validationErrors });
  }

  const appId = uuidv4();
  const result = db.prepare(`
    INSERT INTO applications (app_id, name, description, owner_id, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(appId, name, description, owner_id, status, req.user.id);

  createAuditLog(req.user.id, 'create', 'application', appId, null, JSON.stringify({ name, description, owner_id, status }), '创建新应用');

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(app);
});

router.put('/:id', (req, res) => {
  const { name, description, owner_id, status } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);

  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  const oldValue = JSON.stringify(app);
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (owner_id !== undefined) { updates.push('owner_id = ?'); params.push(owner_id); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    db.prepare(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    createAuditLog(req.user.id, 'update', 'application', app.app_id, oldValue, JSON.stringify(req.body), '更新应用信息');
  }

  const updatedApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  res.json(updatedApp);
});

router.delete('/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  const activeTasks = db.prepare('SELECT COUNT(*) as count FROM stress_tasks WHERE app_id = ? AND status IN ("pending", "running")').get(req.params.id).count;
  if (activeTasks > 0) {
    return res.status(400).json({ error: '存在运行中的压测任务，无法删除应用' });
  }

  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  createAuditLog(req.user.id, 'delete', 'application', app.app_id, JSON.stringify(app), null, '删除应用');

  res.json({ message: '应用已删除' });
});

module.exports = router;
