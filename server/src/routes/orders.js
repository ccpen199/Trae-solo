const express = require('express');
const db = require('../database/db');
const auth = require('../middleware/auth');

const router = express.Router();

const STATUS_MAP = {
  0: '待确认',
  1: '已确认',
  2: '履约中',
  3: '已完成',
  4: '已取消'
};

function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WD${year}${month}${day}${random}`;
}

router.get('/', auth(), (req, res) => {
  const { status, page = 1, pageSize = 10 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (req.user.role === 'couple') {
    where += ' AND o.user_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'merchant') {
    const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id);
    where += ' AND o.merchant_id = ?';
    params.push(merchant?.id || 0);
  }
  
  if (status !== undefined) {
    where += ' AND o.status = ?';
    params.push(parseInt(status));
  }
  
  const orders = db.prepare(`
    SELECT o.*, s.name as service_name, s.category as service_category, s.images as service_images,
           m.company_name, m.logo as merchant_logo, u.real_name as user_name
    FROM orders o
    LEFT JOIN services s ON o.service_id = s.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    LEFT JOIN users u ON o.user_id = u.id
    ${where}
    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o ${where}`).get(...params).count;
  
  orders.forEach(o => {
    o.status_name = STATUS_MAP[o.status] || '未知';
    o.service_images = o.service_images ? JSON.parse(o.service_images) : [];
  });
  
  res.json({ data: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth(), (req, res) => {
  const order = db.prepare(`
    SELECT o.*, s.name as service_name, s.category as service_category, s.description as service_description,
           s.images as service_images, s.price as service_price,
           m.company_name, m.logo as merchant_logo, m.contact_name, m.contact_phone,
           u.real_name as user_name, u.phone as user_phone
    FROM orders o
    LEFT JOIN services s ON o.service_id = s.id
    LEFT JOIN merchants m ON o.merchant_id = m.id
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (req.user.role === 'couple' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权限查看' });
  }
  
  if (req.user.role === 'merchant') {
    const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id);
    if (order.merchant_id !== merchant?.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
  }
  
  order.status_name = STATUS_MAP[order.status] || '未知';
  order.service_images = order.service_images ? JSON.parse(order.service_images) : [];
  
  res.json(order);
});

router.post('/', auth(['couple']), (req, res) => {
  const { service_id, booking_date, contact_name, contact_phone, remark } = req.body;
  
  if (!service_id) {
    return res.status(400).json({ error: '请选择服务' });
  }
  
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND status = 1').get(service_id);
  if (!service) {
    return res.status(404).json({ error: '服务不存在或已下架' });
  }
  
  const orderNo = generateOrderNo();
  
  const result = db.prepare(`
    INSERT INTO orders (user_id, merchant_id, service_id, order_no, amount, booking_date, contact_name, contact_phone, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id, service.merchant_id, service_id, orderNo, service.price,
    booking_date, contact_name || req.user.real_name,
    contact_phone || req.user.phone, remark || ''
  );
  
  res.status(201).json({ id: result.lastInsertRowid, order_no: orderNo, message: '下单成功' });
});

router.put('/:id/status', auth(), (req, res) => {
  const { status } = req.body;
  
  if (status === undefined || status < 0 || status > 4) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (req.user.role === 'couple' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权限修改' });
  }
  
  if (req.user.role === 'merchant') {
    const merchant = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(req.user.id);
    if (order.merchant_id !== merchant?.id) {
      return res.status(403).json({ error: '无权限修改' });
    }
  }
  
  if (req.user.role === 'couple' && status === 4 && order.status > 1) {
    return res.status(400).json({ error: '订单已确认，无法取消' });
  }
  
  if (req.user.role === 'merchant' && status === 3 && order.status !== 2) {
    return res.status(400).json({ error: '请先确认服务开始' });
  }
  
  db.prepare(`
    UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, req.params.id);
  
  if (status === 2) {
    const depositAmount = order.amount * 0.1;
    db.prepare(`
      INSERT INTO deposit_records (merchant_id, amount, type, remark, order_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(order.merchant_id, depositAmount, 'freeze', `订单${order.order_no}履约保证金冻结`, order.id);
  }
  
  if (status === 3) {
    const depositAmount = order.amount * 0.1;
    db.prepare(`
      INSERT INTO deposit_records (merchant_id, amount, type, remark, order_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(order.merchant_id, depositAmount, 'unfreeze', `订单${order.order_no}履约保证金解冻`, order.id);
  }
  
  res.json({ message: '状态更新成功', status_name: STATUS_MAP[status] });
});

module.exports = router;
