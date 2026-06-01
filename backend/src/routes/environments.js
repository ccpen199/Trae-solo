import express from 'express';
import db from '../database/init.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('environment', 'read'), (req, res) => {
  const { app_id, env_type, status, keyword, page = 1, pageSize = 20 } = req.query;
  
  let query = `
    SELECT e.*, a.app_code, a.app_name, u.real_name as creator_name
    FROM environments e
    JOIN applications a ON e.app_id = a.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (app_id) {
    query += ' AND e.app_id = ?';
    params.push(app_id);
  }
  if (env_type) {
    query += ' AND e.env_type = ?';
    params.push(env_type);
  }
  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }
  if (keyword) {
    query += ' AND (e.env_name LIKE ? OR a.app_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const totalResult = db.prepare(query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as count FROM')).get(...params);
  const total = totalResult ? totalResult.count : 0;
  
  query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));

  const envs = db.prepare(query).all(...params).map(e => ({
    ...e,
    db_password_encrypted: '***'
  }));

  res.json({
    list: envs,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  });
});

router.post('/', checkPermission('environment', 'create'), (req, res) => {
  const { 
    app_id, env_name, env_type, db_type, db_host, db_port, 
    db_name, db_user, db_password, connection_string, version 
  } = req.body;

  if (!app_id || !env_name || !env_type || !db_type || !db_host || !db_port || !db_name || !db_user || !db_password) {
    return res.status(400).json({ error: '必填项不完整' });
  }

  const existing = db.prepare('SELECT id FROM environments WHERE app_id = ? AND env_name = ?').get(app_id, env_name);
  if (existing) {
    return res.status(400).json({ error: '该应用下环境名称已存在' });
  }

  const result = db.prepare(`
    INSERT INTO environments (
      app_id, env_name, env_type, db_type, db_host, db_port, 
      db_name, db_user, db_password_encrypted, connection_string, version, created_by, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    app_id, env_name, env_type, db_type, db_host, db_port, 
    db_name, db_user, Buffer.from(db_password).toString('base64'), connection_string, version, req.user.id
  );

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'create', 'environment', ?, ?, ?)
  `).run(req.user.id, req.user.username, result.lastInsertRowid, env_name, `创建环境: ${env_name}`);

  res.json({
    id: result.lastInsertRowid,
    env_name,
    message: '环境创建成功'
  });
});

router.put('/:id', checkPermission('environment', 'update'), (req, res) => {
  const { id } = req.params;
  const { 
    env_name, db_host, db_port, db_name, db_user, db_password, 
    connection_string, version, status 
  } = req.body;

  const env = db.prepare('SELECT * FROM environments WHERE id = ?').get(id);
  if (!env) {
    return res.status(404).json({ error: '环境不存在' });
  }

  db.prepare(`
    UPDATE environments 
    SET env_name = ?, db_host = ?, db_port = ?, db_name = ?, db_user = ?, 
        db_password_encrypted = ?, connection_string = ?, version = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    env_name || env.env_name,
    db_host || env.db_host,
    db_port || env.db_port,
    db_name || env.db_name,
    db_user || env.db_user,
    db_password ? Buffer.from(db_password).toString('base64') : env.db_password_encrypted,
    connection_string,
    version,
    status || env.status,
    id
  );

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'update', 'environment', ?, ?, ?)
  `).run(req.user.id, req.user.username, id, env_name || env.env_name, `更新环境: ${env.env_name}`);

  res.json({ message: '环境更新成功' });
});

router.get('/:id', checkPermission('environment', 'read'), (req, res) => {
  const env = db.prepare(`
    SELECT e.*, a.app_code, a.app_name, u.real_name as creator_name
    FROM environments e
    JOIN applications a ON e.app_id = a.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!env) {
    return res.status(404).json({ error: '环境不存在' });
  }

  env.db_password_encrypted = '***';
  res.json(env);
});

router.delete('/:id', checkPermission('environment', 'delete'), (req, res) => {
  const env = db.prepare('SELECT * FROM environments WHERE id = ?').get(req.params.id);
  if (!env) {
    return res.status(404).json({ error: '环境不存在' });
  }

  const strategyCount = db.prepare('SELECT COUNT(*) as count FROM backup_strategies WHERE env_id = ?').get(req.params.id).count;
  if (strategyCount > 0) {
    return res.status(400).json({ error: '该环境下存在备份策略，请先删除策略' });
  }

  db.prepare('DELETE FROM environments WHERE id = ?').run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (audit_type, user_id, username, action, resource_type, resource_id, resource_name, description)
    VALUES ('config_change', ?, ?, 'delete', 'environment', ?, ?, ?)
  `).run(req.user.id, req.user.username, req.params.id, env.env_name, `删除环境: ${env.env_name}`);

  res.json({ message: '环境删除成功' });
});

export default router;
