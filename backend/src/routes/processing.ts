import express from 'express';
import db from '../db';

const router = express.Router();

router.post('/decision', (req, res) => {
  const { return_request_id, decision_type, processing_cost, responsible_party, notes, decided_by } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO processing_decisions 
    (return_request_id, decision_type, processing_cost, responsible_party, notes, decided_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(return_request_id, decision_type, processing_cost, responsible_party, notes, decided_by);
  
  db.prepare(`
    INSERT INTO responsibility_attributions (return_request_id, responsible_party, attribution_reason, cost_amount, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(return_request_id, responsible_party, `处理决策: ${decision_type}`, processing_cost, notes);
  
  let newStatus = 'processing';
  
  if (decision_type === 'restock') {
    const inspection = db.prepare('SELECT * FROM warehouse_inspections WHERE return_request_id = ?').get(return_request_id);
    if (inspection) {
      const request = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(return_request_id);
      db.prepare(`
        INSERT INTO inventory_restocks (return_request_id, sku, quantity, condition_level, location)
        VALUES (?, ?, ?, ?, ?)
      `).run(return_request_id, (request as any).sku, (inspection as any).quantity, (inspection as any).condition_level, 'A1-01');
    }
    newStatus = 'restocked';
  } else if (decision_type === 'destroy') {
    newStatus = 'destroyed';
  } else if (decision_type === 'return_to_supplier') {
    newStatus = 'returning_to_supplier';
  }
  
  db.prepare('UPDATE return_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, return_request_id);
  
  const decision = db.prepare('SELECT * FROM processing_decisions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(decision);
});

router.get('/decisions', (req, res) => {
  const decisions = db.prepare(`
    SELECT d.*, r.platform_order_id, r.sku
    FROM processing_decisions d
    JOIN return_requests r ON d.return_request_id = r.id
    ORDER BY d.created_at DESC
  `).all();
  
  res.json(decisions);
});

router.get('/restocks', (req, res) => {
  const restocks = db.prepare(`
    SELECT r.*, rr.platform_order_id
    FROM inventory_restocks r
    JOIN return_requests rr ON r.return_request_id = rr.id
    ORDER BY r.restock_date DESC
  `).all();
  
  res.json(restocks);
});

export default router;
