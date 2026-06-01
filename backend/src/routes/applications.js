const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all();
  res.json(apps);
});

router.get('/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: '应用不存在' });
  res.json(app);
});

router.post('/', (req, res) => {
  const { name, description, owner } = req.body;
  if (!name || !owner) {
    return res.status(400).json({ error: '名称和负责人必填' });
  }
  
  const id = uuidv4();
  db.prepare(`
    INSERT INTO applications (id, name, description, owner, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(id, name, description, owner);

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'create', 'application', ?, ?)
  `).run(uuidv4(), owner, id, JSON.stringify({ name }));

  const newApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  res.status(201).json(newApp);
});

router.put('/:id', (req, res) => {
  const { name, description, owner, status } = req.body;
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: '应用不存在' });

  db.prepare(`
    UPDATE applications 
    SET name = ?, description = ?, owner = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || app.name, description || app.description, owner || app.owner, status || app.status, req.params.id);

  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'update', 'application', ?, ?)
  `).run(uuidv4(), 'admin', req.params.id, JSON.stringify(req.body));

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: '应用不存在' });

  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  
  db.prepare(`
    INSERT INTO operation_logs (id, user_id, action, resource_type, resource_id, details)
    VALUES (?, ?, 'delete', 'application', ?, ?)
  `).run(uuidv4(), 'admin', req.params.id, JSON.stringify({ name: app.name }));

  res.json({ message: '删除成功' });
});

router.get('/:id/environments', (req, res) => {
  const envs = db.prepare('SELECT * FROM environments WHERE app_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(envs);
});

router.post('/:id/environments', (req, res) => {
  const { name, type } = req.body;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO environments (id, app_id, name, type, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(id, req.params.id, name, type);
  res.status(201).json({ id, app_id: req.params.id, name, type, status: 'active' });
});

module.exports = router;
