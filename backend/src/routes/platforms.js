const express = require('express');
const router = express.Router();
const db = require('../db/database');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM platforms';
  const params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY id';
  const platforms = db.prepare(query).all(...params).map(p => ({
    ...p,
    completion_rate: Number(Math.max(0, Math.min(1, 1 - (p.loss_rate * 2 + p.complaint_rate))).toFixed(4))
  }));
  res.json({ success: true, data: platforms });
});

router.get('/stats', (req, res) => {
  const platforms = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM orders o WHERE o.platform_id = p.id AND o.status != 'cancelled') as total_orders,
      (SELECT COUNT(*) FROM orders o WHERE o.platform_id = p.id AND o.delivery_status = 'delivered') as delivered_orders,
      (SELECT COUNT(*) FROM compensations c LEFT JOIN orders o ON c.order_id = o.id WHERE o.platform_id = p.id) as compensation_count,
      (SELECT COALESCE(SUM(c.amount), 0) FROM compensations c LEFT JOIN orders o ON c.order_id = o.id WHERE o.platform_id = p.id) as compensation_amount,
      (SELECT AVG(CASE WHEN o.delivered_at IS NOT NULL AND o.estimated_arrival_time IS NOT NULL 
        THEN CASE WHEN julianday(o.delivered_at) <= julianday(o.estimated_arrival_time) THEN 1 ELSE 0 END
        ELSE NULL END) FROM orders o WHERE o.platform_id = p.id) as actual_on_time_rate
    FROM platforms p
    ORDER BY p.id
  `).all();

  const stats = platforms.map(p => ({
    ...p,
    total_orders: p.total_orders || 0,
    delivered_orders: p.delivered_orders || 0,
    compensation_count: p.compensation_count || 0,
    compensation_amount: p.compensation_amount || 0,
    actual_on_time_rate: p.actual_on_time_rate || p.on_time_rate,
    completion_rate: p.total_orders
      ? Number((p.delivered_orders / p.total_orders).toFixed(4))
      : Number(Math.max(0, Math.min(1, 1 - (p.loss_rate * 2 + p.complaint_rate))).toFixed(4))
  }));

  res.json({ success: true, data: stats });
});

router.get('/:id', (req, res) => {
  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
  if (!platform) {
    return res.status(404).json({ success: false, message: '平台不存在' });
  }
  res.json({ success: true, data: platform });
});

router.post('/', (req, res) => {
  const { code, name, base_price, per_km_price, per_kg_price, 
          min_delivery_time, max_delivery_time, commission_rate, status } = req.body;
  
  try {
    const result = db.prepare(`
      INSERT INTO platforms (code, name, base_price, per_km_price, per_kg_price,
        min_delivery_time, max_delivery_time, commission_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(code, name, base_price || 0, per_km_price || 0, per_kg_price || 0,
           min_delivery_time || 30, max_delivery_time || 120, commission_rate || 0.05, status || 'active');
    
    const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: platform });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
  if (!platform) {
    return res.status(404).json({ success: false, message: '平台不存在' });
  }

  const fields = ['name', 'base_price', 'per_km_price', 'per_kg_price', 
                  'min_delivery_time', 'max_delivery_time', 'capacity_saturation',
                  'on_time_rate', 'loss_rate', 'complaint_rate', 'commission_rate', 'status'];
  
  const updates = [];
  const values = [];
  
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }
  
  if (updates.length > 0) {
    updates.push('updated_at = ?');
    values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    values.push(req.params.id);
    
    db.prepare(`UPDATE platforms SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  
  const updated = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.patch('/:id/capacity', (req, res) => {
  const { capacity_saturation } = req.body;
  db.prepare('UPDATE platforms SET capacity_saturation = ?, updated_at = ? WHERE id = ?')
    .run(capacity_saturation, dayjs().format('YYYY-MM-DD HH:mm:ss'), req.params.id);
  
  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: platform });
});

module.exports = router;
