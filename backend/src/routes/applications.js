const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { permissionMiddleware, createAuditLog, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { status, owner_id } = req.query;
  
  let query = `
    SELECT a.*, u.name as owner_name, u.email as owner_email
    FROM applications a
    JOIN users u ON a.owner_id = u.id
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

  query += ' ORDER BY a.created_at DESC';

  const apps = db.prepare(query).all(...params);
  res.json(apps);
});

router.get('/:id', (req, res) => {
  const app = db.prepare(`
    SELECT a.*, u.name as owner_name, u.email as owner_email
    FROM applications a
    JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  const environments = db.prepare('SELECT * FROM environments WHERE app_id = ? ORDER BY name').all(req.params.id);
  const versions = db.prepare(`
    SELECT cv.*, e.name as env_name, u.name as creator_name
    FROM config_versions cv
    LEFT JOIN environments e ON cv.env_id = e.id
    LEFT JOIN users u ON cv.created_by = u.id
    WHERE cv.app_id = ?
    ORDER BY cv.created_at DESC
    LIMIT 20
  `).all(req.params.id);
  const tasks = db.prepare(`
    SELECT t.*, u.name as creator_name
    FROM execution_tasks t
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.app_id = ?
    ORDER BY t.created_at DESC
    LIMIT 10
  `).all(req.params.id);

  res.json({ ...app, environments, versions, tasks });
});

router.post('/', roleMiddleware('admin', 'owner'), (req, res) => {
  const { name, code, description, tech_stack } = req.body;
  const user = req.user;

  const validation = [];
  if (!name || name.trim().length < 2) validation.push('应用名称至少2个字符');
  if (!code || !/^[a-z][a-z0-9-]*$/.test(code)) validation.push('应用代码只能包含小写字母、数字和横杠，且以字母开头');
  if (!description || description.length < 10) validation.push('应用描述至少10个字符');

  if (validation.length > 0) {
    return res.status(400).json({ error: '字段验证失败', details: validation });
  }

  const existing = db.prepare('SELECT COUNT(*) as count FROM applications WHERE name = ? OR code = ?').get(name, code);
  if (existing.count > 0) {
    return res.status(400).json({ error: '应用名称或代码已存在' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO applications (id, name, code, description, owner_id, tech_stack)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, code, description, user.id, tech_stack || '');

  createAuditLog(user.id, user.name, 'create_application', 'application', id, { name, code }, req.ip);

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.status(201).json(app);
});

router.put('/:id', roleMiddleware('admin', 'owner'), (req, res) => {
  const { name, description, tech_stack, status } = req.body;
  const user = req.user;
  const appId = req.params.id;

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  db.prepare(`
    UPDATE applications 
    SET name = ?, description = ?, tech_stack = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, description, tech_stack, status || app.status, appId);

  createAuditLog(user.id, user.name, 'update_application', 'application', appId, { before: app, after: req.body }, req.ip);

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  res.json(updated);
});

router.delete('/:id', roleMiddleware('admin'), (req, res) => {
  const appId = req.params.id;
  const user = req.user;

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  db.prepare('UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('deleted', appId);
  
  createAuditLog(user.id, user.name, 'delete_application', 'application', appId, { app }, req.ip);
  
  res.json({ message: '应用已删除' });
});

router.get('/:appId/environments', (req, res) => {
  const envs = db.prepare('SELECT * FROM environments WHERE app_id = ? ORDER BY name').all(req.params.appId);
  res.json(envs);
});

router.post('/:appId/environments', roleMiddleware('admin', 'owner'), (req, res) => {
  const { name, description } = req.body;
  const user = req.user;
  const appId = req.params.appId;

  if (!name || !['开发环境', '测试环境', '预发环境', '生产环境'].includes(name)) {
    return res.status(400).json({ error: '环境名称必须是：开发环境、测试环境、预发环境、生产环境' });
  }

  const existing = db.prepare('SELECT COUNT(*) as count FROM environments WHERE app_id = ? AND name = ?').get(appId, name);
  if (existing.count > 0) {
    return res.status(400).json({ error: '该环境已存在' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO environments (id, app_id, name, description)
    VALUES (?, ?, ?, ?)
  `).run(id, appId, name, description || '');

  createAuditLog(user.id, user.name, 'create_environment', 'environment', id, { name, appId }, req.ip);

  res.status(201).json({ id, app_id: appId, name, description });
});

module.exports = router;
