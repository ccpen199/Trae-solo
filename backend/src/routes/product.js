const express = require('express');
const { db } = require('../utils/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/list', (req, res) => {
  try {
    const { category, keyword, page = 1, pageSize = 12 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = "WHERE status = 'online'";
    const params = [];

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    if (keyword) {
      whereClause += ' AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const products = db.prepare(`
      SELECT * FROM products 
      ${whereClause} 
      ORDER BY is_hot DESC, is_new DESC, id DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM products ${whereClause}`).get(...params).count;

    res.json({
      list: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        specs: p.specs ? JSON.parse(p.specs) : {}
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(id, 'online');
    
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      specs: product.specs ? JSON.parse(product.specs) : {}
    });
  } catch (err) {
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

function calculateTradeIn(productId, oldProductInfo) {
  const product = db.prepare('SELECT price FROM products WHERE id = ?').get(productId);
  if (!product) return 0;
  
  const baseRate = {
    '燃气灶': 0.15,
    '热水器': 0.1,
    '壁挂炉': 0.12,
    '其他': 0.05
  };
  
  const type = oldProductInfo?.type || '其他';
  const age = oldProductInfo?.age || 5;
  const condition = oldProductInfo?.condition || 'normal';
  
  let rate = baseRate[type] || baseRate['其他'];
  if (age > 5) rate *= 0.7;
  if (condition === 'good') rate *= 1.2;
  if (condition === 'poor') rate *= 0.6;
  
  return Math.floor(product.price * rate);
}

router.post('/trade-in/estimate', (req, res) => {
  try {
    const { product_id, old_product_info } = req.body;
    const estimatedValue = calculateTradeIn(product_id, old_product_info);
    
    res.json({
      estimated_value: estimatedValue,
      currency: 'CNY',
      valid_days: 30
    });
  } catch (err) {
    res.status(500).json({ error: '估价失败' });
  }
});

router.post('/order/create', authenticateToken, (req, res) => {
  try {
    const { product_id, quantity, receiver_name, receiver_phone, receiver_address, 
            appointment_time, trade_in, old_product_info } = req.body;

    if (!product_id || !quantity || !receiver_name || !receiver_phone || !receiver_address) {
      return res.status(400).json({ error: '请填写完整的订单信息' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = ?').get(product_id, 'online');
    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: '库存不足' });
    }

    const unit_price = product.price;
    let total_amount = unit_price * quantity;
    let trade_in_value = 0;

    if (trade_in && old_product_info) {
      trade_in_value = calculateTradeIn(product_id, old_product_info);
      total_amount = Math.max(0, total_amount - trade_in_value);
    }

    const order_no = `PO${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const tx = db.transaction(() => {
      const result = db.prepare(`INSERT INTO product_orders 
        (order_no, user_id, product_id, quantity, unit_price, total_amount, status, 
         receiver_name, receiver_phone, receiver_address, appointment_time, 
         old_product_info, trade_in_value)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`).run(
        order_no, req.user.id, product_id, quantity, unit_price, total_amount,
        receiver_name, receiver_phone, receiver_address, appointment_time,
        old_product_info ? JSON.stringify(old_product_info) : null,
        trade_in_value || null
      );

      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, product_id);

      return result.lastInsertRowid;
    });

    const orderId = tx();

    res.json({
      id: orderId,
      order_no,
      total_amount,
      trade_in_value,
      message: '订单创建成功'
    });
  } catch (err) {
    console.error('创建订单错误:', err);
    res.status(500).json({ error: '创建订单失败' });
  }
});

router.post('/order/:id/pay', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { pay_method } = req.body;

    const order = db.prepare('SELECT * FROM product_orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不正确' });
    }

    const tx = db.transaction(() => {
      db.prepare(`UPDATE product_orders SET status = 'paid', pay_time = CURRENT_TIMESTAMP WHERE id = ?`).run(id);

      const warrantyNo = `WR${Date.now()}`;
      const product = db.prepare('SELECT warranty_months FROM products WHERE id = ?').get(order.product_id);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (product?.warranty_months || 12));

      db.prepare(`INSERT INTO warranties 
        (warranty_no, order_id, product_id, user_id, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')`).run(
        warrantyNo, id, order.product_id, req.user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      db.prepare(`UPDATE product_orders SET warranty_no = ? WHERE id = ?`).run(warrantyNo, id);
    });

    tx();

    res.json({ message: '支付成功', order_id: id });
  } catch (err) {
    res.status(500).json({ error: '支付失败' });
  }
});

router.get('/order/my-orders', authenticateToken, (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE po.user_id = ?';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND po.status = ?';
      params.push(status);
    }

    const orders = db.prepare(`
      SELECT po.*, p.name as product_name, p.brand, p.category 
      FROM product_orders po 
      LEFT JOIN products p ON po.product_id = p.id 
      ${whereClause} 
      ORDER BY po.created_at DESC 
      LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM product_orders po ${whereClause}`).get(...params).count;

    res.json({
      list: orders.map(o => ({
        ...o,
        old_product_info: o.old_product_info ? JSON.parse(o.old_product_info) : null
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

router.get('/order/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT po.*, p.name as product_name, p.brand, p.category, p.specs, p.warranty_months
      FROM product_orders po
      LEFT JOIN products p ON po.product_id = p.id
      WHERE po.id = ? AND po.user_id = ?`).get(id, req.user.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json({
      ...order,
      specs: order.specs ? JSON.parse(order.specs) : {},
      old_product_info: order.old_product_info ? JSON.parse(order.old_product_info) : null
    });
  } catch (err) {
    console.error('获取订单详情错误:', err);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

router.get('/warranty/my-warranties', authenticateToken, (req, res) => {
  try {
    const warranties = db.prepare(`
      SELECT w.*, p.name as product_name, p.brand, p.specs, p.warranty_months, po.order_no, po.created_at as purchase_date
      FROM warranties w 
      LEFT JOIN products p ON w.product_id = p.id 
      LEFT JOIN product_orders po ON w.order_id = po.id 
      WHERE w.user_id = ? 
      ORDER BY w.created_at DESC`).all(req.user.id);

    res.json({ 
      list: warranties.map(w => ({
        ...w,
        specs: w.specs ? JSON.parse(w.specs) : {}
      }))
    });
  } catch (err) {
    res.status(500).json({ error: '获取电子质保失败' });
  }
});

module.exports = router;
