const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { requireAuth, isVip } = require('../middleware/auth');

const generateOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${year}${month}${day}${random}`;
};

const calculatePrice = (product, user) => {
  let displayPrice = product.original_price;
  
  const userIsVip = isVip(user);

  if (product.activity_price !== null && product.activity_price !== undefined) {
    displayPrice = product.activity_price;
  } else if (userIsVip && product.member_price !== null && product.member_price !== undefined) {
    displayPrice = product.member_price;
  }

  return displayPrice;
};

router.post('/create', requireAuth, (req, res) => {
  const { cartIds, address, remark, couponId } = req.body;
  const db = getDb();
  const userId = req.user.id;
  const user = req.user;

  if (!Array.isArray(cartIds) || cartIds.length === 0) {
    return res.status(400).json({ error: '请选择要购买的商品' });
  }

  const placeholders = cartIds.map(() => '?').join(',');
  const cartItems = db.prepare(`
    SELECT c.*, p.name, p.original_price, p.member_price, p.activity_price, 
           p.stock, p.is_on_sale,
           ps.price_adjust
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    LEFT JOIN product_specs ps ON c.spec_id = ps.id
    WHERE c.id IN (${placeholders}) AND c.user_id = ? AND c.selected = 1
  `).all(...cartIds, userId);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: '请选择要购买的商品' });
  }

  for (const item of cartItems) {
    if (item.is_on_sale !== 1) {
      return res.status(400).json({ error: `商品"${item.name}"已下架` });
    }
    if (item.stock < item.quantity) {
      return res.status(400).json({ error: `商品"${item.name}"库存不足` });
    }
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cartItems) {
    const unitPrice = calculatePrice(item, user) + (item.price_adjust || 0);
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    orderItems.push({
      product_id: item.product_id,
      spec_id: item.spec_id,
      product_name: item.name,
      price: unitPrice,
      quantity: item.quantity,
      subtotal
    });
  }

  let discountAmount = 0;
  if (couponId) {
    const userCoupon = db.prepare(`
      SELECT uc.*, c.discount_value, c.min_amount 
      FROM user_coupons uc
      JOIN coupons c ON uc.coupon_id = c.id
      WHERE uc.id = ? AND uc.user_id = ? AND uc.status = 'available'
    `).get(couponId, userId);

    if (userCoupon) {
      if (totalAmount >= userCoupon.min_amount) {
        discountAmount = userCoupon.discount_value;
        db.prepare("UPDATE user_coupons SET status = 'used', used_time = datetime('now') WHERE id = ?").run(couponId);
      }
    }
  }

  const payAmount = Math.max(0, totalAmount - discountAmount);
  const orderNo = generateOrderNo();

  db.prepare(`
    INSERT INTO orders (order_no, user_id, total_amount, pay_amount, discount_amount, address, remark, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(orderNo, userId, totalAmount, payAmount, discountAmount, address || '', remark || '');

  const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo);
  const result = order.id;

  for (const item of orderItems) {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, spec_id, product_name, price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(result, item.product_id, item.spec_id || null, item.product_name, item.price, item.quantity, item.subtotal);
    
    db.prepare('UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?').run(item.quantity, item.quantity, item.product_id);
  }

  const deletePlaceholders = cartIds.map(() => '?').join(',');
  db.prepare(`DELETE FROM cart WHERE id IN (${deletePlaceholders}) AND user_id = ?`).run(...cartIds, userId);

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(result);

  res.json({
    success: true,
    data: {
      order_id: result,
      order_no: order.order_no,
      total_amount: order.total_amount,
      discount_amount: order.discount_amount,
      pay_amount: order.pay_amount,
      items
    }
  });
});

