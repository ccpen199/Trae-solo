const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/products', authenticateToken, (req, res) => {
  const { category, keyword, is_preorder } = req.query;
  
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (keyword) {
    query += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }
  if (is_preorder !== undefined) {
    query += ' AND is_preorder = ?';
    params.push(is_preorder ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC';
  const products = db.prepare(query).all(...params);

  products.forEach(p => {
    if (p.images) {
      p.images = JSON.parse(p.images);
    }
  });

  res.json({ products });
});

router.get('/products/:id', authenticateToken, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (product.images) {
    product.images = JSON.parse(product.images);
  }

  res.json({ product });
});

router.post('/products', authenticateToken, requireAdmin, (req, res) => {
  const { sku, name, category, price, original_price, stock, description, images, is_preorder, preorder_deposit, preorder_release_date } = req.body;

  if (!sku || !name || !category || !price) {
    return res.status(400).json({ error: 'SKU, name, category and price are required' });
  }

  const result = db.prepare(`
    INSERT INTO products (sku, name, category, price, original_price, stock, description, images, is_preorder, preorder_deposit, preorder_release_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sku, name, category, price, original_price || null, stock || 0, description || null,
         images ? JSON.stringify(images) : null,
         is_preorder ? 1 : 0, preorder_deposit || null, preorder_release_date || null);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ product });
});

router.get('/orders', authenticateToken, (req, res) => {
  const { status } = req.query;
  
  let query = 'SELECT * FROM orders WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';
  const orders = db.prepare(query).all(...params);

  orders.forEach(order => {
    const items = db.prepare(`
      SELECT oi.*, p.name, p.images
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);
    order.items = items;
  });

  res.json({ orders });
});

router.post('/orders', authenticateToken, (req, res) => {
  const { items, shipping_address, n_coins_used = 0 } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (n_coins_used > user.n_coins) {
    return res.status(400).json({ error: 'Insufficient N coins' });
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (!product) {
      return res.status(400).json({ error: `Product ${item.product_id} not found` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    }
    totalAmount += product.price * item.quantity;
    orderItems.push({ product, quantity: item.quantity });
  }

  const finalAmount = totalAmount - n_coins_used * 0.01;

  const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

  const orderResult = db.prepare(`
    INSERT INTO orders (order_no, user_id, total_amount, n_coins_used, status, shipping_address)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(orderNo, req.user.id, finalAmount, n_coins_used, shipping_address || null);

  const orderId = orderResult.lastInsertRowid;

  for (const item of orderItems) {
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `).run(orderId, item.product.id, item.quantity, item.product.price);

    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product.id);
  }

  if (n_coins_used > 0) {
    db.prepare('UPDATE users SET n_coins = n_coins - ? WHERE id = ?').run(n_coins_used, req.user.id);
    db.prepare(`
      INSERT INTO ncoin_transactions (user_id, amount, type, description, order_id)
      VALUES (?, ?, 'spend', ?, ?)
    `).run(req.user.id, -n_coins_used, `Order ${orderNo}`, orderId);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderDetails = db.prepare(`
    SELECT oi.*, p.name, p.images
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId);
  order.items = orderDetails;

  res.status(201).json({ order });
});

router.get('/orders/:id', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const items = db.prepare(`
    SELECT oi.*, p.name, p.images
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);
  order.items = items;

  if (order.tracking_data) {
    order.tracking_data = JSON.parse(order.tracking_data);
  }

  res.json({ order });
});

router.put('/orders/:id/receipt', authenticateToken, (req, res) => {
  const { receipt_photo } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.prepare('UPDATE orders SET receipt_photo = ?, status = ? WHERE id = ?')
    .run(receipt_photo, 'delivered', req.params.id);

  res.json({ status: 'ok', message: 'Receipt uploaded successfully' });
});

router.get('/ncoins/balance', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT n_coins FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.n_coins });
});

router.get('/ncoins/transactions', authenticateToken, (req, res) => {
  const transactions = db.prepare(`
    SELECT * FROM ncoin_transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user.id);

  res.json({ transactions });
});

module.exports = router;
