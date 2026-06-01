const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { createAuditLog } = require('../utils/audit');
const { checkPermission } = require('../middleware/auth');

router.get('/', checkPermission('env:read'), (req, res) => {
  const { app_id, type, status } = req.query;
  
  let query = `
    SELECT e.*, a.name as app_name, u.real_name as creator_name
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
  if (type) {
    query += ' AND e.type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY e.created_at DESC';
  const envs = db.prepare(query).all(...params);
  
  res.json({ data: envs });
});

router.post('/', checkPermission('env:write'), (req, res) => {
  const { app_id, name, type, base_url, status, config } = req.body;
  
  if (!app_id || !name || !type) {
    return res.status(400).json({ error: '应用ID、环境名称和类型不能为空' });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO environments (app_id, name, type, base_url, status, config, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(app_id, name, type, base_url || '', status || 'active', JSON.stringify(config || {}), req.user.id);
    
    createAuditLog(req.user.id, 'create', 'environment', result.lastInsertRowid, null, req.body, req.ip, req.get('User-Agent'));
    
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', checkPermission('env:write'), (req, res) => {
  const oldEnv = db.prepare('SELECT * FROM environments WHERE id = ?').get(req.params.id);
  if (!oldEnv) {
    return res.status(404).json({ error: '环境不存在' });
  }
  
  try {
    db.prepare(`
      UPDATE environments
      SET name = ?, type = ?, base_url = ?, status = ?, config = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.body.name, req.body.type, req.body.base_url || '', req.body.status || 'active', JSON.stringify(req.body.config || {}), req.params.id);
    
    createAuditLog(req.user.id, 'update', 'environment', req.params.id, oldEnv, req.body, req.ip, req.get('User-Agent'));
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', checkPermission('env:delete'), (req, res) => {
  const oldEnv = db.prepare('SELECT * FROM environments WHERE id = ?').get(req.params.id);
  if (!oldEnv) {
    return res.status(404).json({ error: '环境不存在' });
  }
  
  try {
    db.prepare('DELETE FROM environments WHERE id = ?').run(req.params.id);
    createAuditLog(req.user.id, 'delete', 'environment', req.params.id, oldEnv, null, req.ip, req.get('User-Agent'));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
