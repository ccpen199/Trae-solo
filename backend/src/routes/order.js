const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const generateOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString().slice(2, 8);
  return `${year}${month}${day}${random}`;
};

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { status, limit = 10, offset = 0 } = req.query;
  
  let whereClause = 'user_id = ?';
  const params = [userId];
  
  if (status !== undefined) {
    whereClause += ' AND status = ?';
    params.push(parseInt(status));
  }
  
  const orders = db.prepare(`
    SELECT * FROM orders 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), parseInt(offset));
  
  const orderIds = orders.map(o => o.id);
  let orderItems = [];
  
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',');
    orderItems = db.prepare(`
      SELECT * FROM order_items WHERE order_id IN (${placeholders})
    `).all(...orderIds);
  }
  
  const itemsByOrderId = {};
  orderItems.forEach(item => {
    if (!itemsByOrderId[item.order_id]) {
      itemsByOrderId[item.order_id] = [];
    }
    itemsByOrderId[item.order_id].push(item);
  });
  
  const ordersWithItems = orders.map(order => ({
    ...order,
    items: itemsByOrderId[order.id] || []
  }));
  
  res.json({ code: 0, data: ordersWithItems });
});

router.get('/:id', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  
  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ?'
  ).get(id, userId);
  
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }
  
  const orderItems = db.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).all(id);
  
  const address = db.prepare(
    'SELECT * FROM addresses WHERE id = ?'
  ).get(order.address_id);
  
  res.json({
    code: 0,
    data: {
      ...order,
      items: orderItems,
      address
    }
  });
});

router.post('/create', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { addressId, productIds, remark } = req.body;
  
  if (!addressId) {
    return res.status(400).json({ code: 400, message: '请选择收货地址' });
  }
  
  const address = db.prepare(
    'SELECT * FROM addresses WHERE id = ? AND user_id = ?'
  ).get(addressId, userId);
  
  if (!address) {
    return res.status(404).json({ code: 404, message: '地址不存在' });
  }
  
  let cartItems = [];
  
  if (productIds && productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    cartItems = db.prepare(`
      SELECT c.*, p.name, p.image, p.price, p.vip_price, p.stock
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND c.product_id IN (${placeholders}) AND c.selected = 1
    `).all(userId, ...productIds);
  } else {
    cartItems = db.prepare(`
      SELECT c.*, p.name, p.image, p.price, p.vip_price, p.stock
      FROM carts c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ? AND c.selected = 1
    `).all(userId);
  }
  
  if (cartItems.length === 0) {
    return res.status(400).json({ code: 400, message: '请选择要购买的商品' });
  }
  
  const user = db.prepare('SELECT is_vip FROM users WHERE id = ?').get(userId);
  const isVip = user?.is_vip === 1;
  
  let totalAmount = 0;
  let discountAmount = 0;
  
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ code: 400, message: `商品 ${item.name} 库存不足` });
    }
    
    const showPrice = isVip && item.vip_price ? item.vip_price : item.price;
    totalAmount += showPrice * item.quantity;
    discountAmount += (item.price - showPrice) * item.quantity;
  }
  
  const orderNo = generateOrderNo();
  const payAmount = totalAmount;
  
  const transaction = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (order_no, user_id, address_id, total_amount, discount_amount, pay_amount, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderNo, userId, addressId, totalAmount, discountAmount, payAmount, remark);
    
    const orderId = orderResult.lastInsertRowid;
    
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const updateStock = db.prepare('UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?');
    const deleteCart = db.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?');
    
    for (const item of cartItems) {
      const showPrice = isVip && item.vip_price ? item.vip_price : item.price;
      const itemTotal = showPrice * item.quantity;
      
      insertItem.run(orderId, item.product_id, item.name, item.image, showPrice, item.quantity, itemTotal);
      updateStock.run(item.quantity, item.quantity, item.product_id);
      deleteCart.run(userId, item.product_id);
    }
    
    return orderId;
  });
  
  try {
    const orderId = transaction();
    
    res.json({
      code: 0,
      message: '订单创建成功',
      data: {
        orderId,
        orderNo,
        payAmount
      }
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ code: 500, message: '创建订单失败' });
  }
});

router.post('/pay', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  
  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 0'
  ).get(orderId, userId);
  
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在或已支付' });
  }
  
  const user = db.prepare('SELECT is_vip, points FROM users WHERE id = ?').get(userId);
  const isVip = user?.is_vip === 1;
  
  const pointsEarned = Math.floor(order.pay_amount * (isVip ? 2 : 1));
  
  db.prepare(`
    UPDATE orders 
    SET status = 1, pay_time = datetime('now')
    WHERE id = ?
  `).run(orderId);
  
  if (pointsEarned > 0) {
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsEarned, userId);
  }
  
  res.json({
    code: 0,
    message: '支付成功',
    data: {
      pointsEarned
    }
  });
});

router.post('/cancel', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  
  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status IN (0, 1)'
  ).get(orderId, userId);
  
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在或无法取消' });
  }
  
  const orderItems = db.prepare(
    'SELECT product_id, quantity FROM order_items WHERE order_id = ?'
  ).all(orderId);
  
  const transaction = db.transaction(() => {
    db.prepare('UPDATE orders SET status = -1 WHERE id = ?').run(orderId);
    
    const updateStock = db.prepare('UPDATE products SET stock = stock + ?, sales = sales - ? WHERE id = ?');
    
    for (const item of orderItems) {
      updateStock.run(item.quantity, item.quantity, item.product_id);
    }
  });
  
  try {
    transaction();
    res.json({ code: 0, message: '订单已取消' });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ code: 500, message: '取消订单失败' });
  }
});

router.post('/confirm', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  
  const result = db.prepare(`
    UPDATE orders 
    SET status = 3, complete_time = datetime('now')
    WHERE id = ? AND user_id = ? AND status = 2
  `).run(orderId, userId);
  
  if (result.changes === 0) {
    return res.status(404).json({ code: 404, message: '订单不存在或无法确认收货' });
  }
  
  res.json({ code: 0, message: '确认收货成功' });
});

module.exports = router;
