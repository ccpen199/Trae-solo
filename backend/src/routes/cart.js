const express = require('express');
const db = require('../database');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/list', optionalAuth, (req, res) => {
  try {
    let cartItems = [];
    
    if (req.user) {
      cartItems = db.prepare(`
        SELECT c.id, c.user_id, c.product_id, c.quantity, c.selected,
               p.name, p.price, p.member_price, p.image, p.unit, p.stock, p.status
        FROM carts c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `).all(req.user.id);
    } else {
      const cartKey = req.headers['x-cart-key'] || 'guest_cart';
      cartItems = db.prepare(`
        SELECT c.id, c.cart_key, c.product_id, c.quantity, c.selected,
               p.name, p.price, p.member_price, p.image, p.unit, p.stock, p.status
        FROM carts c
        JOIN products p ON c.product_id = p.id
        WHERE c.cart_key = ?
        ORDER BY c.created_at DESC
      `).all(cartKey);
    }
    
    const isMember = req.user?.is_member || 0;
    const processedItems = cartItems.map(item => ({
      ...item,
      show_price: isMember && item.member_price ? item.member_price : item.price
    }));
    
    const selectedItems = processedItems.filter(item => item.selected);
    const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.show_price * item.quantity), 0);
    
    res.json({
      success: true,
      data: {
        list: processedItems,
        total_count: totalCount,
        total_amount: parseFloat(totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('获取购物车失败:', error);
    res.status(500).json({ success: false, message: '获取购物车失败' });
  }
});

router.post('/add', optionalAuth, (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ success: false, message: '请选择商品' });
    }
    
    const product = db.prepare('SELECT id, stock, status FROM products WHERE id = ?').get(product_id);
    if (!product || product.status !== 1) {
      return res.status(400).json({ success: false, message: '商品不存在或已下架' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: '库存不足' });
    }
    
    let existingItem;
    if (req.user) {
      existingItem = db.prepare('SELECT * FROM carts WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
    } else {
      const cartKey = req.headers['x-cart-key'] || 'guest_cart';
      existingItem = db.prepare('SELECT * FROM carts WHERE cart_key = ? AND product_id = ?').get(cartKey, product_id);
    }
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (req.user) {
        db.prepare('UPDATE carts SET quantity = ? WHERE id = ?').run(newQuantity, existingItem.id);
      } else {
        db.prepare('UPDATE carts SET quantity = ? WHERE id = ?').run(newQuantity, existingItem.id);
      }
    } else {
      if (req.user) {
        db.prepare('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
      } else {
        const cartKey = req.headers['x-cart-key'] || 'guest_cart';
        db.prepare('INSERT INTO carts (cart_key, product_id, quantity) VALUES (?, ?, ?)').run(cartKey, product_id, quantity);
      }
    }
    
    res.json({ success: true, message: '已添加到购物车' });
  } catch (error) {
    console.error('添加购物车失败:', error);
    res.status(500).json({ success: false, message: '添加购物车失败' });
  }
});

router.put('/update', optionalAuth, (req, res) => {
  try {
    const { cart_id, quantity, selected } = req.body;
    
    if (!cart_id) {
      return res.status(400).json({ success: false, message: '参数错误' });
    }
    
    const cartItem = db.prepare('SELECT * FROM carts WHERE id = ?').get(cart_id);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: '购物车项不存在' });
    }
    
    if (req.user) {
      if (cartItem.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: '无权限操作' });
      }
    }
    
    const updateFields = [];
    const values = [];
    
    if (quantity !== undefined) {
      const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(cartItem.product_id);
      if (product && product.stock < quantity) {
        return res.status(400).json({ success: false, message: '库存不足' });
      }
      updateFields.push('quantity = ?');
      values.push(quantity);
    }
    
    if (selected !== undefined) {
      updateFields.push('selected = ?');
      values.push(selected ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }
    
    values.push(cart_id);
    db.prepare(`UPDATE carts SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
    
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新购物车失败:', error);
    res.status(500).json({ success: false, message: '更新购物车失败' });
  }
});

router.delete('/remove', optionalAuth, (req, res) => {
  try {
    const { cart_id } = req.body;
    
    if (!cart_id) {
      return res.status(400).json({ success: false, message: '参数错误' });
    }
    
    const cartItem = db.prepare('SELECT * FROM carts WHERE id = ?').get(cart_id);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: '购物车项不存在' });
    }
    
    if (req.user) {
      if (cartItem.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: '无权限操作' });
      }
    }
    
    db.prepare('DELETE FROM carts WHERE id = ?').run(cart_id);
    
    res.json({ success: true, message: '已移除' });
  } catch (error) {
    console.error('移除购物车失败:', error);
    res.status(500).json({ success: false, message: '移除购物车失败' });
  }
});

router.delete('/clear', optionalAuth, (req, res) => {
  try {
    if (req.user) {
      db.prepare('DELETE FROM carts WHERE user_id = ?').run(req.user.id);
    } else {
      const cartKey = req.headers['x-cart-key'] || 'guest_cart';
      db.prepare('DELETE FROM carts WHERE cart_key = ?').run(cartKey);
    }
    
    res.json({ success: true, message: '购物车已清空' });
  } catch (error) {
    console.error('清空购物车失败:', error);
    res.status(500).json({ success: false, message: '清空购物车失败' });
  }
});

router.get('/count', optionalAuth, (req, res) => {
  try {
    let count = 0;
    
    if (req.user) {
      const result = db.prepare('SELECT SUM(quantity) as total FROM carts WHERE user_id = ?').get(req.user.id);
      count = result.total || 0;
    } else {
      const cartKey = req.headers['x-cart-key'] || 'guest_cart';
      const result = db.prepare('SELECT SUM(quantity) as total FROM carts WHERE cart_key = ?').get(cartKey);
      count = result.total || 0;
    }
    
    res.json({ success: true, data: { count: parseInt(count) } });
  } catch (error) {
    console.error('获取购物车数量失败:', error);
    res.status(500).json({ success: false, message: '获取购物车数量失败' });
  }
});

module.exports = router;
