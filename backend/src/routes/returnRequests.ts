import express from 'express';
import db from '../db';

const router = express.Router();

const RETURN_POLICY_THRESHOLD = 500;

router.get('/', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  let query = 'SELECT * FROM return_requests';
  const params: any[] = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);
  
  const requests = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM return_requests' + 
    (status ? ' WHERE status = ?' : '')).get(status ? [status] : []);
  
  res.json({ data: requests, total: (total as any).count });
});

router.get('/:id', (req, res) => {
  const request = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Return request not found' });
  }
  
  const inspection = db.prepare('SELECT * FROM warehouse_inspections WHERE return_request_id = ?').get(req.params.id);
  const decision = db.prepare('SELECT * FROM processing_decisions WHERE return_request_id = ?').get(req.params.id);
  const refund = db.prepare('SELECT * FROM refunds WHERE return_request_id = ?').get(req.params.id);
  
  res.json({ request, inspection, decision, refund });
});

router.post('/', (req, res) => {
  const { platform_order_id, sku, return_reason, buyer_description, images, tracking_number, refund_amount } = req.body;
  
  const needs_manual_review = refund_amount > RETURN_POLICY_THRESHOLD || 
    ['damaged', 'wrong_item'].includes(return_reason.toLowerCase());
  const status = needs_manual_review ? 'pending_review' : 'pending_warehouse';
  
  const stmt = db.prepare(`
    INSERT INTO return_requests 
    (platform_order_id, sku, return_reason, buyer_description, images, tracking_number, refund_amount, status, needs_manual_review)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(platform_order_id, sku, return_reason, buyer_description, images ? JSON.stringify(images) : null, tracking_number, refund_amount, status, needs_manual_review ? 1 : 0);
  
  db.prepare(`
    INSERT INTO refunds (return_request_id, refund_amount)
    VALUES (?, ?)
  `).run(result.lastInsertRowid, refund_amount);
  
  const newRequest = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newRequest);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE return_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, req.params.id);
  
  const updated = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/approve', (req, res) => {
  db.prepare('UPDATE return_requests SET status = ?, updated_at = CURRENT_TIMESTAMP, needs_manual_review = 0 WHERE id = ?')
    .run('pending_warehouse', req.params.id);
  
  const updated = db.prepare('SELECT * FROM return_requests WHERE id = ?').get(req.params.id);
  res.json(updated);
});

export default router;
