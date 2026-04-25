const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const alerts = db.prepare(`
    SELECT a.*, c.name as competitor_name
    FROM alerts a
    JOIN competitors c ON a.competitor_id = c.id
    ORDER BY a.created_at DESC
  `).all();
  res.json(alerts);
});

router.get('/unread', (req, res) => {
  const unreadAlerts = db.prepare(`
    SELECT a.*, c.name as competitor_name
    FROM alerts a
    JOIN competitors c ON a.competitor_id = c.id
    WHERE a.is_read = 0
    ORDER BY a.created_at DESC
  `).all();
  res.json(unreadAlerts);
});

router.post('/', (req, res) => {
  const { competitor_id, type, message } = req.body;
  
  if (!competitor_id || !type || !message) {
    return res.status(400).json({ error: 'Competitor ID, type, and message are required' });
  }
  
  const competitor = db.prepare(`
    SELECT * FROM competitors WHERE id = ?
  `).get(competitor_id);
  
  if (!competitor) {
    return res.status(404).json({ error: 'Competitor not found' });
  }
  
  const result = db.prepare(`
    INSERT INTO alerts (competitor_id, type, message)
    VALUES (?, ?, ?)
  `).run(competitor_id, type, message);
  
  const newAlert = db.prepare(`
    SELECT a.*, c.name as competitor_name
    FROM alerts a
    JOIN competitors c ON a.competitor_id = c.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);
  
  res.status(201).json(newAlert);
});

router.put('/:id/read', (req, res) => {
  const alert = db.prepare(`
    SELECT * FROM alerts WHERE id = ?
  `).get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  db.prepare(`
    UPDATE alerts SET is_read = 1 WHERE id = ?
  `).run(req.params.id);
  
  const updatedAlert = db.prepare(`
    SELECT a.*, c.name as competitor_name
    FROM alerts a
    JOIN competitors c ON a.competitor_id = c.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  res.json(updatedAlert);
});

router.put('/read-all', (req, res) => {
  db.prepare(`
    UPDATE alerts SET is_read = 1 WHERE is_read = 0
  `).run();
  
  res.json({ message: 'All alerts marked as read' });
});

router.delete('/:id', (req, res) => {
  const alert = db.prepare(`
    SELECT * FROM alerts WHERE id = ?
  `).get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  db.prepare(`
    DELETE FROM alerts WHERE id = ?
  `).run(req.params.id);
  
  res.json({ message: 'Alert deleted successfully' });
});

module.exports = router;
