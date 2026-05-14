const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const cartItems = db.prepare(`
    SELECT c.*, p.name, p.price, p.original_price, p.images, p.stock as product_stock
    FROM carts c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
    ORDER BY c.updated_at DESC
  `).all(req.user.id);
  
  let totalAmount = 0;
  let totalSelectedItems = 0;
  
  const items = cartItems.map(item => {
    let images = [];
    try {
      images = JSON.parse(item.images);
    } catch (e) {
      images = [];
    }
    
    const price = item.price;
    const amount = item.selected === 1 ? price * item.quantity : 0;
    if (item.selected === 1) {
      totalAmount += amount;
      totalSelectedItems += item.quantity;
    }
    
    return {
      ...item,
      images,
      amount
    };
  });
  
  res.json({
    items,
    total_amount: totalAmount,
    total_selected_items: totalSelectedItems
  });
});

router.post('/add', authenticate, (req, res) => {
  const { product_id, sku_id, quantity = 1 } = req.body;
  
  if (!product_id) {
    return res.status(400).json({ error: 'Product id is required' });
  }
  
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND status = 1').get(product_id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const existingItem = db.prepare(`
    SELECT * FROM carts 
    WHERE user_id = ? AND product_id = ? AND COALESCE(sku_id, 0) = COALESCE(?, 0)
  `).get(req.user.id, product_id, sku_id || null);
  
  if (existingItem) {
    db.prepare('UPDATE carts SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(quantity, existingItem.id);
  } else {
    db.prepare(`
      INSERT INTO carts (user_id, product_id, sku_id, quantity)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, product_id, sku_id, quantity);
  }
  
  const totalCount = db.prepare('SELECT SUM(quantity) as total FROM carts WHERE user_id = ?')
    .get(req.user.id);
  
  res.json({ 
    success: true, 
    cart_count: totalCount.total || 0 
  });
});

router.put('/update', authenticate, (req, res) => {
  const { id, quantity, selected } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Cart item id is required' });
  }
  
  const cartItem = db.prepare('SELECT * FROM carts WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);
  
  if (!cartItem) {
    return res.status(404).json({ error: 'Cart item not found' });
  }
  
  const updates = [];
  const values = [];
  
  if (quantity !== undefined) {
    updates.push('quantity = ?');
    values.push(quantity);
  }
  
  if (selected !== undefined) {
    updates.push('selected = ?');
    values.push(selected ? 1 : 0);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(id, req.user.id);
  
  db.prepare(`UPDATE carts SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`)
    .run(...values);
  
  res.json({ success: true });
});

router.post('/select-all', authenticate, (req, res) => {
  const { selected } = req.body;
  
  db.prepare('UPDATE carts SET selected = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
    .run(selected ? 1 : 0, req.user.id);
  
  res.json({ success: true });
});

router.delete('/remove', authenticate, (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Cart item ids are required' });
  }
  
  const placeholders = ids.map(() => '?').join(',');
  const params = [...ids, req.user.id];
  
  db.prepare(`DELETE FROM carts WHERE id IN (${placeholders}) AND user_id = ?`)
    .run(...params);
  
  res.json({ success: true });
});

router.get('/count', authenticate, (req, res) => {
  const result = db.prepare('SELECT SUM(quantity) as total FROM carts WHERE user_id = ?')
    .get(req.user.id);
  
  res.json({ count: result.total || 0 });
});

module.exports = router;
