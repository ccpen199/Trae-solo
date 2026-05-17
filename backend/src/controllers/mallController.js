const { getDB } = require('../models/db');

async function getProducts(req, res) {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const db = getDB();
    let query = 'SELECT * FROM products WHERE status = ?';
    const params = ['active'];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const products = db.prepare(query).all(...params);

    const countQuery = category
      ? 'SELECT COUNT(*) as total FROM products WHERE status = ? AND category = ?'
      : 'SELECT COUNT(*) as total FROM products WHERE status = ?';
    const { total } = db.prepare(countQuery).get(category ? ['active', category] : ['active']);

    res.json({
      success: true,
      products: products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
}

async function createOrder(req, res) {
  try {
    const { items, address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: '请选择商品' });
    }

    const db = getDB();
    const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

    let totalAmount = 0;
    for (const item of items) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.productId);
      if (product) {
        totalAmount += product.price * (item.quantity || 1);
      }
    }

    const result = db.prepare(`
      INSERT INTO product_orders (user_id, order_no, total_amount, status, address)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(req.user.id, orderNo, totalAmount, address || '');

    const orderId = result.lastInsertRowid;

    for (const item of items) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.productId);
      if (product) {
        db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `).run(orderId, item.productId, item.quantity || 1, product.price);
      }
    }

    res.json({ success: true, message: '订单创建成功', orderNo, orderId });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ success: false, message: '创建订单失败' });
  }
}

async function getMyOrders(req, res) {
  try {
    const db = getDB();
    const orders = db.prepare(`
      SELECT * FROM product_orders 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    for (const order of orders) {
      order.items = db.prepare(`
        SELECT oi.*, p.name, p.images
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).all(order.id);
    }

    res.json({
      success: true,
      orders: orders.map(o => ({
        ...o,
        items: o.items.map(i => ({
          ...i,
          images: i.images ? JSON.parse(i.images) : []
        }))
      }))
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ success: false, message: '获取订单列表失败' });
  }
}

module.exports = { getProducts, createOrder, getMyOrders };
