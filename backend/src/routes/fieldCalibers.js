const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { checkPermission, logOperation } = require('../middleware/auth');

router.get('/', checkPermission('task:view'), (req, res) => {
  const { data_source_id, status } = req.query;
  let sql = `
    SELECT fc.*, ds.name as data_source_name 
    FROM field_calibers fc 
    LEFT JOIN data_sources ds ON fc.data_source_id = ds.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (data_source_id) {
    sql += ' AND fc.data_source_id = ?';
    params.push(data_source_id);
  }
  if (status) {
    sql += ' AND fc.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY fc.created_at DESC';
  
  const stmt = db.prepare(sql);
  const calibers = stmt.all(...params);
  
  res.json({ data: calibers });
});

router.get('/:id', checkPermission('task:view'), (req, res) => {
  const stmt = db.prepare(`
    SELECT fc.*, ds.name as data_source_name 
    FROM field_calibers fc 
    LEFT JOIN data_sources ds ON fc.data_source_id = ds.id 
    WHERE fc.id = ?
  `);
  const caliber = stmt.get(req.params.id);
  
  if (!caliber) {
    return res.status(404).json({ error: '字段口径不存在' });
  }
  
  res.json({ data: caliber });
});

router.get('/:id/history', checkPermission('task:view'), (req, res) => {
  const stmt = db.prepare(`
    SELECT * FROM field_caliber_history 
    WHERE field_caliber_id = ? 
    ORDER BY version DESC
  `);
  const history = stmt.all(req.params.id);
  
  res.json({ data: history });
});

router.post('/', checkPermission('task:create'), (req, res) => {
  const { data_source_id, field_name, caliber_definition, data_type, business_meaning, calculation_formula } = req.body;
  
  if (!data_source_id || !field_name || !caliber_definition) {
    return res.status(400).json({ error: '数据源、字段名和口径定义不能为空' });
  }
  
  const id = `fc-${uuidv4().substr(0, 8)}`;
  const stmt = db.prepare(`
    INSERT INTO field_calibers (id, data_source_id, field_name, caliber_definition, data_type, business_meaning, calculation_formula, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data_source_id, field_name, caliber_definition, data_type, business_meaning, calculation_formula, req.user.id);
  
  const histStmt = db.prepare(`
    INSERT INTO field_caliber_history (id, field_caliber_id, field_name, caliber_definition, version, changed_by, change_reason)
    VALUES (?, ?, ?, ?, 1, ?, '初始版本')
  `);
  histStmt.run(`fch-${uuidv4().substr(0, 8)}`, id, field_name, caliber_definition, req.user.id);
  
  logOperation(req, 'create', 'field_caliber', id);
  res.json({ data: { id } });
});

router.put('/:id', checkPermission('task:create'), (req, res) => {
  const { field_name, caliber_definition, data_type, business_meaning, calculation_formula, status, change_reason } = req.body;
  
  const checkStmt = db.prepare('SELECT * FROM field_calibers WHERE id = ?');
  const existing = checkStmt.get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: '字段口径不存在' });
  }
  
  const newVersion = existing.version + 1;
  const stmt = db.prepare(`
    UPDATE field_calibers 
    SET field_name = ?, caliber_definition = ?, data_type = ?, business_meaning = ?, calculation_formula = ?, status = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(field_name, caliber_definition, data_type, business_meaning, calculation_formula, status || 'active', newVersion, req.params.id);
  
  const histStmt = db.prepare(`
    INSERT INTO field_caliber_history (id, field_caliber_id, field_name, caliber_definition, version, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  histStmt.run(`fch-${uuidv4().substr(0, 8)}`, req.params.id, field_name, caliber_definition, newVersion, req.user.id, change_reason || '版本更新');
  
  logOperation(req, 'update', 'field_caliber', req.params.id);
  res.json({ data: { id: req.params.id, version: newVersion } });
});

module.exports = router;
