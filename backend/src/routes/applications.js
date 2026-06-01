import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('application', 'read'), (req, res) => {
  const { status, owner_id, keyword, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT a.*, u.real_name as owner_name, c.real_name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.app_owner_id = u.id
    LEFT JOIN users c ON a.created_by = c.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (owner_id) {
    query += ' AND a.app_owner_id = ?';
    params.push(owner_id);
  }
  if (keyword) {
    query += ' AND (a.app_code LIKE ? OR a.app_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const countQuery = `SELECT COUNT(*) as count FROM applications a LEFT JOIN users u ON a.app_owner_id = u.id LEFT JOIN users c ON a.created_by = c.id WHERE 1=1${status ? ' AND a.status = ?' : ''}${owner_id ? ' AND a.app_owner_id = ?' : ''}${keyword ? ' AND (a.app_code LIKE ? OR a.app_name LIKE ?)' : ''}`;
  const total = db.prepare(countQuery).get(...params).count;
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const apps = db.prepare(query).all(...params);

  res.json({
    list: apps,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/', checkPermission('application', 'create'), (req, res) => {
  const { app_code, app_name, description, app_owner_id } = req.body;

  if (!app_code || !app_name) {
    return res.status(400).json({ error: '应用编码和名称为必填项' });
  }

  const existing = db.prepare('SELECT id FROM applications WHERE app_code = ?').get(app_code);
  if (existing) {
    return res.status(400).json({ error: '应用编码已存在' });
  }

  const result = db.prepare(`
    INSERT INTO applications (app_code, app_name, description, app_owner_id, created_by, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(app_code, app_name, description, app_owner_id || null, req.user.id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'create', 'application', ?, ?, ?)
  `).run(req.user.id, req.user.username, result.lastInsertRowid, app_name, `创建应用: ${app_code}`);

  res.json({
    id: result.lastInsertRowid,
    app_code,
    app_name,
    message: '应用创建成功'
  });
});

router.put('/:id', checkPermission('application', 'update'), (req, res) => {
  const { id } = req.params;
  const { app_name, description, app_owner_id, status } = req.body;

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  db.prepare(`
    UPDATE applications 
    SET app_name = ?, description = ?, app_owner_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(app_name || app.app_name, description, app_owner_id, status || app.status, id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'update', 'application', ?, ?, ?)
  `).run(req.user.id, req.user.username, id, app_name || app.app_name, `更新应用: ${app.app_code}`);

  res.json({ message: '应用更新成功' });
});

router.get('/:id', checkPermission('application', 'read'), (req, res) => {
  const app = db.prepare(`
    SELECT a.*, u.real_name as owner_name, c.real_name as creator_name
    FROM applications a
    LEFT JOIN users u ON a.app_owner_id = u.id
    LEFT JOIN users c ON a.created_by = c.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  res.json(app);
});

router.delete('/:id', checkPermission('application', 'delete'), (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) {
    return res.status(404).json({ error: '应用不存在' });
  }

  const envCount = db.prepare('SELECT COUNT(*) as count FROM environments WHERE app_id = ?').get(req.params.id).count;
  if (envCount > 0) {
    return res.status(400).json({ error: '该应用下存在环境配置，请先删除环境' });
  }

  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'delete', 'application', ?, ?, ?)
  `).run(req.user.id, req.user.username, req.params.id, app.app_name, `删除应用: ${app.app_code}`);

  res.json({ message: '应用删除成功' });
});

export default router;
