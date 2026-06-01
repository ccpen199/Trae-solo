const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { app_id, env_type } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (app_id) {
    whereClause += ' AND e.app_id = ?';
    params.push(app_id);
  }
  if (env_type) {
    whereClause += ' AND e.env_type = ?';
    params.push(env_type);
  }

  const environments = db.prepare(`
    SELECT e.*, a.app_name, a.app_key, u.name as creator_name
    FROM environments e
    LEFT JOIN applications a ON e.app_id = a.id
    LEFT JOIN users u ON e.created_by = u.id
    ${whereClause}
    ORDER BY e.created_at DESC
  `).all(...params);

  res.json(environments);
});

router.get('/:id', (req, res) => {
  const env = db.prepare(`
    SELECT e.*, a.app_name
    FROM environments e
    LEFT JOIN applications a ON e.app_id = a.id
    WHERE e.id = ?
  `).get(req.params.id);

  if (!env) {
    return res.status(404).json({ error: '环境不存在' });
  }

  res.json(env);
});

router.post('/', (req, res) => {
  const { app_id, env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, connection_string } = req.body;

  const result = db.prepare(`
    INSERT INTO environments (app_id, env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, connection_string, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(app_id, env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, connection_string || '', req.user.id);

  db.prepare('INSERT INTO operation_logs (user_id, operation, module, details) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'create_environment', 'environments', JSON.stringify({ app_id, env_name, env_type }));

  res.json({ id: result.lastInsertRowid, message: '创建成功' });
});

router.put('/:id', (req, res) => {
  const { env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, connection_string, status } = req.body;
  const envId = req.params.id;

  db.prepare(`
    UPDATE environments 
    SET env_name = COALESCE(?, env_name),
        env_type = COALESCE(?, env_type),
        db_type = COALESCE(?, db_type),
        db_host = COALESCE(?, db_host),
        db_port = COALESCE(?, db_port),
        db_name = COALESCE(?, db_name),
        db_user = COALESCE(?, db_user),
        db_password_encrypted = COALESCE(?, db_password_encrypted),
        connection_string = COALESCE(?, connection_string),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(env_name, env_type, db_type, db_host, db_port, db_name, db_user, db_password_encrypted, connection_string, status, envId);

  db.prepare('INSERT INTO operation_logs (user_id, operation, module, details) VALUES (?, ?, ?, ?)')
    .run(req.user.id, 'update_environment', 'environments', JSON.stringify({ envId, changes: req.body }));

  res.json({ message: '更新成功' });
});

module.exports = router;
