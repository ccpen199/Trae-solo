import express from 'express';
import db from '../db';

const router = express.Router();

router.post('/inspect', (req, res) => {
  const { return_request_id, sku_verified, quantity, condition_level, 
          has_damage, has_wrong_item, has_missing_parts, inspector_notes } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO warehouse_inspections 
    (return_request_id, sku_verified, quantity, condition_level, 
     has_damage, has_wrong_item, has_missing_parts, inspector_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(return_request_id, sku_verified ? 1 : 0, quantity, 
    condition_level, has_damage ? 1 : 0, has_wrong_item ? 1 : 0, has_missing_parts ? 1 : 0, inspector_notes);
  
  const hasException = has_wrong_item || has_missing_parts || has_damage;
  const newStatus = hasException ? 'exception' : 'pending_processing';
  
  db.prepare('UPDATE return_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, return_request_id);
  
  db.prepare('UPDATE refunds SET warehouse_processed = 1, updated_at = CURRENT_TIMESTAMP WHERE return_request_id = ?')
    .run(return_request_id);
  
  if (has_wrong_item) {
    db.prepare(`
      INSERT INTO exception_orders (inspection_id, exception_type, description)
      VALUES (?, 'wrong_item', ?)
    `).run(result.lastInsertRowid, 'SKU不匹配或收到错误商品');
  }
  if (has_missing_parts) {
    db.prepare(`
      INSERT INTO exception_orders (inspection_id, exception_type, description)
      VALUES (?, 'missing_parts', ?)
    `).run(result.lastInsertRowid, '商品缺少配件或数量不足');
  }
  if (has_damage) {
    db.prepare(`
      INSERT INTO exception_orders (inspection_id, exception_type, description)
      VALUES (?, 'damaged', ?)
    `).run(result.lastInsertRowid, '商品有明显外观损坏');
  }
  
  const inspection = db.prepare('SELECT * FROM warehouse_inspections WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(inspection);
});

router.get('/exceptions', (req, res) => {
  const exceptions = db.prepare(`
    SELECT e.*, i.tracking_number, r.platform_order_id, r.sku
    FROM exception_orders e
    JOIN warehouse_inspections i ON e.inspection_id = i.id
    JOIN return_requests r ON i.return_request_id = r.id
    ORDER BY e.created_at DESC
  `).all();
  
  res.json(exceptions);
});

router.patch('/exceptions/:id/resolve', (req, res) => {
  db.prepare('UPDATE exception_orders SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('resolved', req.params.id);
  
  const exception = db.prepare('SELECT * FROM exception_orders WHERE id = ?').get(req.params.id);
  res.json(exception);
});

export default router;
