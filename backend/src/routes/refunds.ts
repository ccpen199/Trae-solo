import express from 'express';
import db from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  const refunds = db.prepare(`
    SELECT r.*, rr.platform_order_id, rr.sku, rr.status as request_status
    FROM refunds r
    JOIN return_requests rr ON r.return_request_id = rr.id
    ORDER BY r.created_at DESC
  `).all();
  
  res.json(refunds);
});

router.post('/:id/approve-seller', (req, res) => {
  const { approved_by, notes } = req.body;
  
  db.prepare(`
    UPDATE refunds 
    SET seller_approved = 1, 
        seller_approved_by = ?,
        seller_approved_at = CURRENT_TIMESTAMP,
        seller_notes = ?,
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(approved_by || '系统操作员', notes || null, req.params.id);
  
  const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(req.params.id);
  
  if ((refund as any).seller_approved && (refund as any).warehouse_processed) {
    db.prepare(`
      UPDATE refunds 
      SET platform_refund_status = 'processing', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id);
    
    db.prepare('UPDATE return_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('refunding', (refund as any).return_request_id);
  }
  
  const updated = db.prepare('SELECT * FROM refunds WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/complete-platform', (req, res) => {
  const { refund_date, platform_refund_id, platform_refund_channel, 
          platform_refund_amount, platform_fee, actual_refund_amount } = req.body;
  
  db.prepare(`
    UPDATE refunds 
    SET platform_refund_status = 'completed', 
        refund_date = ?,
        platform_refund_id = ?,
        platform_refund_channel = ?,
        platform_refund_amount = ?,
        platform_fee = ?,
        platform_refund_at = CURRENT_TIMESTAMP,
        actual_refund_amount = ?,
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(
    refund_date || new Date().toISOString(),
    platform_refund_id || null,
    platform_refund_channel || null,
    platform_refund_amount || null,
    platform_fee || null,
    actual_refund_amount || null,
    req.params.id
  );
  
  const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(req.params.id);
  
  db.prepare('UPDATE return_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('completed', (refund as any).return_request_id);
  
  const updated = db.prepare('SELECT * FROM refunds WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.get('/reports', (req, res) => {
  const { start_date, end_date } = req.query;
  
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM return_requests
    GROUP BY status
  `).all();
  
  const totalRefunds = db.prepare(`
    SELECT SUM(refund_amount) as total
    FROM refunds
    WHERE platform_refund_status = 'completed'
  `).get();
  
  const reasonCounts = db.prepare(`
    SELECT return_reason, COUNT(*) as count
    FROM return_requests
    GROUP BY return_reason
    ORDER BY count DESC
  `).all();
  
  const responsiblePartyCosts = db.prepare(`
    SELECT responsible_party, SUM(cost_amount) as total_cost, COUNT(*) as count
    FROM responsibility_attributions
    GROUP BY responsible_party
  `).all();
  
  res.json({
    status_counts: statusCounts,
    total_refunds_completed: (totalRefunds as any).total || 0,
    reason_distribution: reasonCounts,
    responsibility_costs: responsiblePartyCosts
  });
});

router.get('/reports/details', (req, res) => {
  const { status, reason, start_date, end_date, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  
  let query = `
    SELECT r.*, rr.platform_order_id, rr.sku, rr.return_reason, 
           i.condition_level, d.decision_type, d.responsible_party
    FROM refunds r
    JOIN return_requests rr ON r.return_request_id = rr.id
    LEFT JOIN warehouse_inspections i ON i.return_request_id = r.return_request_id
    LEFT JOIN processing_decisions d ON d.return_request_id = r.return_request_id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (status) {
    query += ' AND rr.status = ?';
    params.push(status);
  }
  if (reason) {
    query += ' AND rr.return_reason = ?';
    params.push(reason);
  }
  
  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);
  
  const details = db.prepare(query).all(...params);
  
  res.json({ data: details });
});

export default router;
