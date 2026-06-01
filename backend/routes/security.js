const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

router.post('/check', (req, res) => {
  const { shipment_id, check_result, check_note, checked_by, xray_photo } = req.body;
  
  if (!shipment_id || !check_result || !checked_by) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipment_id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const result = db.prepare(`
    INSERT INTO security_checks (shipment_id, check_result, check_note, checked_by, xray_photo)
    VALUES (?, ?, ?, ?, ?)
  `).run(shipment_id, check_result, check_note, checked_by, xray_photo);
  
  const newStatus = check_result === 'pass' ? 'security_passed' : 'security_failed';
  db.prepare('UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, shipment_id);
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(shipment_id, 'security_check:' + check_result, checked_by);
  
  const check = db.prepare('SELECT * FROM security_checks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(check);
});

router.get('/:shipment_id', (req, res) => {
  const checks = db.prepare('SELECT * FROM security_checks WHERE shipment_id = ? ORDER BY checked_at DESC').all(req.params.shipment_id);
  res.json(checks);
});

module.exports = router;
