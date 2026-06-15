const express = require('express');
const router = express.Router();
const db = require('../db/database');
const dayjs = require('dayjs');

router.get('/', (req, res) => {
  const { order_id, type, status, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT a.*, o.order_no, p.name as platform_name FROM after_sales a';
  query += ' LEFT JOIN orders o ON a.order_id = o.id';
  query += ' LEFT JOIN platforms p ON o.platform_id = p.id';
  
  const where = [];
  const params = [];
  
  if (order_id) {
    where.push('a.order_id = ?');
    params.push(order_id);
  }
  if (type) {
    where.push('a.type = ?');
    params.push(type);
  }
  if (status) {
    where.push('a.status = ?');
    params.push(status);
  }
  
  if (where.length > 0) {
    query += ' WHERE ' + where.join(' AND ');
  }
  
  query += ' ORDER BY a.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize));
  params.push((parseInt(page) - 1) * parseInt(pageSize));
  
  const afterSales = db.prepare(query).all(...params);
  
  let countQuery = 'SELECT COUNT(*) as total FROM after_sales a';
  if (where.length > 0) {
    countQuery += ' WHERE ' + where.join(' AND ');
  }
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));
  
  res.json({ success: true, data: afterSales, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.post('/', (req, res) => {
  const { order_id, type, reason, new_address, new_lat, new_lng } = req.body;
  
  if (!order_id || !type) {
    return res.status(400).json({ success: false, message: '订单ID和售后类型不能为空' });
  }
  
  const validTypes = ['address_change', 'cancel', 'complaint', 'refund'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: '无效的售后类型' });
  }
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  if (order.delivery_status === 'delivered' && type === 'cancel') {
    return res.status(400).json({ success: false, message: '已完成的订单无法取消' });
  }
  
  const result = db.prepare(`
    INSERT INTO after_sales (order_id, type, reason, new_address, new_lat, new_lng, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(order_id, type, reason || '', new_address || null, new_lat || null, new_lng || null, 'processing');
  
  db.prepare(`INSERT INTO order_tracks (order_id, status, description) VALUES (?, ?, ?)`)
    .run(order_id, 'after_sale', `发起${{
      'address_change': '改址申请',
      'cancel': '取消申请',
      'complaint': '投诉',
      'refund': '退款申请'
    }[type]}：${reason || ''}`);
  
  setTimeout(() => {
    const ack = db.prepare('SELECT * FROM after_sales WHERE id = ?').get(result.lastInsertRowid);
    if (ack && ack.status === 'processing') {
      db.prepare('UPDATE after_sales SET status = ?, platform_ack = 1, result = ? WHERE id = ?')
        .run('accepted', '平台已受理，预计30分钟内处理完成', result.lastInsertRowid);
    }
  }, 3000);
  
  const afterSale = db.prepare(`
    SELECT a.*, o.order_no, p.name as platform_name
    FROM after_sales a
    LEFT JOIN orders o ON a.order_id = o.id
    LEFT JOIN platforms p ON o.platform_id = p.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);
  
  res.json({ success: true, data: afterSale });
});

router.put('/:id/status', (req, res) => {
  const { status, result } = req.body;
  const afterSale = db.prepare('SELECT * FROM after_sales WHERE id = ?').get(req.params.id);
  
  if (!afterSale) {
    return res.status(404).json({ success: false, message: '售后记录不存在' });
  }
  
  db.prepare('UPDATE after_sales SET status = ?, result = ? WHERE id = ?')
    .run(status, result || '', req.params.id);
  
  const updated = db.prepare(`
    SELECT a.*, o.order_no, p.name as platform_name
    FROM after_sales a
    LEFT JOIN orders o ON a.order_id = o.id
    LEFT JOIN platforms p ON o.platform_id = p.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  res.json({ success: true, data: updated });
});

module.exports = router;
