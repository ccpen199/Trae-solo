import express from 'express';
import db from '../database.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

function generateOrderNo() {
  return 'MAC' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

router.post('/hotel/create', auth, (req, res) => {
  const userId = req.user.id;
  const { hotel_id, room_id, check_in, check_out, guest_name, guest_phone, rooms = 1 } = req.body;

  if (!hotel_id || !room_id || !check_in || !check_out || !guest_name || !guest_phone) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id);
  if (!room) {
    return res.status(404).json({ error: '房型不存在' });
  }

  const checkIn = new Date(check_in);
  const checkOut = new Date(check_out);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const totalAmount = room.price * nights * rooms;

  const orderNo = generateOrderNo();
  
  db.prepare(`
    INSERT INTO hotel_orders 
    (order_no, user_id, hotel_id, room_id, check_in, check_out, guest_name, guest_phone, rooms, price, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, userId, hotel_id, room_id, check_in, check_out, guest_name, guest_phone, rooms, room.price, totalAmount);

  res.json({
    success: true,
    message: '订单创建成功',
    order_no: orderNo,
    total_amount: totalAmount
  });
});

router.get('/hotel/list', auth, (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let query = `
    SELECT ho.*, h.name as hotel_name, h.images as hotel_image, r.name as room_name
    FROM hotel_orders ho
    JOIN hotels h ON ho.hotel_id = h.id
    JOIN rooms r ON ho.room_id = r.id
    WHERE ho.user_id = ?
  `;
  const params = [userId];

  if (status) {
    query += ' AND ho.status = ?';
    params.push(status);
  }

  query += ' ORDER BY ho.created_at DESC';

  const orders = db.prepare(query).all(...params);
  res.json({ success: true, data: orders });
});

router.get('/hotel/:orderNo', auth, (req, res) => {
  const userId = req.user.id;
  const { orderNo } = req.params;

  const order = db.prepare(`
    SELECT ho.*, h.name as hotel_name, h.images as hotel_image, h.address, h.star, h.rating, r.name as room_name
    FROM hotel_orders ho
    JOIN hotels h ON ho.hotel_id = h.id
    JOIN rooms r ON ho.room_id = r.id
    WHERE ho.user_id = ? AND ho.order_no = ?
  `).get(userId, orderNo);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  res.json({ success: true, data: order });
});

router.post('/hotel/pay', auth, (req, res) => {
  const userId = req.user.id;
  const { order_no } = req.body;

  const order = db.prepare('SELECT * FROM hotel_orders WHERE order_no = ? AND user_id = ?').get(order_no, userId);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: '订单已支付' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (user.balance < order.total_amount) {
    return res.status(400).json({ error: '余额不足' });
  }

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(order.total_amount, userId);
  db.prepare('UPDATE hotel_orders SET payment_status = ?, status = ?, paid_at = CURRENT_TIMESTAMP WHERE order_no = ?')
    .run('paid', 'confirmed', order_no);

  res.json({ success: true, message: '支付成功' });
});

router.post('/product/create', auth, (req, res) => {
  const userId = req.user.id;
  const { items, address, receiver_name, receiver_phone } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: '请选择商品' });
  }

  let totalAmount = 0;
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }
    totalAmount += product.price * item.quantity;
  }

  const orderNo = generateOrderNo();
  
  db.prepare(`
    INSERT INTO product_orders 
    (order_no, user_id, items, total_amount, address, receiver_name, receiver_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, userId, JSON.stringify(items), totalAmount, address, receiver_name, receiver_phone);

  for (const item of items) {
    db.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?').run(userId, item.product_id);
  }

  res.json({
    success: true,
    message: '订单创建成功',
    order_no: orderNo,
    total_amount: totalAmount
  });
});

router.get('/product/list', auth, (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let query = 'SELECT * FROM product_orders WHERE user_id = ?';
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const orders = db.prepare(query).all(...params);
  
  orders.forEach(order => {
    order.items = JSON.parse(order.items);
  });

  res.json({ success: true, data: orders });
});

router.post('/product/pay', auth, (req, res) => {
  const userId = req.user.id;
  const { order_no } = req.body;

  const order = db.prepare('SELECT * FROM product_orders WHERE order_no = ? AND user_id = ?').get(order_no, userId);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: '订单已支付' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (user.balance < order.total_amount) {
    return res.status(400).json({ error: '余额不足' });
  }

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(order.total_amount, userId);
  db.prepare('UPDATE product_orders SET payment_status = ?, status = ?, paid_at = CURRENT_TIMESTAMP WHERE order_no = ?')
    .run('paid', 'confirmed', order_no);

  const items = JSON.parse(order.items);
  for (const item of items) {
    db.prepare('UPDATE products SET sales = sales + ? WHERE id = ?').run(item.quantity, item.product_id);
  }

  res.json({ success: true, message: '支付成功' });
});

export default router;
