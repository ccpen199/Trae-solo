const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/requirement/:requirementId', (req, res) => {
  const progress = db.prepare(`
    SELECT * FROM processing_progress 
    WHERE requirement_id = ? 
    ORDER BY step_order
  `).all(req.params.requirementId);
  
  res.json(progress);
});

router.put('/:id/start', (req, res) => {
  const { assigned_to } = req.body;
  
  db.prepare(`
    UPDATE processing_progress SET
      status = 'in_progress', assigned_to = ?, started_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(assigned_to || null, req.params.id);
  
  const progress = db.prepare('SELECT * FROM processing_progress WHERE id = ?').get(req.params.id);
  res.json(progress);
});

router.put('/:id/complete', (req, res) => {
  const { notes, customer_notification } = req.body;
  
  db.prepare(`
    UPDATE processing_progress SET
      status = 'completed', completed_at = CURRENT_TIMESTAMP,
      notes = ?, customer_notification = ?, notified_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(notes || null, customer_notification || null, req.params.id);
  
  const progress = db.prepare('SELECT * FROM processing_progress WHERE id = ?').get(req.params.id);
  res.json(progress);
});

router.put('/:id/notify', (req, res) => {
  const { customer_notification } = req.body;
  
  db.prepare(`
    UPDATE processing_progress SET
      customer_notification = ?, notified_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(customer_notification || null, req.params.id);
  
  const progress = db.prepare('SELECT * FROM processing_progress WHERE id = ?').get(req.params.id);
  res.json(progress);
});

module.exports = router;
