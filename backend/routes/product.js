const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middleware/auth');

router.get('/list', (req, res) => {
  const db = req.db;
  const { categoryId, keyword, sort = 'default', page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  let query = `SELECT id, name, price, original_price, stock, sales, main_image, is_hot, is_new, is_recommend FROM products WHERE status = 1`;
  let params = [];
  let countQuery = `SELECT COUNT(*) as total FROM products WHERE status = 1`;
  let countParams = [];

  if (categoryId) {
    query += ` AND category_id = ?`;
    params.push(categoryId);
    countQuery += ` AND category_id = ?`;
    countParams.push(categoryId);
  }

  if (keyword) {
    query += ` AND name LIKE ?`;
    params.push(`%${keyword}%`);
    countQuery += ` AND name LIKE ?`;
    countParams.push(`%${keyword}%`);
  }

  switch (sort) {
    case 'sales':
      query += ` ORDER BY sales DESC`;
      break;
    case 'price_asc':
      query += ` ORDER BY price ASC`;
      break;
    case 'price_desc':
      query += ` ORDER BY price DESC`;
      break;
    case 'new':
      query += ` ORDER BY created_at DESC`;
      break;
    default:
      query += ` ORDER BY is_recommend DESC, sales DESC`;
  }

  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(pageSize), offset);

  const products = db.prepare(query).all(...params);
  const countResult = db.prepare(countQuery).get(...countParams);

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: products,
      page: parseInt(page),
      page_size: parseInt(pageSize),
      total: countResult?.total || 0
    }
  });
});

router.get('/detail/:id', optionalAuth, (req, res) => {
  const db = req.db;
  const { id } = req.params;

  const product = db.prepare(`
    SELECT * FROM products WHERE id = ? AND status = 1
  `).get(id);

  if (!product) {
    return res.json({
      code: 404,
      message: '商品不存在'
    });
  }

  try {
    product.images = JSON.parse(product.images || '[]');
  } catch (e) {
    product.images = [];
  }

  let isFavorite = false;
  if (req.user) {
    const favorite = db.prepare(`
      SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
    `).get(req.user.userId, id);
    isFavorite = !!favorite;
  }

  res.json({
    code: 200,
    message: 'success',
    data: {
      ...product,
      is_favorite: isFavorite
    }
  });
});

router.get('/search', (req, res) => {
  const db = req.db;
  const { keyword, page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  if (!keyword) {
    return res.json({
      code: 400,
      message: '请输入搜索关键词'
    });
  }

  const products = db.prepare(`
    SELECT id, name, price, original_price, stock, sales, main_image, is_hot, is_new, is_recommend
    FROM products 
    WHERE status = 1 AND name LIKE ?
    ORDER BY sales DESC
    LIMIT ? OFFSET ?
  `).all(`%${keyword}%`, parseInt(pageSize), offset);

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM products WHERE status = 1 AND name LIKE ?
  `).get(`%${keyword}%`);

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: products,
      page: parseInt(page),
      page_size: parseInt(pageSize),
      total: countResult?.total || 0
    }
  });
});

router.post('/scan', (req, res) => {
  const db = req.db;
  const { barcode } = req.body;

  if (!barcode) {
    return res.json({
      code: 400,
      message: '请提供条形码'
    });
  }

  const product = db.prepare(`
    SELECT id, name, price, original_price, stock, main_image
    FROM products 
    WHERE id = ? OR name LIKE ?
    LIMIT 1
  `).get(barcode, `%${barcode}%`);

  if (!product) {
    return res.json({
      code: 404,
      message: '未找到该商品'
    });
  }

  res.json({
    code: 200,
    message: 'success',
    data: product
  });
});

router.post('/favorite', authMiddleware, (req, res) => {
  const db = req.db;
  const { productId } = req.body;
  const userId = req.user.userId;

  if (!productId) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }

  const product = db.prepare(`SELECT id FROM products WHERE id = ?`).get(productId);
  if (!product) {
    return res.json({
      code: 404,
      message: '商品不存在'
    });
  }

  const existing = db.prepare(`
    SELECT id FROM favorites WHERE user_id = ? AND product_id = ?
  `).get(userId, productId);

  if (existing) {
    db.prepare(`DELETE FROM favorites WHERE id = ?`).run(existing.id);
    res.json({
      code: 200,
      message: '已取消收藏',
      data: { is_favorite: false }
    });
  } else {
    db.prepare(`
      INSERT INTO favorites (user_id, product_id) VALUES (?, ?)
    `).run(userId, productId);
    res.json({
      code: 200,
      message: '已收藏',
      data: { is_favorite: true }
    });
  }
});

router.get('/favorites', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);

  const favorites = db.prepare(`
    SELECT f.id, f.created_at, p.*
    FROM favorites f
    JOIN products p ON f.product_id = p.id
    WHERE f.user_id = ? AND p.status = 1
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, parseInt(pageSize), offset);

  const countResult = db.prepare(`
    SELECT COUNT(*) as total FROM favorites WHERE user_id = ?
  `).get(userId);

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: favorites,
      page: parseInt(page),
      page_size: parseInt(pageSize),
      total: countResult?.total || 0
    }
  });
});

