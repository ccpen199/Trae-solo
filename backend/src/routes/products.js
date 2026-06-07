const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/categories', (req, res) => {
  res.json({
    categories: [
      { id: 'stamp', name: '集邮票品', count: 0 },
      { id: 'newspaper', name: '报刊订阅', count: 0 },
      { id: 'postcard', name: '封片卡', count: 0 },
      { id: 'culture', name: '定制文创', count: 0 },
      { id: 'magazine', name: '杂志' }
    ]
  });
});

router.get('/', (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const db = getDb();
  
  let query = 'SELECT * FROM products WHERE status = ?';
  let params = ['approved'];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  let countQuery = 'SELECT COUNT(*) as count FROM products WHERE status = ?';
  let countParams = ['approved'];
  if (category) {
    countQuery += ' AND category = ?';
    countParams.push(category);
  }
  if (search) {
    countQuery += ' AND (name LIKE ? OR description LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }
  const { count } = db.prepare(countQuery).get(...countParams);
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (page - 1) * limit);
  
  const products = db.prepare(query).all(...params);
  
  res.json({ products, total: count, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  res.json(product);
});

router.post('/', authenticateToken, (req, res) => {
  const { name, category, description, price, stock, is_limited } = req.body;
  const db = getDb();
  
  try {
    const result = db.prepare(`
      INSERT INTO products (name, category, description, price, stock, is_limited, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(name, category, description, price, stock || 0, is_limited || 0);
    
    res.json({ id: result.lastInsertRowid, message: '商品创建成功，等待审核' });
  } catch (err) {
    res.status(500).json({ error: '创建失败' });
  }
});

router.post('/:id/purchase', authenticateToken, (req, res) => {
  const { quantity = 1 } = req.body;
  const db = getDb();
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }
  
  if (product.status !== 'approved') {
    return res.status(400).json({ error: '商品未审核通过' });
  }
  
  if (product.stock < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }
  
  const orderNo = 'PO' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  
  const transaction = db.transaction(() => {
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, req.params.id);
    
    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, order_no, total_amount, status)
      VALUES (?, ?, ?, 'paid')
    `).run(req.user.id, orderNo, product.price * quantity);
    
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `).run(orderResult.lastInsertRowid, req.params.id, quantity, product.price);
    
    if (product.is_limited) {
      const serialNumber = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      db.prepare('UPDATE products SET serial_number = ? WHERE id = ?').run(serialNumber, req.params.id);
    }
    
    return { orderNo, totalAmount: product.price * quantity };
  });
  
  try {
    const result = transaction();
    res.json({ message: '购买成功', ...result });
  } catch (err) {
    res.status(500).json({ error: '购买失败' });
  }
});

module.exports = router;
