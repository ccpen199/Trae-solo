const express = require('express');
const db = require('../database');
const { validateFields } = require('../middleware');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, status, category } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }
  if (category) {
    whereClause += ' AND a.category = ?';
    params.push(category);
  }

  const applications = db.prepare(`
    SELECT a.*, u.name as owner_name, creator.name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.owner_id = u.id
    LEFT JOIN users creator ON a.created_by = creator.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM applications a ${whereClause}
  `).get(...params);

  res.json({
    list: applications,
    total: total.count,
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

  res.json(app);
});

router.post('/', validateFields(['app_key', 'app_name', 'category']), (req, res) => {
  const { app_key, app_name, description, category, owner_id } = req.body;

  const existing = db.prepare('SELECT * FROM applications WHERE app_key = ?').get(app_key);
  if (existing) {
    return res.status(400).json({ error: '应用Key已存在' });
  }

  const result = db.prepare(`
    INSERT INTO applications (app_key, app_name, description, category, owner_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(app_key, app_name, description || '', category, owner_id || req.user.id, req.user.id);

  db.prepare('INSERT INTO operation_logs (user_id, operation, module, details) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'create_application', 'applications', JSON.stringify({ app_key, app_name }));

  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', (req, res) => {
  const { app_name, description, category, owner_id, status } = req.body;
  const appId = req.params.id;

  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  if (!existing) {
    return res.status(404).json({ error: '应用不存在' });
  }

  db.prepare(`
    UPDATE applications 
    SET app_name = COALESCE(?, app_name),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        owner_id = COALESCE(?, owner_id),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(app_name, description, category, owner_id, status, appId);

  db.prepare('INSERT INTO operation_logs (user_id, operation, module, details) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'update_application', 'applications', JSON.stringify({ appId, changes: req.body }));

  res.json({ message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const appId = req.params.id;
  
  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(appId);
  if (!existing) {
    return res.status(404).json({ error: '应用不存在' });
  }

  db.prepare('DELETE FROM applications WHERE id = ?').run(appId);
  
  db.prepare('INSERT INTO operation_logs (user_id, operation, module, details) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'delete_application', 'applications', JSON.stringify({ appId, app_key: existing.app_key }));

  res.json({ message: '删除成功' });
});

module.exports = router;
