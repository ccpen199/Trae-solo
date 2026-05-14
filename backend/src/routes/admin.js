const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const { requireAdmin } = require('../middleware/auth');

router.get('/stats', requireAdmin, (req, res) => {
  const db = getDb();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const totalSales = db.prepare("SELECT COALESCE(SUM(pay_amount), 0) as total FROM orders WHERE status IN ('paid', 'shipped', 'completed')").get().total;

  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count FROM orders 
    WHERE DATE(created_at) = DATE('now')
  `).get().count;

  const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get().count;

  res.json({
    success: true,
    data: {
      user_count: userCount,
      product_count: productCount,
      order_count: orderCount,
      total_sales: totalSales,
      today_orders: todayOrders,
      pending_orders: pendingOrders
    }
  });
});

router.get('/products', requireAdmin, (req, res) => {
  const { page = 1, pageSize = 20, keyword, isOnSale } = req.query;
  const db = getDb();

  let whereClause = '1=1';
  let params = [];

  if (keyword) {
    whereClause += ' AND (name LIKE ? OR subtitle LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (isOnSale !== undefined) {
    whereClause += ' AND is_on_sale = ?';
    params.push(isOnSale === '1' ? 1 : 0);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const total = db.prepare(`SELECT COUNT(*) as count FROM products WHERE ${whereClause}`).get(...params).count;

  const products = db.prepare(`
    SELECT * FROM products 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.post('/products', requireAdmin, (req, res) => {
  const { 
    name, subtitle, category_id, original_price, member_price, activity_price,
    stock, description, images, is_on_sale, is_new, is_hot, brand, supplier
  } = req.body;

  if (!name || !original_price) {
    return res.status(400).json({ error: '商品名称和原价必填' });
  }

  const db = getDb();
  
  const result = db.prepare(`
    INSERT INTO products (name, subtitle, category_id, original_price, member_price, activity_price, 
                          stock, description, images, is_on_sale, is_new, is_hot, brand, supplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, subtitle || null, category_id || null, original_price, member_price || null, activity_price || null,
    stock || 0, description || null, images || null, 
    is_on_sale === false ? 0 : 1, is_new ? 1 : 0, is_hot ? 1 : 0, brand || null, supplier || null
  );

  res.json({
    success: true,
    data: { id: result.lastInsertRowid },
    message: '商品创建成功'
  });
});

router.put('/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '商品不存在' });
  }

  const fieldMapping = {
    'name': 'name',
    'subtitle': 'subtitle',
    'category_id': 'category_id',
    'price': 'original_price',
    'original_price': 'original_price',
    'vip_price': 'member_price',
    'member_price': 'member_price',
    'activity_price': 'activity_price',
    'stock': 'stock',
    'description': 'description',
    'images': 'images',
    'is_on_sale': 'is_on_sale',
    'is_new': 'is_new',
    'is_hot': 'is_hot',
    'brand': 'brand',
    'supplier': 'supplier'
  };

  const setClauses = [];
  const values = [];

  for (const [inputField, dbField] of Object.entries(fieldMapping)) {
    if (updates[inputField] !== undefined) {
      setClauses.push(`${dbField} = ?`);
      values.push(updates[inputField]);
    }
  }

  if (setClauses.length > 0) {
    setClauses.push("updated_at = datetime('now')");
    values.push(id);
    
    db.prepare(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({
    success: true,
    message: '商品更新成功'
  });
});

router.put('/products/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { is_on_sale } = req.body;
  const db = getDb();

  db.prepare('UPDATE products SET is_on_sale = ?, updated_at = datetime("now") WHERE id = ?').run(
    is_on_sale ? 1 : 0, id
  );

  res.json({
    success: true,
    message: is_on_sale ? '商品已上架' : '商品已下架'
  });
});

router.get('/orders', requireAdmin, (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const db = getDb();

  let whereClause = '1=1';
  let params = [];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const total = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE ${whereClause}`).get(...params).count;

  const orders = db.prepare(`
    SELECT o.*, u.nickname, u.phone 
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.post('/orders/:orderId/ship', requireAdmin, (req, res) => {
  const { orderId } = req.params;
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'paid') {
    return res.status(400).json({ error: '只有已支付订单才能发货' });
  }

  db.prepare(`UPDATE orders SET status = 'shipped', ship_time = datetime('now') WHERE id = ?`).run(orderId);

  res.json({
    success: true,
    message: '发货成功'
  });
});

router.put('/orders/:orderId/status', requireAdmin, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const validTransitions = {
    'pending': ['paid', 'cancelled'],
    'paid': ['shipped', 'cancelled'],
    'shipped': ['completed'],
    'completed': [],
    'cancelled': []
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return res.status(400).json({ error: '无效的状态转换' });
  }

  const updateFields = ['status = ?'];
  const values = [status];

  if (status === 'paid') updateFields.push("pay_time = datetime('now')");
  if (status === 'shipped') updateFields.push("ship_time = datetime('now')");
  if (status === 'completed') updateFields.push("complete_time = datetime('now')");

  values.push(orderId);

  db.prepare(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);

  res.json({
    success: true,
    message: '订单状态更新成功'
  });
});

router.get('/channels', requireAdmin, (req, res) => {
  const db = getDb();
  
  const channels = db.prepare('SELECT * FROM channels ORDER BY sort_order ASC').all();
  
  res.json({
    success: true,
    data: channels
  });
});

router.post('/channels', requireAdmin, (req, res) => {
  const { name, code, icon, type, sort_order } = req.body;
  const db = getDb();

  if (!name || !code) {
    return res.status(400).json({ error: '频道名称和代码必填' });
  }

  const existing = db.prepare('SELECT * FROM channels WHERE code = ?').get(code);
  if (existing) {
    return res.status(400).json({ error: '频道代码已存在' });
  }

  db.prepare(`
    INSERT INTO channels (name, code, icon, type, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, code, icon || null, type || 'normal', sort_order || 0);

  res.json({
    success: true,
    message: '频道创建成功'
  });
});

router.put('/channels/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, icon, type, sort_order, status } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE channels 
    SET name = ?, icon = ?, type = ?, sort_order = ?, status = ?
    WHERE id = ?
  `).run(name, icon || null, type || 'normal', sort_order || 0, status === 0 ? 0 : 1, id);

  res.json({
    success: true,
    message: '频道更新成功'
  });
});

router.get('/contents', requireAdmin, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const db = getDb();

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const total = db.prepare('SELECT COUNT(*) as count FROM contents').get().count;

  const contents = db.prepare(`
    SELECT * FROM contents 
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(pageSize), offset);

  res.json({
    success: true,
    data: contents,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.post('/contents', requireAdmin, (req, res) => {
  const { title, cover, summary, content, author, category } = req.body;
  const db = getDb();

  if (!title) {
    return res.status(400).json({ error: '标题必填' });
  }

  db.prepare(`
    INSERT INTO contents (title, cover, summary, content, author, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(title, cover || null, summary || null, content || null, author || null, category || null);

  res.json({
    success: true,
    message: '内容创建成功'
  });
});

router.put('/contents/:contentId', requireAdmin, (req, res) => {
  const { contentId } = req.params;
  const updates = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId);
  if (!existing) {
    return res.status(404).json({ error: '内容不存在' });
  }

  const allowedFields = ['title', 'cover', 'summary', 'content', 'author', 'category', 'related_product_ids'];

  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length > 0) {
    setClauses.push("updated_at = datetime('now')");
    values.push(contentId);
    
    db.prepare(`UPDATE contents SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({
    success: true,
    message: '内容更新成功'
  });
});

router.delete('/contents/:contentId', requireAdmin, (req, res) => {
  const { contentId } = req.params;
  const db = getDb();

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM content_products WHERE content_id = ?').run(contentId);
    db.prepare('DELETE FROM contents WHERE id = ?').run(contentId);
  });
  tx();

  res.json({
    success: true,
    message: '内容删除成功'
  });
});

router.post('/contents/:contentId/products', requireAdmin, (req, res) => {
  const { contentId } = req.params;
  const { productIds } = req.body;
  const db = getDb();

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: '请选择关联商品' });
  }

  db.prepare('DELETE FROM content_products WHERE content_id = ?').run(contentId);

  const insert = db.prepare('INSERT INTO content_products (content_id, product_id, sort_order) VALUES (?, ?, ?)');
  productIds.forEach((productId, index) => {
    insert.run(contentId, productId, index);
  });

  res.json({
    success: true,
    message: '商品关联成功'
  });
});

router.get('/coupons', requireAdmin, (req, res) => {
  const db = getDb();
  
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  
  res.json({
    success: true,
    data: coupons
  });
});

router.delete('/coupons/:couponId', requireAdmin, (req, res) => {
  const { couponId } = req.params;
  const db = getDb();

  db.prepare('DELETE FROM user_coupons WHERE coupon_id = ?').run(couponId);
  db.prepare('DELETE FROM coupons WHERE id = ?').run(couponId);

  res.json({
    success: true,
    message: '优惠券删除成功'
  });
});

router.post('/coupons', requireAdmin, (req, res) => {
  const { name, type, discount_value, min_amount, total_count, start_time, end_time } = req.body;
  const db = getDb();

  if (!name || !discount_value || !total_count) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  db.prepare(`
    INSERT INTO coupons (name, type, discount_value, min_amount, total_count, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, 
    type || 'normal', 
    discount_value, 
    min_amount || 0, 
    total_count,
    start_time || new Date().toISOString(),
    end_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  );

  res.json({
    success: true,
    message: '优惠券创建成功'
  });
});

router.get('/crowdfunding', requireAdmin, (req, res) => {
  const db = getDb();
  
  const projects = db.prepare(`
    SELECT cp.*, 
      (SELECT COALESCE(SUM(amount), 0) FROM crowdfunding_supports WHERE project_id = cp.id) as raised_amount,
      (SELECT COALESCE(SUM(amount), 0) * 100.0 / cp.target_amount FROM crowdfunding_supports WHERE project_id = cp.id) as progress
    FROM crowdfunding_projects cp
    ORDER BY created_at DESC
  `).all();
  
  res.json({
    success: true,
    data: projects
  });
});

router.put('/crowdfunding/:projectId', requireAdmin, (req, res) => {
  const { projectId } = req.params;
  const updates = req.body;
  const db = getDb();

  const existing = db.prepare('SELECT * FROM crowdfunding_projects WHERE id = ?').get(projectId);
  if (!existing) {
    return res.status(404).json({ error: '项目不存在' });
  }

  const allowedFields = ['title', 'cover', 'description', 'target_amount', 'start_time', 'end_time', 'status'];

  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length > 0) {
    values.push(projectId);
    db.prepare(`UPDATE crowdfunding_projects SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({
    success: true,
    message: '众筹项目更新成功'
  });
});

router.post('/crowdfunding', requireAdmin, (req, res) => {
  const { title, cover, description, target_amount, start_time, end_time, creator } = req.body;
  const db = getDb();

  if (!title || !target_amount) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  db.prepare(`
    INSERT INTO crowdfunding_projects (title, cover, description, target_amount, start_time, end_time, creator)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    cover || null,
    description || null,
    target_amount,
    start_time || new Date().toISOString(),
    end_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    creator || '平台'
  );

  res.json({
    success: true,
    message: '众筹项目创建成功'
  });
});

router.post('/crowdfunding/:projectId/gears', requireAdmin, (req, res) => {
  const { projectId } = req.params;
  const { name, amount, description, limit_count, estimated_delivery } = req.body;
  const db = getDb();

  if (!name || !amount) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  db.prepare(`
    INSERT INTO crowdfunding_gears (project_id, name, amount, description, limit_count, estimated_delivery)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(projectId, name, amount, description || null, limit_count || null, estimated_delivery || null);

  res.json({
    success: true,
    message: '档位创建成功'
  });
});

router.get('/users', requireAdmin, (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query;
  const db = getDb();

  let whereClause = '1=1';
  let params = [];

  if (keyword) {
    whereClause += ' AND (phone LIKE ? OR email LIKE ? OR nickname LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const total = db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${whereClause}`).get(...params).count;

  const users = db.prepare(`
    SELECT id, phone, email, nickname, avatar, is_vip, points, status, created_at 
    FROM users 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
      totalPages: Math.ceil(total / parseInt(pageSize))
    }
  });
});

router.put('/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  const allowedFields = ['is_vip', 'points', 'status'];
  const setClauses = [];
  const values = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length > 0) {
    setClauses.push("updated_at = datetime('now')");
    values.push(userId);
    db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({
    success: true,
    message: '用户更新成功'
  });
});

router.put('/users/:userId/vip', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { is_vip, days } = req.body;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let vipExpireTime = user.vip_expire_time;
  if (is_vip && days) {
    const baseTime = user.vip_expire_time && new Date(user.vip_expire_time) > new Date() 
      ? new Date(user.vip_expire_time) 
      : new Date();
    vipExpireTime = new Date(baseTime.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  db.prepare(`
    UPDATE users 
    SET is_vip = ?, vip_expire_time = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(is_vip ? 1 : 0, vipExpireTime, userId);

  res.json({
    success: true,
    message: '会员权益更新成功'
  });
});

module.exports = router;
