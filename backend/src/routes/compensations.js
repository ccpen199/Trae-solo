const express = require('express');
const router = express.Router();
const db = require('../db/database');
const dayjs = require('dayjs');

function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CP';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

router.get('/', (req, res) => {
  const { merchant_id, platform_id, status, type, page = 1, pageSize = 20 } = req.query;
  
  let query = `SELECT c.*, o.order_no, m.name as merchant_name, p.name as platform_name,
    CASE WHEN c.reviewed_at IS NULL THEN 0 ELSE 1 END as reviewed
    FROM compensations c`;
  query += ' LEFT JOIN orders o ON c.order_id = o.id';
  query += ' LEFT JOIN merchants m ON c.merchant_id = m.id';
  query += ' LEFT JOIN platforms p ON o.platform_id = p.id';
  
  const where = [];
  const params = [];
  
  if (merchant_id) {
    where.push('c.merchant_id = ?');
    params.push(merchant_id);
  }
  if (platform_id) {
    where.push('o.platform_id = ?');
    params.push(platform_id);
  }
  if (status) {
    where.push('c.status = ?');
    params.push(status);
  }
  if (type) {
    where.push('c.type = ?');
    params.push(type);
  }
  
  if (where.length > 0) {
    query += ' WHERE ' + where.join(' AND ');
  }
  
  query += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize));
  params.push((parseInt(page) - 1) * parseInt(pageSize));
  
  const compensations = db.prepare(query).all(...params);
  
  let countQuery = 'SELECT COUNT(*) as total FROM compensations c';
  if (platform_id) {
    countQuery += ' LEFT JOIN orders o ON c.order_id = o.id';
  }
  if (where.length > 0) {
    countQuery += ' WHERE ' + where.join(' AND ');
  }
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));
  
  res.json({ success: true, data: compensations, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_compensations,
      SUM(amount) as total_amount,
      SUM(CASE WHEN type = 'timeout' THEN 1 ELSE 0 END) as timeout_count,
      SUM(CASE WHEN type = 'loss' THEN 1 ELSE 0 END) as loss_count,
      SUM(CASE WHEN type = 'complaint' THEN 1 ELSE 0 END) as complaint_count,
      SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
    FROM compensations
  `).get();
  
  res.json({ success: true, data: stats });
});

router.post('/check-timeout', (req, res) => {
  const overdueOrders = db.prepare(`
    SELECT o.*, p.name as platform_name
    FROM orders o
    LEFT JOIN platforms p ON o.platform_id = p.id
    WHERE o.delivery_status IN ('pending', 'picked', 'delivering')
      AND o.status = 'assigned'
      AND o.estimated_arrival_time IS NOT NULL
      AND o.estimated_arrival_time < datetime('now')
      AND o.id NOT IN (SELECT order_id FROM compensations WHERE type = 'timeout')
  `).all();
  
  const compensations = [];
  
  for (const order of overdueOrders) {
    const amount = Math.min(order.total_fee * 0.3, 20);
    const couponCode = generateCouponCode();
    
    const result = db.prepare(`
      INSERT INTO compensations (order_id, merchant_id, type, amount, coupon_code, reason, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(order.id, order.merchant_id, 'timeout', amount.toFixed(2), couponCode,
           `配送超时，原预计${order.estimated_arrival_time}送达`, 'issued');
    
    db.prepare(`INSERT INTO order_tracks (order_id, status, description) VALUES (?, ?, ?)`)
      .run(order.id, 'compensation', `SLA违约赔付：发放${amount.toFixed(2)}元补偿券 ${couponCode}`);
    
    db.prepare('UPDATE orders SET status = ? WHERE id = ?')
      .run('exception', order.id);
    
    const comp = db.prepare(`
      SELECT c.*, o.order_no, m.name as merchant_name
      FROM compensations c
      LEFT JOIN orders o ON c.order_id = o.id
      LEFT JOIN merchants m ON c.merchant_id = m.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);
    
    compensations.push(comp);
  }
  
  res.json({ 
    success: true, 
    data: compensations,
    message: `检测到 ${overdueOrders.length} 个超时订单，已自动发放赔付`
  });
});

router.post('/manual', (req, res) => {
  const { order_id, type, amount, reason } = req.body;
  
  if (!order_id || !type || !amount) {
    return res.status(400).json({ success: false, message: '缺少必要参数' });
  }
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  const couponCode = generateCouponCode();
  
  const result = db.prepare(`
    INSERT INTO compensations (order_id, merchant_id, type, amount, coupon_code, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(order_id, order.merchant_id, type, amount, couponCode, reason || '人工赔付', 'issued');
  
  db.prepare(`INSERT INTO order_tracks (order_id, status, description) VALUES (?, ?, ?)`)
    .run(order_id, 'compensation', `人工赔付：${amount}元补偿券 ${couponCode}`);
  
  const compensation = db.prepare(`
    SELECT c.*, o.order_no, m.name as merchant_name, p.name as platform_name
    FROM compensations c
    LEFT JOIN orders o ON c.order_id = o.id
    LEFT JOIN merchants m ON c.merchant_id = m.id
    LEFT JOIN platforms p ON o.platform_id = p.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);
  
  res.json({ success: true, data: compensation });
});

router.put('/:id/status', (req, res) => {
  const { status, result } = req.body;
  const compensation = db.prepare('SELECT * FROM compensations WHERE id = ?').get(req.params.id);
  
  if (!compensation) {
    return res.status(404).json({ success: false, message: '赔付记录不存在' });
  }
  
  db.prepare('UPDATE compensations SET status = ?, review_result = ?, reviewed_at = datetime(\'now\') WHERE id = ?')
    .run(status, result || '', req.params.id);
  
  const updated = db.prepare(`
    SELECT c.*, o.order_no, m.name as merchant_name, p.name as platform_name,
      CASE WHEN c.reviewed_at IS NULL THEN 0 ELSE 1 END as reviewed
    FROM compensations c
    LEFT JOIN orders o ON c.order_id = o.id
    LEFT JOIN merchants m ON c.merchant_id = m.id
    LEFT JOIN platforms p ON o.platform_id = p.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  res.json({ success: true, data: updated });
});

module.exports = router;
