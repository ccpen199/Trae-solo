const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/requirement/:requirementId', (req, res) => {
  const checks = db.prepare(`
    SELECT * FROM acceptance_checks 
    WHERE requirement_id = ? 
    ORDER BY created_at DESC
  `).all(req.params.requirementId);
  
  res.json(checks);
});

router.post('/', (req, res) => {
  const { requirement_id, check_type, issue_description, responsible_person, due_date } = req.body;
  
  if (!requirement_id || !check_type) {
    return res.status(400).json({ error: '需求ID和检查类型为必填项' });
  }
  
  const result = db.prepare(`
    INSERT INTO acceptance_checks (requirement_id, check_type, issue_description, responsible_person, due_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(requirement_id, check_type, issue_description || null, responsible_person || null, due_date || null);
  
  const check = db.prepare('SELECT * FROM acceptance_checks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(check);
});

router.put('/:id/resolve', (req, res) => {
  const { resolution_notes, resolved_by } = req.body;
  
  db.prepare(`
    UPDATE acceptance_checks SET
      status = 'resolved', resolved_at = CURRENT_TIMESTAMP,
      resolution_notes = ?, resolved_by = ?
    WHERE id = ?
  `).run(resolution_notes || null, resolved_by || null, req.params.id);
  
  const check = db.prepare('SELECT * FROM acceptance_checks WHERE id = ?').get(req.params.id);
  res.json(check);
});

router.put('/:id', (req, res) => {
  const { issue_description, responsible_person, due_date, status } = req.body;
  
  db.prepare(`
    UPDATE acceptance_checks SET
      issue_description = ?, responsible_person = ?, due_date = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(issue_description || null, responsible_person || null, due_date || null, status || 'pending', req.params.id);
  
  const check = db.prepare('SELECT * FROM acceptance_checks WHERE id = ?').get(req.params.id);
  res.json(check);
});

module.exports = router;
