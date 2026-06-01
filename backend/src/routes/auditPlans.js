const express = require('express');
const { db } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const plans = db.prepare(`
    SELECT ap.*, 
           s.name as supplier_name,
           f.name as factory_name, f.address as factory_address,
           a.name as auditor_name
    FROM audit_plans ap
    JOIN suppliers s ON ap.supplier_id = s.id
    JOIN factories f ON ap.factory_id = f.id
    JOIN auditors a ON ap.auditor_id = a.id
    ORDER BY ap.audit_date DESC, ap.start_time DESC
  `).all();
  res.json(plans);
});

router.get('/:id', (req, res) => {
  const plan = db.prepare(`
    SELECT ap.*, 
           s.name as supplier_name,
           f.name as factory_name, f.address as factory_address,
           a.name as auditor_name
    FROM audit_plans ap
    JOIN suppliers s ON ap.supplier_id = s.id
    JOIN factories f ON ap.factory_id = f.id
    JOIN auditors a ON ap.auditor_id = a.id
    WHERE ap.id = ?
  `).get(req.params.id);
  
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  res.json(plan);
});

router.post('/check-conflict', (req, res) => {
  const { auditor_id, audit_date, start_time, end_time, exclude_id } = req.body;
  
  let sql = `
    SELECT COUNT(*) as count FROM audit_plans 
    WHERE auditor_id = ? AND audit_date = ? 
    AND ((start_time <= ? AND end_time > ?) 
         OR (start_time < ? AND end_time >= ?)
         OR (start_time >= ? AND end_time <= ?))
  `;
  const params = [auditor_id, audit_date, start_time, start_time, end_time, end_time, start_time, end_time];
  
  if (exclude_id) {
    sql += ' AND id != ?';
    params.push(exclude_id);
  }
  
  const result = db.prepare(sql).get(...params);
  res.json({ hasConflict: result.count > 0 });
});

router.post('/', (req, res) => {
  const { supplier_id, factory_id, audit_type, auditor_id, audit_date, start_time, end_time, standards, notes } = req.body;
  
  const conflictCheck = db.prepare(`
    SELECT COUNT(*) as count FROM audit_plans 
    WHERE auditor_id = ? AND audit_date = ? 
    AND ((start_time <= ? AND end_time > ?) 
         OR (start_time < ? AND end_time >= ?)
         OR (start_time >= ? AND end_time <= ?))
  `).get(auditor_id, audit_date, start_time, start_time, end_time, end_time, start_time, end_time);
  
  if (conflictCheck.count > 0) {
    return res.status(400).json({ error: '该审核员此时间段已有安排，请重新选择时间或审核员' });
  }
  
  const result = db.prepare(
    'INSERT INTO audit_plans (supplier_id, factory_id, audit_type, auditor_id, audit_date, start_time, end_time, standards, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(supplier_id, factory_id, audit_type, auditor_id, audit_date, start_time, end_time, standards, notes);
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/:id', (req, res) => {
  const { supplier_id, factory_id, audit_type, auditor_id, audit_date, start_time, end_time, standards, notes, status } = req.body;
  
  const conflictCheck = db.prepare(`
    SELECT COUNT(*) as count FROM audit_plans 
    WHERE auditor_id = ? AND audit_date = ? 
    AND ((start_time <= ? AND end_time > ?) 
         OR (start_time < ? AND end_time >= ?)
         OR (start_time >= ? AND end_time <= ?))
    AND id != ?
  `).get(auditor_id, audit_date, start_time, start_time, end_time, end_time, start_time, end_time, req.params.id);
  
  if (conflictCheck.count > 0) {
    return res.status(400).json({ error: '该审核员此时间段已有安排，请重新选择时间或审核员' });
  }
  
  db.prepare(
    'UPDATE audit_plans SET supplier_id=?, factory_id=?, audit_type=?, auditor_id=?, audit_date=?, start_time=?, end_time=?, standards=?, notes=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(supplier_id, factory_id, audit_type, auditor_id, audit_date, start_time, end_time, standards, notes, status || 'scheduled', req.params.id);
  
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM audit_plans WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
