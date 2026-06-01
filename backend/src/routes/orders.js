const express = require('express');
const router = express.Router();
const { db } = require('../database');

function generateOrderNo() {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GB${timestamp}${random}`;
}

router.get('/', (req, res) => {
  const { leader_id, activity_id, status } = req.query;
  let sql = `
    SELECT o.*, a.title as activity_title, l.name as leader_name
    FROM orders o 
    LEFT JOIN activities a ON o.activity_id = a.id
    LEFT JOIN leaders l ON o.leader_id = l.id
    ORDER BY o.created_at DESC
  `;
  let params = [];
  let conditions = [];
  
  if (leader_id) {
    conditions.push('o.leader_id = ?');
    params.push(leader_id);
  }
  if (activity_id) {
    conditions.push('o.activity_id = ?');
    params.push(activity_id);
  }
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    sql = `
      SELECT o.*, a.title as activity_title, l.name as leader_name
      FROM orders o 
      LEFT JOIN activities a ON o.activity_id = a.id
      LEFT JOIN leaders l ON o.leader_id = l.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY o.created_at DESC
    `;
  }
  
  const orders = db.prepare(sql).all(...params);
  res.json({ success: true, data: orders });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, a.title as activity_title, a.pickup_point, l.name as leader_name
    FROM orders o 
    LEFT JOIN activities a ON o.activity_id = a.id
    LEFT JOIN leaders l ON o.leader_id = l.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  order.items = items;
  
  res.json({ success: true, data: order });
});

router.get('/pickup/list', (req, res) => {
  const { leader_id, activity_id } = req.query;
  
  const sql = `
    SELECT 
      o.id,
      o.order_no,
      o.customer_name,
      o.customer_phone,
      o.total_amount,
      o.pickup_status,
      a.title as activity_title,
      a.pickup_point
    FROM orders o
    LEFT JOIN activities a ON o.activity_id = a.id
    WHERE o.leader_id = ? AND o.activity_id = ? AND o.status = 'confirmed'
    ORDER BY o.created_at DESC
  `;
  
  const orders = db.prepare(sql).all(leader_id, activity_id);
  
  for (const order of orders) {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  
  res.json({ success: true, data: orders });
});

router.post('/', (req, res) => {
  const { activity_id, leader_id, customer_name, customer_phone, items } = req.body;
  
  if (!activity_id || !leader_id || !customer_name || !customer_phone || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: '活动、团长、客户信息和商品为必填项' });
  }
  
  const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(activity_id);
  if (!activity) {
    return res.status(400).json({ success: false, message: '活动不存在' });
  }
  
  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, activity_id, leader_id, customer_name, customer_phone, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 'confirmed')
  `);
  
  const insertOrderWithCommission = db.prepare(`
    INSERT INTO orders (order_no, activity_id, leader_id, customer_name, customer_phone, total_amount, commission_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `);
  
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const updateStock = db.prepare(`
    UPDATE products SET sold = sold + ? WHERE id = ?
  `);
  
  const insertCommission = db.prepare(`
    INSERT INTO commissions (leader_id, order_id, period, sales_amount, commission_rate, commission_amount)
    VALUES (?, ?, ?, ?, 0.1, ?)
  `);
  
  const orderCols = db.pragma('table_info(orders)').map(c => c.name);
  const hasCommissionField = orderCols.includes('commission_amount');
  
  const transaction = db.transaction(() => {
    db.pragma('foreign_keys = OFF');
    const orderNo = generateOrderNo();
    let totalAmount = 0;
    
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        throw new Error(`商品不存在: ${item.product_id}`);
      }
      if (product.stock - product.sold < item.quantity) {
        throw new Error(`商品库存不足: ${product.name}`);
      }
      totalAmount += product.price * item.quantity;
    }
    
    const commissionAmount = totalAmount * 0.1;
    let result;
    if (hasCommissionField) {
      result = insertOrderWithCommission.run(orderNo, activity_id, leader_id, customer_name, customer_phone, totalAmount, commissionAmount);
    } else {
      result = insertOrder.run(orderNo, activity_id, leader_id, customer_name, customer_phone, totalAmount);
    }
    const orderId = result.lastInsertRowid;
    
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
      const subtotal = product.price * item.quantity;
      insertItem.run(orderId, item.product_id, product.name, item.quantity, product.price, subtotal);
      updateStock.run(item.quantity, item.product_id);
    }
    
    const period = new Date().toISOString().slice(0, 7);
    insertCommission.run(leader_id, orderId, period, totalAmount, commissionAmount);
    
    return orderId;
  });
  
  try {
    const orderId = transaction();
    const order = db.prepare(`
      SELECT o.*, a.title as activity_title, l.name as leader_name
      FROM orders o 
      LEFT JOIN activities a ON o.activity_id = a.id
      LEFT JOIN leaders l ON o.leader_id = l.id
      WHERE o.id = ?
    `).get(orderId);
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/pickup', (req, res) => {
  const { actual_items, difference_note } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  if (order.status === 'refunded') {
    return res.status(400).json({ success: false, message: '已退款订单无法提货' });
  }
  
  if (order.pickup_status === 'picked') {
    return res.status(400).json({ success: false, message: '该订单已提货' });
  }
  
  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE orders SET pickup_status = 'picked', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);
    
    db.prepare(`
      INSERT INTO pickup_records (order_id, leader_id, actual_items, difference_note)
      VALUES (?, ?, ?, ?)
    `).run(req.params.id, order.leader_id, JSON.stringify(actual_items || []), difference_note || '');
  });
  
  try {
    transaction();
    res.json({ success: true, message: '提货确认成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }
  
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  
  res.json({ success: true, message: '状态更新成功' });
});

module.exports = router;
