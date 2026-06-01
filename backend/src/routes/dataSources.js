const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { checkPermission, logOperation } = require('../middleware/auth');

router.get('/', checkPermission('task:view'), (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM data_sources WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(sql);
  const dataSources = stmt.all(...params);
  
  res.json({ data: dataSources });
});

router.get('/:id', checkPermission('task:view'), (req, res) => {
  const stmt = db.prepare('SELECT * FROM data_sources WHERE id = ?');
  const dataSource = stmt.get(req.params.id);
  
  if (!dataSource) {
    return res.status(404).json({ error: '数据源不存在' });
  }
  
  res.json({ data: dataSource });
});

router.post('/', checkPermission('task:create'), (req, res) => {
  const { name, type, connection_config, description } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: '名称和类型不能为空' });
  }
  
  const id = `ds-${uuidv4().substr(0, 8)}`;
  const stmt = db.prepare(`
    INSERT INTO data_sources (id, name, type, connection_config, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, type, JSON.stringify(connection_config || {}), description, req.user.id);
  
  logOperation(req, 'create', 'data_source', id);
  res.json({ data: { id } });
});

router.put('/:id', checkPermission('task:create'), (req, res) => {
  const { name, type, connection_config, description, status } = req.body;
  
  const checkStmt = db.prepare('SELECT * FROM data_sources WHERE id = ?');
  if (!checkStmt.get(req.params.id)) {
    return res.status(404).json({ error: '数据源不存在' });
  }
  
  const stmt = db.prepare(`
    UPDATE data_sources 
    SET name = ?, type = ?, connection_config = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(name, type, JSON.stringify(connection_config || {}), description, status || 'active', req.params.id);
  
  logOperation(req, 'update', 'data_source', req.params.id);
  res.json({ data: { id: req.params.id } });
});

router.delete('/:id', checkPermission('task:create'), (req, res) => {
  const checkStmt = db.prepare('SELECT * FROM data_sources WHERE id = ?');
  if (!checkStmt.get(req.params.id)) {
    return res.status(404).json({ error: '数据源不存在' });
  }
  
  const stmt = db.prepare('DELETE FROM data_sources WHERE id = ?');
  stmt.run(req.params.id);
  
  logOperation(req, 'delete', 'data_source', req.params.id);
  res.json({ data: { success: true } });
});

module.exports = router;
