const { db } = require('../models/database');

const generateOrderNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString().slice(-6);
  return `HC${year}${month}${day}${random}`;
};

const createOrder = (req, res) => {
  const userId = req.user.userId;
  const { cartIds, pickType, pickInfo, remark, couponId } = req.body;
  
  const placeholders = cartIds.map(() => '?').join(',');
  const cartItems = db.prepare(`
    SELECT c.*, p.name, p.price, p.images, p.stock 
    FROM carts c 
    LEFT JOIN products p ON c.product_id = p.id 
    WHERE c.id IN (${placeholders}) AND c.user_id = ? AND c.selected = 1
  `).all(...cartIds, userId);
  
  if (cartItems.length === 0) {
    return res.json({ code: 400, msg: '请选择商品', data: null });
  }
  
  let totalAmount = 0;
  cartItems.forEach(item => {
    totalAmount += item.price * item.quantity;
  });
  
  let discountAmount = 0;
  if (couponId) {
    const coupon = db.prepare(`
      SELECT c.* FROM user_coupons uc 
      LEFT JOIN coupons c ON uc.coupon_id = c.id 
      WHERE uc.id = ? AND uc.user_id = ? AND uc.status = 0
    `).get(couponId, userId);
    
    if (coupon && totalAmount >= coupon.min_amount) {
      if (coupon.type === 1) {
        discountAmount = coupon.value;
      } else if (coupon.type === 2) {
        discountAmount = totalAmount * (1 - coupon.value);
      }
    }
  }
  
  const payAmount = Math.max(0, totalAmount - discountAmount);
  const orderNo = generateOrderNo();
  
  const orderResult = db.prepare(`
    INSERT INTO orders (order_no, user_id, total_amount, discount_amount, pay_amount, pick_type, pick_info, remark, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(orderNo, userId, totalAmount, discountAmount, payAmount, pickType, JSON.stringify(pickInfo), remark || '');
  
  const orderId = orderResult.lastInsertRowid;
  
  cartItems.forEach(item => {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, item.product_id, item.name, item.images?.[0] || '', item.price, item.quantity);
  });
  
  db.prepare(`DELETE FROM carts WHERE id IN (${placeholders}) AND user_id = ?`).run(...cartIds, userId);
  
  if (couponId) {
    db.prepare('UPDATE user_coupons SET status = 1, order_id = ?, used_time = CURRENT_TIMESTAMP WHERE id = ?').run(orderId, couponId);
  }
  
  res.json({ code: 200, msg: '创建成功', data: { orderId, orderNo, payAmount } });
};

const getOrders = (req, res) => {
  const userId = req.user.userId;
  const { status, page = 1, pageSize = 10 } = req.query;
  
  let sql = 'SELECT * FROM orders WHERE user_id = ?';
  const params = [userId];
  
  if (status && status != 0) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (page - 1) * pageSize);
  
  const orders = db.prepare(sql).all(...params);
  
  const orderList = orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return {
      ...order,
      pick_info: JSON.parse(order.pick_info || '{}'),
      items
    };
  });
  
  res.json({ code: 200, msg: 'success', data: orderList });
};

const getOrderDetail = (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, userId);
  if (!order) {
    return res.json({ code: 404, msg: '订单不存在', data: null });
  }
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  const result = {
    ...order,
    pick_info: JSON.parse(order.pick_info || '{}'),
    items
  };
  res.json({ code: 200, msg: 'success', data: result });
};

const cancelOrder = (req, res) => {
  const userId = req.user.userId;
  const { id } = req.body;
  
  const result = db.prepare('UPDATE orders SET status = 6 WHERE id = ? AND user_id = ? AND status IN (1)').run(id, userId);
  if (result.changes === 0) {
    return res.json({ code: 400, msg: '订单不可取消', data: null });
  }
  res.json({ code: 200, msg: '取消成功', data: null });
};

const payOrder = (req, res) => {
  const userId = req.user.userId;
  const { id } = req.body;
  
  const result = db.prepare('UPDATE orders SET status = 2, pay_time = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND status = 1').run(id, userId);
  if (result.changes === 0) {
    return res.json({ code: 400, msg: '订单不可支付', data: null });
  }
  res.json({ code: 200, msg: '支付成功', data: null });
};

const confirmOrder = (req, res) => {
  const userId = req.user.userId;
  const { id } = req.body;
  
  const result = db.prepare('UPDATE orders SET status = 5 WHERE id = ? AND user_id = ? AND status IN (2,3,4)').run(id, userId);
  if (result.changes === 0) {
    return res.json({ code: 400, msg: '订单不可确认', data: null });
  }
  res.json({ code: 200, msg: '确认成功', data: null });
};

const getPickupCode = (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  
  const order = db.prepare('SELECT order_no, status FROM orders WHERE id = ? AND user_id = ?').get(id, userId);
  if (!order) {
    return res.json({ code: 404, msg: '订单不存在', data: null });
  }
  if (order.status < 2) {
    return res.json({ code: 400, msg: '订单未支付', data: null });
  }
  const pickupCode = order.order_no.slice(-6);
  res.json({ code: 200, msg: 'success', data: { orderNo: order.order_no, pickupCode, qrcodeData: order.order_no } });
};

module.exports = { createOrder, getOrders, getOrderDetail, cancelOrder, payOrder, confirmOrder, getPickupCode };