router.get('/cart', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;

  const cartItems = db.prepare(`
    SELECT c.id, c.quantity, c.selected, p.*
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ? AND p.status = 1
    ORDER BY c.created_at DESC
  `).all(userId);

  let totalAmount = 0;
  let selectedCount = 0;

  cartItems.forEach(item => {
    if (item.selected) {
      totalAmount += item.price * item.quantity;
      selectedCount += item.quantity;
    }
  });

  res.json({
    code: 200,
    message: 'success',
    data: {
      list: cartItems,
      total_amount: totalAmount,
      selected_count: selectedCount,
      total_count: cartItems.length
    }
  });
});

router.post('/cart/add', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }

  const product = db.prepare(`SELECT id, stock FROM products WHERE id = ?`).get(productId);
  if (!product) {
    return res.json({
      code: 404,
      message: '商品不存在'
    });
  }

  const existing = db.prepare(`
    SELECT id, quantity FROM carts WHERE user_id = ? AND product_id = ?
  `).get(userId, productId);

  if (existing) {
    const newQuantity = existing.quantity + parseInt(quantity);
    if (newQuantity > product.stock) {
      return res.json({
        code: 400,
        message: '库存不足'
      });
    }
    db.prepare(`
      UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newQuantity, existing.id);
  } else {
    if (parseInt(quantity) > product.stock) {
      return res.json({
        code: 400,
        message: '库存不足'
      });
    }
    db.prepare(`
      INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)
    `).run(userId, productId, parseInt(quantity));
  }

  const cartCount = db.prepare(`
    SELECT SUM(quantity) as count FROM carts WHERE user_id = ?
  `).get(userId);

  res.json({
    code: 200,
    message: '已加入购物车',
    data: {
      cart_count: cartCount?.count || 0
    }
  });
});

router.post('/cart/update', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { cartId, quantity, selected } = req.body;

  if (!cartId) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }

  const cartItem = db.prepare(`
    SELECT c.*, p.stock FROM carts c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.id = ? AND c.user_id = ?
  `).get(cartId, userId);

  if (!cartItem) {
    return res.json({
      code: 404,
      message: '购物车项不存在'
    });
  }

  if (quantity !== undefined) {
    if (parseInt(quantity) > cartItem.stock) {
      return res.json({
        code: 400,
        message: '库存不足'
      });
    }
    db.prepare(`
      UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(parseInt(quantity), cartId);
  }

  if (selected !== undefined) {
    db.prepare(`UPDATE carts SET selected = ? WHERE id = ?`).run(selected ? 1 : 0, cartId);
  }

  res.json({
    code: 200,
    message: '更新成功'
  });
});

