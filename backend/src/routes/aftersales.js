const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
  const { leader_id, status } = req.query;
  let sql = `
    SELECT a.*, o.order_no, o.total_amount, l.name as leader_name
    FROM after_sales a 
    LEFT JOIN orders o ON a.order_id = o.id
    LEFT JOIN leaders l ON a.leader_id = l.id
    ORDER BY a.created_at DESC
  `;
  let params = [];
  let conditions = [];
  
  if (leader_id) {
    conditions.push('a.leader_id = ?');
    params.push(leader_id);
  }
  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql = `
      SELECT a.*, o.order_no, o.total_amount, l.name as leader_name
      FROM after_sales a 
      LEFT JOIN orders o ON a.order_id = o.id
      LEFT JOIN leaders l ON a.leader_id = l.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.created_at DESC
    `;
  }
  
  const afterSales = db.prepare(sql).all(...params);
  res.json({ success: true, data: afterSales });
});

router.post('/', (req, res) => {
  const { order_id, leader_id, type, reason, amount } = req.body;
  
  if (!order_id || !leader_id || !type || !reason) {
    return res.status(400).json({ success: false, message: '订单、团长、类型和原因为必填项' });
  }
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(400).json({ success: false, message: '订单不存在' });
  }
  
  const result = db.prepare(`
    INSERT INTO after_sales (order_id, leader_id, type, reason, amount, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(order_id, leader_id, type, reason, amount || 0);
  
  const afterSale = db.prepare(`
    SELECT a.*, o.order_no
    FROM after_sales a
    LEFT JOIN orders o ON a.order_id = o.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);
  
  res.json({ success: true, data: afterSale });
});

router.put('/:id/handle', (req, res) => {
  const { status, handled_by } = req.body;
  
  const afterSale = db.prepare('SELECT * FROM after_sales WHERE id = ?').get(req.params.id);
  if (!afterSale) {
    return res.status(404).json({ success: false, message: '售后记录不存在' });
  }
  
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE after_sales 
      SET status = ?, handled_by = ?, handled_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, handled_by || 'admin', req.params.id);
    
    if (status === 'approved') {
      db.prepare(`
        UPDATE orders SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(afterSale.order_id);
      
      db.prepare(`
        UPDATE commissions 
        SET refund_amount = refund_amount + ?, 
            commission_amount = (sales_amount - refund_amount - penalty_amount) * commission_rate,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `).run(afterSale.amount, afterSale.order_id);
    }
  });
  
  try {
    transaction();
    res.json({ success: true, message: '售后处理成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
