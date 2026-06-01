import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  const records = db.prepare(`
    SELECT wr.*, s.name as supplier_name 
    FROM washing_records wr 
    LEFT JOIN suppliers s ON wr.supplier_id = s.id 
    ORDER BY wr.created_at DESC
  `).all();
  res.json(records);
});

router.post('/', (req, res) => {
  const { supplier_id, send_date, linen_category, send_quantity, operator, remarks } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO washing_records (supplier_id, send_date, linen_category, send_quantity, operator, remarks, status)
      VALUES (?, ?, ?, ?, ?, ?, 'in_wash')
    `);
    const result = stmt.run(supplier_id, send_date, linen_category, send_quantity, operator, remarks);
    
    const logStmt = db.prepare(`
      INSERT INTO inventory_logs (linen_category, change_type, quantity, reference_type, reference_id, operator, remarks)
      VALUES (?, 'send_to_wash', -?, 'washing', ?, ?, ?)
    `);
    logStmt.run(linen_category, send_quantity, result.lastInsertRowid, operator, remarks);
    
    res.json({ id: result.lastInsertRowid, ...req.body, status: 'in_wash' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id/return', (req, res) => {
  const { return_date, return_quantity, washing_quality, rewash_reason, operator } = req.body;
  const sendRecord = db.prepare('SELECT * FROM washing_records WHERE id=?').get(req.params.id);
  if (!sendRecord) {
    return res.status(404).json({ error: 'Washing record not found' });
  }
  
  const status = return_quantity < sendRecord.send_quantity ? 'partial' : 'completed';
  
  const stmt = db.prepare(`
    UPDATE washing_records 
    SET return_date=?, return_quantity=?, washing_quality=?, rewash_reason=?, status=?
    WHERE id=?
  `);
  stmt.run(return_date, return_quantity, washing_quality, rewash_reason, status, req.params.id);
  
  const logStmt = db.prepare(`
    INSERT INTO inventory_logs (linen_category, change_type, quantity, reference_type, reference_id, operator, remarks)
    VALUES (?, 'return_from_wash', ?, 'washing', ?, ?, ?)
  `);
  logStmt.run(sendRecord.linen_category, return_quantity, req.params.id, operator, rewash_reason || '');
  
  res.json({ id: req.params.id, return_date, return_quantity, washing_quality, rewash_reason, status });
});

export default router;
