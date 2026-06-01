import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const settlements = db.prepare(`
    SELECT ss.*, s.name as supplier_name 
    FROM supplier_settlements ss 
    LEFT JOIN suppliers s ON ss.supplier_id = s.id 
    ORDER BY ss.created_at DESC
  `).all();
  res.json(settlements);
});

router.post('/', (req, res) => {
  const { supplier_id, settlement_month, linen_category, washing_quantity, unit_price, remarks } = req.body;
  const total_amount = washing_quantity * unit_price;
  try {
    const stmt = db.prepare(`
      INSERT INTO supplier_settlements (supplier_id, settlement_month, linen_category, washing_quantity, unit_price, total_amount, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(supplier_id, settlement_month, linen_category, washing_quantity, unit_price, total_amount, remarks);
    res.json({ id: result.lastInsertRowid, ...req.body, total_amount, status: 'pending' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/pay', (req, res) => {
  const { payment_date } = req.body;
  const stmt = db.prepare(`
    UPDATE supplier_settlements SET status='paid', payment_date=? WHERE id=?
  `);
  const result = stmt.run(payment_date, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Settlement not found' });
  }
  res.json({ message: 'Settlement paid' });
});

router.get('/calculate/:supplier_id/:month', (req, res) => {
  const { supplier_id, month } = req.params;
  const records = db.prepare(`
    SELECT linen_category, SUM(return_quantity) as total_quantity
    FROM washing_records 
    WHERE supplier_id = ? AND strftime('%Y-%m', return_date) = ? AND status IN ('completed', 'partial')
    GROUP BY linen_category
  `).all(supplier_id, month);
  res.json(records);
});

export default router;
