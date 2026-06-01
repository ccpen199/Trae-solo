import express from 'express';
import db from '../database.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { category, page = 1, limit = 10, keyword } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM products WHERE status = 1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (keyword) {
    query += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }

  query += ' ORDER BY sales DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const products = db.prepare(query).all(...params);

  const countQuery = 'SELECT COUNT(*) as total FROM products WHERE status = 1';
  const { total } = db.prepare(countQuery).get();

  res.json({
    success: true,
    data: {
      list: products,
      total,
      page: Number(page),
      limit: Number(limit)
    }
  });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products WHERE status = 1').all();
  res.json({ success: true, data: categories.map(c => c.category) });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  res.json({ success: true, data: product });
});

router.get('/cart/list', auth, (req, res) => {
  const userId = req.user.id;
  
  const carts = db.prepare(`
    SELECT c.*, p.name, p.price, p.images, p.original_price
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `).all(userId);

  res.json({ success: true, data: carts });
});

router.post('/cart/add', auth, (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) {
    return res.status(404).json({ error: '商品不存在' });
  }

  const existing = db.prepare('SELECT * FROM carts WHERE user_id = ? AND product_id = ?').get(userId, product_id);
  
  if (existing) {
    db.prepare('UPDATE carts SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, product_id, quantity);
  }

  res.json({ success: true, message: '已添加到购物车' });
});

router.delete('/cart/:id', auth, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ success: true, message: '已删除' });
});

router.post('/cart/update', auth, (req, res) => {
  const userId = req.user.id;
  const { id, quantity } = req.body;

  db.prepare('UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, id, userId);
  res.json({ success: true, message: '已更新' });
});

export default router;
