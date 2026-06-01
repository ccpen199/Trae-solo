const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/reviewers', (req, res) => {
  const reviewers = db.prepare('SELECT * FROM reviewers ORDER BY name').all();
  res.json(reviewers);
});

router.get('/execute', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, o.order_no, o.customer_name,
           rv.name as reviewer_name
    FROM reviews r
    JOIN orders o ON r.order_id = o.id
    LEFT JOIN reviewers rv ON r.reviewer_id = rv.id
    WHERE r.status IN ('in_progress', 'completed') AND r.audit_status = 'pending'
    ORDER BY r.created_at DESC
  `).all();
  res.json(reviews);
});

router.get('/audit', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, o.order_no, o.customer_name,
           rv.name as reviewer_name
    FROM reviews r
    JOIN orders o ON r.order_id = o.id
    LEFT JOIN reviewers rv ON r.reviewer_id = rv.id
    WHERE r.audit_status IN ('pending_audit', 'approved', 'rejected')
    ORDER BY r.created_at DESC
  `).all();
  res.json(reviews);
});

router.get('/', (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, o.order_no, o.customer_name,
           rv.name as reviewer_name
    FROM reviews r
    JOIN orders o ON r.order_id = o.id
    LEFT JOIN reviewers rv ON r.reviewer_id = rv.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(reviews);
});

router.post('/start', (req, res) => {
  const { order_id, reviewer_id } = req.body;
  
  const result = db.prepare(`
    INSERT INTO reviews (order_id, reviewer_id, status, audit_status, created_at)
    VALUES (?, ?, 'in_progress', 'pending', CURRENT_TIMESTAMP)
  `).run(order_id, reviewer_id);
  
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('reviewing', order_id);
  
  res.json({ id: result.lastInsertRowid, success: true });
});

router.post('/:id/complete', (req, res) => {
  const { notes, weight_difference } = req.body;
  
  db.prepare(`
    UPDATE reviews 
    SET status = 'completed', reviewed_at = CURRENT_TIMESTAMP, notes = ?, 
        weight_difference = ?, audit_status = 'pending_audit'
    WHERE id = ?
  `).run(notes || null, weight_difference || 0, req.params.id);
  
  res.json({ success: true });
});

router.post('/:id/approve', (req, res) => {
  const { auditor_id, audit_notes } = req.body;
  
  db.prepare(`
    UPDATE reviews 
    SET audit_status = 'approved', auditor_id = ?, audit_notes = ?, audited_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(auditor_id || null, audit_notes || null, req.params.id);
  
  const review = db.prepare('SELECT order_id FROM reviews WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('reviewed', review.order_id);
  
  res.json({ success: true });
});

router.post('/:id/reject', (req, res) => {
  const { auditor_id, audit_notes } = req.body;
  
  db.prepare(`
    UPDATE reviews 
    SET audit_status = 'rejected', auditor_id = ?, audit_notes = ?, audited_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(auditor_id || null, audit_notes || null, req.params.id);
  
  res.json({ success: true });
});

module.exports = router;
