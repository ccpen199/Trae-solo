const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const { room_type_id, status } = req.query;
  let query = `
    SELECT ps.*, rt.name as room_name, h.name as hotel_name
    FROM price_strategies ps
    LEFT JOIN room_types rt ON ps.room_type_id = rt.id
    LEFT JOIN hotels h ON rt.hotel_id = h.id
    WHERE 1=1
  `;
  const params = [];
  
  if (room_type_id) {
    query += ' AND ps.room_type_id = ?';
    params.push(room_type_id);
  }
  if (status) {
    query += ' AND ps.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY ps.updated_at DESC';
  
  const strategies = db.prepare(query).all(...params);
  res.json({ data: strategies });
});

router.post('/', (req, res) => {
  const { room_type_id, target_price_difference, target_difference_percent, promotion_suggestion, alert_threshold, alert_threshold_percent } = req.body;
  
  const result = db.prepare(`
    INSERT INTO price_strategies 
    (room_type_id, target_price_difference, target_difference_percent, promotion_suggestion, alert_threshold, alert_threshold_percent)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(room_type_id, target_price_difference || 0, target_difference_percent || null, promotion_suggestion || null, alert_threshold || 10, alert_threshold_percent || 5);
  
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { target_price_difference, target_difference_percent, promotion_suggestion, alert_threshold, alert_threshold_percent } = req.body;
  
  db.prepare(`
    UPDATE price_strategies 
    SET target_price_difference = ?, target_difference_percent = ?, promotion_suggestion = ?, 
        alert_threshold = ?, alert_threshold_percent = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(target_price_difference || 0, target_difference_percent || null, promotion_suggestion || null, alert_threshold || 10, alert_threshold_percent || 5, req.params.id);
  
  res.json({ success: true });
});

router.post('/:id/confirm', (req, res) => {
  const { confirmed_by } = req.body;
  
  db.prepare(`
    UPDATE price_strategies 
    SET status = 'confirmed', confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(confirmed_by || 'system', req.params.id);
  
  res.json({ success: true });
});

router.get('/tasks', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT pat.*, ps.target_price_difference, rt.name as room_name, h.name as hotel_name
    FROM price_adjustment_tasks pat
    LEFT JOIN price_strategies ps ON pat.strategy_id = ps.id
    LEFT JOIN room_types rt ON pat.room_type_id = rt.id
    LEFT JOIN hotels h ON rt.hotel_id = h.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND pat.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY pat.created_at DESC';
  
  const tasks = db.prepare(query).all(...params);
  res.json({ data: tasks });
});

router.post('/tasks/generate', (req, res) => {
  const { checkin_date } = req.body;
  const date = checkin_date || new Date().toISOString().split('T')[0];
  
  const inverted = db.prepare(`
    SELECT cr.*, ps.target_price_difference, ps.promotion_suggestion, ps.alert_threshold
    FROM comparison_results cr
    LEFT JOIN price_strategies ps ON cr.room_type_id = ps.room_type_id
    WHERE cr.checkin_date = ? AND cr.is_price_inverted = 1 AND cr.price_difference > COALESCE(ps.alert_threshold, 10)
  `).all(date);
  
  const stmt = db.prepare(`
    INSERT INTO price_adjustment_tasks (strategy_id, room_type_id, suggested_price, reason)
    VALUES (?, ?, ?, ?)
  `);
  
  let count = 0;
  for (const item of inverted) {
    const targetDiff = item.target_price_difference || -10;
    const suggestedPrice = item.lowest_price + targetDiff;
    stmt.run(null, item.room_type_id, suggestedPrice, `价格倒挂${item.price_difference}元，超过阈值`);
    count++;
  }
  
  res.json({ success: true, generated: count });
});

router.post('/tasks/:id/execute', (req, res) => {
  const { executed_by } = req.body;
  
  db.prepare(`
    UPDATE price_adjustment_tasks 
    SET status = 'executed', executed_at = CURRENT_TIMESTAMP, executed_by = ?
    WHERE id = ?
  `).run(executed_by || 'system', req.params.id);
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM price_strategies WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
