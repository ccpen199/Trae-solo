import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const distributions = db.prepare('SELECT * FROM linen_distributions ORDER BY created_at DESC').all();
  res.json(distributions);
});

router.post('/', (req, res) => {
  const { distribution_date, floor, room_number, linen_category, quantity, operator, remarks } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO linen_distributions (distribution_date, floor, room_number, linen_category, quantity, operator, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(distribution_date, floor, room_number, linen_category, quantity, operator, remarks);
    
    const logStmt = db.prepare(`
      INSERT INTO inventory_logs (linen_category, change_type, quantity, reference_type, reference_id, operator, remarks)
      VALUES (?, 'distribute', ?, 'distribution', ?, ?, ?)
    `);
    logStmt.run(linen_category, -quantity, result.lastInsertRowid, operator, remarks);
    
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