router.get('/', requireAuth, (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const db = getDb();
  const userId = req.user.id;

  let whereClause = 'user_id = ?';
  let params = [userId];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const total = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${whereClause}`).get(...params).count;

  const orders = db.prepare(`
    SELECT * FROM orders 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const orderIds = orders.map(o => o.id);
  let orderItems = [];
  
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',');
    orderItems = db.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`).all(...orderIds);
  }

  const itemsMap = {};
  orderItems.forEach(item => {
    if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
    itemsMap[item.order_id].push(item);
  });

  const statusMap = {
    'pending': '待支付',
    'paid': '待发货',
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  res.json({
    success: true,
    data: orders.map(order => ({
      id: order.id,
      order_no: order.order_no,
      total_amount: order.total_amount,
      pay_amount: order.pay_amount,
      discount_amount: order.discount_amount,
      status: order.status,
      status_text: statusMap[order.status] || order.status,
      address: order.address,
      remark: order.remark,
      pay_time: order.pay_time,
      ship_time: order.ship_time,
      complete_time: order.complete_time,
      created_at: order.created_at,
      items: itemsMap[order.id] || []
    })),
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.get('/:orderId', requireAuth, (req, res) => {
  const { orderId } = req.params;
  const db = getDb();
  const userId = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  const statusMap = {
    'pending': '待支付',
    'paid': '待发货',
    'shipped': '待收货',
    'completed': '已完成',
    'cancelled': '已取消'
  };

  res.json({
    success: true,
    data: {
      id: order.id,
      order_no: order.order_no,
      total_amount: order.total_amount,
      pay_amount: order.pay_amount,
      discount_amount: order.discount_amount,
      status: order.status,
      status_text: statusMap[order.status] || order.status,
      address: order.address,
      remark: order.remark,
      pay_time: order.pay_time,
      ship_time: order.ship_time,
      complete_time: order.complete_time,
      created_at: order.created_at,
      items
    }
  });
});

router.post('/:orderId/pay', requireAuth, (req, res) => {
  const { orderId } = req.params;
  const db = getDb();
  const userId = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单状态不允许支付' });
  }

  db.prepare("UPDATE orders SET status = 'paid', pay_time = datetime('now') WHERE id = ?").run(orderId);

  db.prepare(`
    INSERT INTO messages (user_id, type, title, content)
    VALUES (?, 'system', '订单支付成功', ?)
  `).run(userId, `您的订单 ${order.order_no} 支付成功`);

  res.json({
    success: true,
    message: '支付成功'
  });
});

router.post('/:orderId/cancel', requireAuth, (req, res) => {
  const { orderId } = req.params;
  const db = getDb();
  const userId = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单状态不允许取消' });
  }

  db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(orderId);
    
    const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(orderId);
    for (const item of items) {
      db.prepare('UPDATE products SET stock = stock + ?, sales_count = sales_count - ? WHERE id = ?').run(item.quantity, item.quantity, item.product_id);
    }
  })();

  res.json({
    success: true,
    message: '订单已取消'
  });
});

router.post('/:orderId/confirm', requireAuth, (req, res) => {
  const { orderId } = req.params;
  const db = getDb();
  const userId = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'shipped') {
    return res.status(400).json({ error: '订单状态不允许确认收货' });
  }

  db.prepare("UPDATE orders SET status = 'completed', complete_time = datetime('now') WHERE id = ?").run(orderId);

  res.json({
    success: true,
    message: '确认收货成功'
  });
});

router.post('/checkout', requireAuth, (req, res) => {
  const { cartIds, couponId } = req.body;
  const db = getDb();
  const userId = req.user.id;
  const user = req.user;

  if (!Array.isArray(cartIds) || cartIds.length === 0) {
    return res.status(400).json({ error: '请选择要购买的商品' });
  }

  const placeholders = cartIds.map(() => '?').join(',');
  const cartItems = db.prepare(`
    SELECT c.*, p.name, p.subtitle, p.original_price, p.member_price, p.activity_price, 
           p.stock, p.is_on_sale, p.images, p.supplier,
           ps.spec_name, ps.spec_value, ps.price_adjust
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    LEFT JOIN product_specs ps ON c.spec_id = ps.id
    WHERE c.id IN (${placeholders}) AND c.user_id = ? AND c.selected = 1
  `).all(...cartIds, userId);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: '请选择要购买的商品' });
  }

  for (const item of cartItems) {
    if (item.is_on_sale !== 1) {
      return res.status(400).json({ error: `商品"${item.name}"已下架` });
    }
    if (item.stock < item.quantity) {
      return res.status(400).json({ error: `商品"${item.name}"库存不足` });
    }
  }

  let totalAmount = 0;
  const items = cartItems.map(item => {
    const unitPrice = calculatePrice(item, user) + (item.price_adjust || 0);
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    return {
      cart_id: item.id,
      product_id: item.product_id,
      name: item.name,
      images: item.images,
      spec: item.spec_name && item.spec_value ? `${item.spec_name}: ${item.spec_value}` : null,
      unit_price: unitPrice,
      quantity: item.quantity,
      subtotal
    };
  });

  const availableCoupons = db.prepare(`
    SELECT uc.*, c.name, c.discount_value, c.min_amount, c.end_time
    FROM user_coupons uc
    JOIN coupons c ON uc.coupon_id = c.id
    WHERE uc.user_id = ? AND uc.status = 'available' 
    AND c.start_time <= datetime('now') AND c.end_time >= datetime('now')
  `).all(userId);

  let discountAmount = 0;
  let selectedCoupon = null;
  
  if (couponId) {
    selectedCoupon = availableCoupons.find(c => c.id == couponId);
    if (selectedCoupon && totalAmount >= selectedCoupon.min_amount) {
      discountAmount = selectedCoupon.discount_value;
    }
  }

  const payAmount = Math.max(0, totalAmount - discountAmount);

  res.json({
    success: true,
    data: {
      items,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      pay_amount: payAmount,
      coupons: availableCoupons.map(c => ({
        id: c.id,
        name: c.name,
        discount_value: c.discount_value,
        min_amount: c.min_amount,
        is_available: totalAmount >= c.min_amount
      })),
      selected_coupon: selectedCoupon ? {
        id: selectedCoupon.id,
        name: selectedCoupon.name,
        discount_value: selectedCoupon.discount_value
      } : null
    }
  });
});

module.exports = router;
