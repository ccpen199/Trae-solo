import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const collections = db.prepare('SELECT * FROM linen_collections ORDER BY created_at DESC').all();
  res.json(collections);
});

router.get('/discrepancies', (req, res) => {
  const discrepancies = db.prepare('SELECT * FROM linen_collections WHERE has_discrepancy = 1 ORDER BY created_at DESC').all();
  res.json(discrepancies);
});

router.post('/', (req, res) => {
  const { collection_date, floor, room_number, linen_category, quantity, damage_condition, operator, remarks, expected_quantity } = req.body;
  
  const has_discrepancy = expected_quantity && quantity !== parseInt(expected_quantity) ? 1 : 0;
  const discrepancy_note = has_discrepancy ? `预期 ${expected_quantity}，实际 ${quantity}` : null;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO linen_collections (collection_date, floor, room_number, linen_category, quantity, damage_condition, operator, remarks, has_discrepancy, discrepancy_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(collection_date, floor, room_number, linen_category, quantity, damage_condition, operator, remarks, has_discrepancy, discrepancy_note);
    
    const logStmt = db.prepare(`
      INSERT INTO inventory_logs (linen_category, change_type, quantity, reference_type, reference_id, operator, remarks)
      VALUES (?, 'collect', ?, 'collection', ?, ?, ?)
    `);
    logStmt.run(linen_category, quantity, result.lastInsertRowid, operator, remarks);
    
    res.json({ id: result.lastInsertRowid, ...req.body, has_discrepancy, discrepancy_note });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/resolve', (req, res) => {
  const { resolution_note, operator } = req.body;
  const stmt = db.prepare('UPDATE linen_collections SET has_discrepancy = 0, discrepancy_note = ? WHERE id = ?');
  const result = stmt.run(`已解决: ${resolution_note}`, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json({ message: 'Discrepancy resolved' });
});

export default router;
