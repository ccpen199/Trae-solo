const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const isVip = req.user.is_vip === 1;
  
  const cartItems = db.prepare(`
    SELECT 
      c.id, c.product_id, c.quantity, c.selected,
      p.name, p.image, p.price, p.vip_price, 
      ${isVip ? 'p.vip_price as show_price' : 'p.price as show_price'},
      p.stock, p.unit, p.spec
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId);
  
  const selectedItems = cartItems.filter(item => item.selected === 1 && item.stock > 0);
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.show_price * item.quantity, 0);
  const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  
  res.json({
    code: 0,
    data: {
      items: cartItems,
      selectedItems,
      totalAmount,
      totalCount
    }
  });
});

router.post('/add', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;
  
  if (!productId) {
    return res.status(400).json({ code: 400, message: '请选择商品' });
  }
  
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  
  if (product.stock <= 0) {
    return res.status(400).json({ code: 400, message: '商品已售罄' });
  }
  
  const existing = db.prepare(
    'SELECT * FROM carts WHERE user_id = ? AND product_id = ?'
  ).get(userId, productId);
  
  if (existing) {
    const newQuantity = existing.quantity + quantity;
    if (newQuantity > product.stock) {
      return res.status(400).json({ code: 400, message: '库存不足' });
    }
    db.prepare(
      'UPDATE carts SET quantity = ?, selected = 1, updated_at = datetime("now") WHERE user_id = ? AND product_id = ?'
    ).run(newQuantity, userId, productId);
  } else {
    if (quantity > product.stock) {
      return res.status(400).json({ code: 400, message: '库存不足' });
    }
    db.prepare(
      'INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)'
    ).run(userId, productId, quantity);
  }
  
  const cartCount = db.prepare(
    'SELECT SUM(quantity) as count FROM carts WHERE user_id = ?'
  ).get(userId);
  
  res.json({
    code: 0,
    message: '添加成功',
    data: {
      cartCount: cartCount.count || 0
    }
  });
});

router.put('/update', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { productId, quantity, selected } = req.body;
  
  if (!productId) {
    return res.status(400).json({ code: 400, message: '请选择商品' });
  }
  
  const cartItem = db.prepare(
    'SELECT * FROM carts WHERE user_id = ? AND product_id = ?'
  ).get(userId, productId);
  
  if (!cartItem) {
    return res.status(404).json({ code: 404, message: '购物车中无此商品' });
  }
  
  if (quantity !== undefined) {
    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
    if (quantity > product.stock) {
      return res.status(400).json({ code: 400, message: '库存不足' });
    }
    if (quantity <= 0) {
      db.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?').run(userId, productId);
      return res.json({ code: 0, message: '已移除商品' });
    }
    db.prepare(
      'UPDATE carts SET quantity = ?, updated_at = datetime("now") WHERE user_id = ? AND product_id = ?'
    ).run(quantity, userId, productId);
  }
  
  if (selected !== undefined) {
    db.prepare(
      'UPDATE carts SET selected = ?, updated_at = datetime("now") WHERE user_id = ? AND product_id = ?'
    ).run(selected ? 1 : 0, userId, productId);
  }
  
  res.json({ code: 0, message: '更新成功' });
});

router.delete('/remove', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;
  
  if (!productId) {
    return res.status(400).json({ code: 400, message: '请选择商品' });
  }
  
  db.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?').run(userId, productId);
  
  res.json({ code: 0, message: '移除成功' });
});

router.put('/select-all', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { selected } = req.body;
  
  db.prepare(
    'UPDATE carts SET selected = ?, updated_at = datetime("now") WHERE user_id = ?'
  ).run(selected ? 1 : 0, userId);
  
  res.json({ code: 0, message: '更新成功' });
});

module.exports = router;