router.post('/cart/remove', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { cartIds } = req.body;

  if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
    return res.json({
      code: 400,
      message: '参数错误'
    });
  }

  const placeholders = cartIds.map(() => '?').join(',');
  db.prepare(`
    DELETE FROM carts WHERE id IN (${placeholders}) AND user_id = ?
  `).run(...cartIds, userId);

  res.json({
    code: 200,
    message: '已删除'
  });
});

router.post('/order/create', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { items, couponId, address } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({
      code: 400,
      message: '请选择商品'
    });
  }

  const tx = db.transaction(() => {
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare(`
        SELECT id, name, price, main_image, stock FROM products WHERE id = ?
      `).get(item.productId);

      if (!product) {
        throw new Error(`商品不存在: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`商品库存不足: ${product.name}`);
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        product,
        quantity: item.quantity,
        amount: product.price * item.quantity
      });
    }

    let discountAmount = 0;
    if (couponId) {
      const userCoupon = db.prepare(`
        SELECT uc.*, c.discount_amount, c.min_amount, c.type
        FROM user_coupons uc
        JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.id = ? AND uc.user_id = ? AND uc.status = 'unused'
      `).get(couponId, userId);

      if (userCoupon) {
        if (totalAmount >= userCoupon.min_amount) {
          discountAmount = userCoupon.discount_amount;
          db.prepare(`
            UPDATE user_coupons SET status = 'used' WHERE id = ?
          `).run(userCoupon.id);
        }
      }
    }

    const payAmount = Math.max(0, totalAmount - discountAmount);
    const orderNo = 'O' + Date.now().toString() + Math.random().toString(36).substr(2, 6).toUpperCase();

    const orderResult = db.prepare(`
      INSERT INTO orders (order_no, user_id, total_amount, discount_amount, pay_amount, type, status)
      VALUES (?, ?, ?, ?, ?, 'product', 'pending')
    `).run(orderNo, userId, totalAmount, discountAmount, payAmount);

    const orderId = orderResult.lastInsertRowid;

    for (const item of orderItems) {
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, item.product.id, item.product.name, item.product.main_image, item.product.price, item.quantity, item.amount);

      db.prepare(`
        UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?
      `).run(item.quantity, item.quantity, item.product.id);
    }

    const cartIds = items.filter(i => i.cartId).map(i => i.cartId);
    if (cartIds.length > 0) {
      const placeholders = cartIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM carts WHERE id IN (${placeholders})`).run(...cartIds);
    }

    return {
      orderId,
      orderNo,
      totalAmount,
      discountAmount,
      payAmount
    };
  });

  try {
    const result = tx();
    res.json({
      code: 200,
      message: '订单创建成功',
      data: result
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message
    });
  }
});

router.post('/order/pay', authMiddleware, (req, res) => {
  const db = req.db;
  const userId = req.user.userId;
  const { orderId, payType = 'balance' } = req.body;

  const order = db.prepare(`
    SELECT * FROM orders WHERE id = ? AND user_id = ?
  `).get(orderId, userId);

  if (!order) {
    return res.json({
      code: 404,
      message: '订单不存在'
    });
  }

  if (order.status !== 'pending') {
    return res.json({
      code: 400,
      message: '订单状态不正确'
    });
  }

  const tx = db.transaction(() => {
    if (payType === 'balance') {
      const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
      
      if (user.balance < order.pay_amount) {
        throw new Error('余额不足，请先充值');
      }

      db.prepare(`
        UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(order.pay_amount, userId);

      db.prepare(`
        INSERT INTO wallet_transactions (user_id, type, amount, balance_after, description, related_id)
        VALUES (?, 'pay', ?, ?, '订单支付', ?)
      `).run(userId, order.pay_amount, user.balance - order.pay_amount, order.id);
    }

    db.prepare(`
      UPDATE orders SET status = 'paid', pay_type = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payType, orderId);

    const pointsEarned = Math.floor(order.pay_amount);
    db.prepare(`
      UPDATE users SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(pointsEarned, userId);
  });

  try {
    tx();
    res.json({
      code: 200,
      message: '支付成功'
    });
  } catch (error) {
    res.json({
      code: 400,
      message: error.message
    });
  }
});

module.exports = router;
