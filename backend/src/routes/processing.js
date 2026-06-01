const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:orderId', (req, res) => {
  const records = db.prepare(`
    SELECT * FROM processing_records
    WHERE order_id = ?
    ORDER BY created_at ASC
  `).all(req.params.orderId);

  res.json({ data: records });
});

router.post('/:orderId', (req, res) => {
  const { status, processor, notes } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const validStatuses = ['ordered', 'lens_arrived', 'processing', 'quality_check', 'ready', 'completed', 'cancelled', 'delayed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的加工状态' });
  }

  db.prepare(`
    UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, req.params.orderId);

  const result = db.prepare(`
    INSERT INTO processing_records (order_id, status, processor, notes)
    VALUES (?, ?, ?, ?)
  `).run(req.params.orderId, status, processor || null, notes || null);

  const record = db.prepare('SELECT * FROM processing_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(record);
});

router.get('/dashboard/overview', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN status = 'ordered' THEN 1 ELSE 0 END), 0) as ordered,
      COALESCE(SUM(CASE WHEN status = 'lens_arrived' THEN 1 ELSE 0 END), 0) as lens_arrived,
      COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0) as processing,
      COALESCE(SUM(CASE WHEN status = 'quality_check' THEN 1 ELSE 0 END), 0) as quality_check,
      COALESCE(SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END), 0) as ready,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed
    FROM orders
  `).get();

  const today = new Date().toISOString().split('T')[0];
  const delayed = db.prepare(`
    SELECT COUNT(*) as count
    FROM orders
    WHERE status NOT IN ('completed', 'cancelled')
      AND delivery_date < ?
  `).get(today);

  res.json({ ...stats, delayed: delayed.count });
});

module.exports = router;
