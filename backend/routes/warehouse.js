const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

router.post('/receive', (req, res) => {
  const { shipment_id, actual_pieces, actual_weight, actual_length, actual_width, actual_height, dimension_photo, weight_photo, exception_photo, exception_note, received_by } = req.body;
  
  if (!shipment_id) {
    return res.status(400).json({ error: 'Shipment ID is required' });
  }
  
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipment_id);
  if (!shipment) {
    return res.status(404).json({ error: 'Shipment not found' });
  }
  
  const pieces_diff = actual_pieces !== undefined && actual_pieces !== shipment.pieces;
  const weight_diff = actual_weight !== undefined && actual_weight !== shipment.weight;
  const has_exception = pieces_diff || weight_diff || exception_note;
  
  const result = db.prepare(`
    INSERT INTO warehouse_receipts (
      shipment_id, actual_pieces, actual_weight, actual_length, actual_width, actual_height,
      dimension_photo, weight_photo, exception_photo, exception_note, received_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    shipment_id, actual_pieces, actual_weight, actual_length, actual_width, actual_height,
    dimension_photo, weight_photo, exception_photo, exception_note, received_by || 'warehouse'
  );
  
  const newStatus = has_exception ? 'warehouse_exception' : 'warehouse_received';
  db.prepare('UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, shipment_id);
  
  db.prepare('INSERT INTO operations_log (shipment_id, operation, operator) VALUES (?, ?, ?)')
    .run(shipment_id, 'warehouse_receive', received_by || 'warehouse');
  
  const receipt = db.prepare('SELECT * FROM warehouse_receipts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ receipt, has_exception, pieces_diff, weight_diff });
});

router.get('/:shipment_id', (req, res) => {
  const receipts = db.prepare('SELECT * FROM warehouse_receipts WHERE shipment_id = ? ORDER BY received_at DESC').all(req.params.shipment_id);
  res.json(receipts);
});

module.exports = router;
