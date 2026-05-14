const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { optionalAuth, requireAuth, isVip } = require('../middleware/auth');

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

const getSessionId = (req) => {
  return req.headers['x-session-id'] || uuidv4();
};

const getCartItems = (db, userId, sessionId, user) => {
  let items;
  
  if (userId) {
    items = db.prepare(`
      SELECT c.*, p.name, p.subtitle, p.original_price, p.member_price, p.activity_price, 
             p.stock, p.is_on_sale, p.images, p.supplier,
             ps.spec_name, ps.spec_value, ps.price_adjust
      FROM cart c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN product_specs ps ON c.spec_id = ps.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);
  } else {
    items = db.prepare(`
      SELECT c.*, p.name, p.subtitle, p.original_price, p.member_price, p.activity_price, 
             p.stock, p.is_on_sale, p.images, p.supplier,
             ps.spec_name, ps.spec_value, ps.price_adjust
      FROM cart c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN product_specs ps ON c.spec_id = ps.id
      WHERE c.session_id = ?
      ORDER BY c.created_at DESC
    `).all(sessionId);
  }

  return items.map(item => {
    const basePrice = calculatePrice(item, user);
    const unitPrice = basePrice + (item.price_adjust || 0);
    const isValid = item.is_on_sale === 1 && item.stock > 0 && item.stock >= item.quantity;
    
    return {
      id: item.id,
      product_id: item.product_id,
      spec_id: item.spec_id,
      name: item.name,
      subtitle: item.subtitle,
      images: item.images,
      supplier: item.supplier,
      spec: item.spec_name && item.spec_value ? `${item.spec_name}: ${item.spec_value}` : null,
      unit_price: unitPrice,
      original_price: item.original_price,
      quantity: item.quantity,
      selected: item.selected === 1,
      subtotal: unitPrice * item.quantity,
      stock: item.stock,
      is_on_sale: item.is_on_sale,
      is_valid: isValid
    };
  });
};

router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const userId = req.user?.id;
  const sessionId = getSessionId(req);
  const user = req.user;

  const items = getCartItems(db, userId, sessionId, user);
  const selectedItems = items.filter(item => item.selected && item.is_valid);
  
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    success: true,
    data: {
      items,
      total_count: totalCount,
      total_amount: totalAmount,
      session_id: userId ? null : sessionId
    }
  });
});

router.post('/add', optionalAuth, (req, res) => {
  const { productId, specId, quantity = 1 } = req.body;
  const db = getDb();
  const userId = req.user?.id;
  const sessionId = getSessionId(req);

  if (!productId) {
    return res.status(400).json({ error: '请选择商品' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  
  if (!product) {
    return res.status(400).json({ error: '商品不存在' });
  }

  if (product.is_on_sale !== 1) {
    return res.status(400).json({ error: '商品已下架' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ error: '库存不足' });
  }

  if (specId) {
    const spec = db.prepare('SELECT * FROM product_specs WHERE id = ? AND product_id = ?').get(specId, productId);
    if (!spec) {
      return res.status(400).json({ error: '商品规格不存在' });
    }
    if (spec.stock < quantity) {
      return res.status(400).json({ error: '规格库存不足' });
    }
  }

  let existingItem;
  if (userId) {
    existingItem = db.prepare(`
      SELECT * FROM cart WHERE user_id = ? AND product_id = ? ${specId ? 'AND spec_id = ?' : ''}
    `).get(userId, productId, ...(specId ? [specId] : []));
  } else {
    existingItem = db.prepare(`
      SELECT * FROM cart WHERE session_id = ? AND product_id = ? ${specId ? 'AND spec_id = ?' : ''}
    `).get(sessionId, productId, ...(specId ? [specId] : []));
  }

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    
    if (newQuantity > product.stock) {
      return res.status(400).json({ error: '超出库存限制' });
    }

    if (userId) {
      db.prepare('UPDATE cart SET quantity = ?, selected = 1 WHERE id = ?').run(newQuantity, existingItem.id);
    } else {
      db.prepare('UPDATE cart SET quantity = ?, selected = 1 WHERE id = ?').run(newQuantity, existingItem.id);
    }
  } else {
    if (userId) {
      db.prepare(`
        INSERT INTO cart (user_id, product_id, spec_id, quantity, selected)
        VALUES (?, ?, ?, ?, 1)
      `).run(userId, productId, specId || null, quantity);
    } else {
      db.prepare(`
        INSERT INTO cart (session_id, product_id, spec_id, quantity, selected)
        VALUES (?, ?, ?, ?, 1)
      `).run(sessionId, productId, specId || null, quantity);
    }
  }

  const user = req.user;
  const items = getCartItems(db, userId, sessionId, user);
  
  res.json({
    success: true,
    message: '已加入购物车',
    data: {
      cart_count: items.reduce((sum, item) => sum + item.quantity, 0)
    }
  });
});

router.put('/update', optionalAuth, (req, res) => {
  const { cartId, quantity, selected } = req.body;
  const db = getDb();
  const userId = req.user?.id;
  const sessionId = getSessionId(req);
  const user = req.user;

  if (!cartId) {
    return res.status(400).json({ error: '参数错误' });
  }

  let cartItem;
  if (userId) {
    cartItem = db.prepare('SELECT * FROM cart WHERE id = ? AND user_id = ?').get(cartId, userId);
  } else {
    cartItem = db.prepare('SELECT * FROM cart WHERE id = ? AND session_id = ?').get(cartId, sessionId);
  }

  if (!cartItem) {
    return res.status(400).json({ error: '购物车项不存在' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(cartItem.product_id);
  
  if (quantity !== undefined) {
    if (quantity < 1) {
      return res.status(400).json({ error: '数量不能小于1' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ error: '超出库存限制' });
    }
    db.prepare('UPDATE cart SET quantity = ? WHERE id = ?').run(quantity, cartId);
  }

  if (selected !== undefined) {
    db.prepare('UPDATE cart SET selected = ? WHERE id = ?').run(selected ? 1 : 0, cartId);
  }

  const items = getCartItems(db, userId, sessionId, user);
  const selectedItems = items.filter(item => item.selected && item.is_valid);

  res.json({
    success: true,
    data: {
      items,
      total_count: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: selectedItems.reduce((sum, item) => sum + item.subtotal, 0)
    }
  });
});

router.post('/select-all', optionalAuth, (req, res) => {
  const { selected } = req.body;
  const db = getDb();
  const userId = req.user?.id;
  const sessionId = getSessionId(req);
  const user = req.user;

  const selectedVal = selected ? 1 : 0;

  if (userId) {
    db.prepare('UPDATE cart SET selected = ? WHERE user_id = ?').run(selectedVal, userId);
  } else {
    db.prepare('UPDATE cart SET selected = ? WHERE session_id = ?').run(selectedVal, sessionId);
  }

  const items = getCartItems(db, userId, sessionId, user);
  const selectedItems = items.filter(item => item.selected && item.is_valid);

  res.json({
    success: true,
    data: {
      items,
      total_count: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: selectedItems.reduce((sum, item) => sum + item.subtotal, 0)
    }
  });
});

router.delete('/:cartId', optionalAuth, (req, res) => {
  const { cartId } = req.params;
  const db = getDb();
  const userId = req.user?.id;
  const sessionId = getSessionId(req);
  const user = req.user;

  if (userId) {
    db.prepare('DELETE FROM cart WHERE id = ? AND user_id = ?').run(cartId, userId);
  } else {
    db.prepare('DELETE FROM cart WHERE id = ? AND session_id = ?').run(cartId, sessionId);
  }

  const items = getCartItems(db, userId, sessionId, user);
  const selectedItems = items.filter(item => item.selected && item.is_valid);

  res.json({
    success: true,
    data: {
      items,
      total_count: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: selectedItems.reduce((sum, item) => sum + item.subtotal, 0)
    }
  });
});

router.delete('/', optionalAuth, (req, res) => {
  const { cartIds } = req.body;
  const db = getDb();
  const userId = req.user?.id;
  const sessionId = getSessionId(req);
  const user = req.user;

  if (!Array.isArray(cartIds) || cartIds.length === 0) {
    return res.status(400).json({ error: '请选择要删除的商品' });
  }

  const placeholders = cartIds.map(() => '?').join(',');
  
  if (userId) {
    db.prepare(`DELETE FROM cart WHERE id IN (${placeholders}) AND user_id = ?`).run(...cartIds, userId);
  } else {
    db.prepare(`DELETE FROM cart WHERE id IN (${placeholders}) AND session_id = ?`).run(...cartIds, sessionId);
  }

  const items = getCartItems(db, userId, sessionId, user);
  const selectedItems = items.filter(item => item.selected && item.is_valid);

  res.json({
    success: true,
    data: {
      items,
      total_count: selectedItems.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: selectedItems.reduce((sum, item) => sum + item.subtotal, 0)
    }
  });
});

router.post('/merge', requireAuth, (req, res) => {
  const { sessionId } = req.body;
  const db = getDb();
  const userId = req.user.id;

  if (!sessionId) {
    return res.json({ success: true, message: '无需合并' });
  }

  const guestItems = db.prepare('SELECT * FROM cart WHERE session_id = ?').all(sessionId);

  for (const guestItem of guestItems) {
    const existing = db.prepare(`
      SELECT * FROM cart WHERE user_id = ? AND product_id = ? 
      AND (spec_id = ? OR (spec_id IS NULL AND ? IS NULL))
    `).get(userId, guestItem.product_id, guestItem.spec_id, guestItem.spec_id);

    if (existing) {
      db.prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?').run(guestItem.quantity, existing.id);
    } else {
      db.prepare(`
        INSERT INTO cart (user_id, product_id, spec_id, quantity, selected)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, guestItem.product_id, guestItem.spec_id, guestItem.quantity, guestItem.selected);
    }
  }

  db.prepare('DELETE FROM cart WHERE session_id = ?').run(sessionId);

  const user = req.user;
  const items = getCartItems(db, userId, null, user);

  res.json({
    success: true,
    message: '购物车已合并',
    data: {
      items,
      cart_count: items.reduce((sum, item) => sum + item.quantity, 0)
    }
  });
});

module.exports = router;
