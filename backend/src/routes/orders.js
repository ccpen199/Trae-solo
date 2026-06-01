const express = require('express');
const router = express.Router();
const db = require('../db');

function generateOrderNo() {
  const date = new Date();
  const prefix = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const count = db.prepare('SELECT COUNT(*) as count FROM orders WHERE order_no LIKE ?').get(prefix + '%').count;
  return prefix + (count + 1).toString().padStart(4, '0');
}

router.get('/', (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT o.*, c.name as customer_name, c.phone as customer_phone
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM orders';
  const params = [];

  if (status) {
    query += ' WHERE o.status = ?';
    countQuery += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), offset);

  const orders = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...params.slice(0, params.length - 2));

  res.json({ data: orders, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*, c.name as customer_name, c.phone as customer_phone,
           f.name as frame_name, l.name as lens_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN products f ON o.frame_id = f.id
    LEFT JOIN products l ON o.lens_id = l.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const optometry = order.optometry_id ?
    db.prepare('SELECT * FROM optometry_records WHERE id = ?').get(order.optometry_id) : null;

  const processing = db.prepare(`
    SELECT * FROM processing_records
    WHERE order_id = ?
    ORDER BY created_at ASC
  `).all(req.params.id);

  res.json({ ...order, optometry, processing });
});

router.post('/calculate', (req, res) => {
  const { frame_id, lens_id, discount = 0 } = req.body;

  let framePrice = 0;
  let lensPrice = 0;

  if (frame_id) {
    const frame = db.prepare('SELECT price, stock FROM products WHERE id = ? AND type = ?').get(frame_id, 'frame');
    if (!frame) {
      return res.status(400).json({ error: '镜架产品不存在' });
    }
    if (frame.stock <= 0) {
      return res.status(400).json({ error: '镜架库存不足' });
    }
    framePrice = frame.price;
  }

  if (lens_id) {
    const lens = db.prepare('SELECT price, stock FROM products WHERE id = ? AND type = ?').get(lens_id, 'lens');
    if (!lens) {
      return res.status(400).json({ error: '镜片产品不存在' });
    }
    if (lens.stock <= 0) {
      return res.status(400).json({ error: '镜片库存不足' });
    }
    lensPrice = lens.price;
  }

  const subtotal = framePrice + lensPrice;
  const totalAmount = Math.max(0, subtotal - discount);

  res.json({
    frame_price: framePrice,
    lens_price: lensPrice,
    subtotal,
    discount,
    total_amount: totalAmount
  });
});

router.post('/', (req, res) => {
  const {
    customer_id,
    optometry_id,
    frame_id,
    lens_id,
    discount = 0,
    delivery_date,
    salesperson,
    notes
  } = req.body;

  if (!customer_id) {
    return res.status(400).json({ error: '客户ID必填' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  if (optometry_id) {
    const optometry = db.prepare('SELECT * FROM optometry_records WHERE id = ?').get(optometry_id);
    if (!optometry) {
      return res.status(404).json({ error: '验光记录不存在' });
    }
    if (optometry.customer_id !== customer_id) {
      return res.status(400).json({ error: '验光记录不属于该客户' });
    }
  }

  let framePrice = 0;
  let lensPrice = 0;

  if (frame_id) {
    const frame = db.prepare('SELECT price, stock FROM products WHERE id = ? AND type = ?').get(frame_id, 'frame');
    if (!frame) return res.status(400).json({ error: '镜架产品不存在' });
    if (frame.stock <= 0) return res.status(400).json({ error: '镜架库存不足' });
    framePrice = frame.price;
  }

  if (lens_id) {
    const lens = db.prepare('SELECT price, stock FROM products WHERE id = ? AND type = ?').get(lens_id, 'lens');
    if (!lens) return res.status(400).json({ error: '镜片产品不存在' });
    if (lens.stock <= 0) return res.status(400).json({ error: '镜片库存不足' });
    lensPrice = lens.price;
  }

  const totalAmount = Math.max(0, framePrice + lensPrice - discount);
  const orderNo = generateOrderNo();

  const result = db.prepare(`
    INSERT INTO orders (
      order_no, customer_id, optometry_id, frame_id, lens_id,
      frame_price, lens_price, discount, total_amount, status,
      delivery_date, salesperson, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNo, customer_id, optometry_id || null, frame_id || null, lens_id || null,
    framePrice, lensPrice, discount, totalAmount, 'ordered',
    delivery_date || null, salesperson || null, notes || null
  );

  if (frame_id) {
    db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(frame_id);
  }
  if (lens_id) {
    db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(lens_id);
  }

  db.prepare(`
    INSERT INTO processing_records (order_id, status, notes)
    VALUES (?, ?, ?)
  `).run(result.lastInsertRowid, 'ordered', '订单已创建');

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

router.put('/:id/status', (req, res) => {
  const { status, processor, notes } = req.body;

  const validStatuses = ['ordered', 'lens_arrived', 'processing', 'quality_check', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: '无效的订单状态' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  db.prepare(`
    UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, req.params.id);

  db.prepare(`
    INSERT INTO processing_records (order_id, status, processor, notes)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, status, processor || null, notes || null);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.put('/:id/payment', (req, res) => {
  const { paid_amount } = req.body;

  if (paid_amount === undefined || paid_amount < 0) {
    return res.status(400).json({ error: '无效的支付金额' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  db.prepare(`
    UPDATE orders SET paid_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(paid_amount, req.params.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

module.exports = router;
