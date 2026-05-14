const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../models/db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const getOrderWithUser = (orderId, currentUserId = null) => {
  const order = db.prepare(`
    SELECT o.*, 
           u.id as poster_id, u.real_name as poster_name, u.school as poster_school, u.avatar as poster_avatar,
           a.id as accepter_id, a.real_name as accepter_name, a.school as accepter_school, a.avatar as accepter_avatar
    FROM orders o
    LEFT JOIN users u ON o.poster_id = u.id
    LEFT JOIN users a ON o.accepter_id = a.id
    WHERE o.id = ?
  `).get(orderId);

  if (!order) return null;

  return {
    ...order,
    tags: order.tags ? order.tags.split(',') : []
  };
};

router.get('/', optionalAuth, (req, res) => {
  const { 
    keyword = '', 
    search_type = 'all', 
    page = 1, 
    page_size = 20 
  } = req.query;

  const pageNum = parseInt(page);
  const pageSize = parseInt(page_size);
  const offset = (pageNum - 1) * pageSize;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    if (search_type === 'topic') {
      whereClause += ' AND o.topic LIKE ?';
      params.push(`%${keyword}%`);
    } else if (search_type === 'tags') {
      whereClause += ' AND o.tags LIKE ?';
      params.push(`%${keyword}%`);
    } else if (search_type === 'classmate') {
      if (req.user) {
        whereClause += ' AND u.school = ? AND (o.topic LIKE ? OR o.remark LIKE ? OR o.tags LIKE ?)';
        params.push(req.user.school, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
    } else {
      whereClause += ' AND (o.topic LIKE ? OR o.remark LIKE ? OR o.tags LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
  }

  const totalResult = db.prepare(`
    SELECT COUNT(*) as total FROM orders o
    LEFT JOIN users u ON o.poster_id = u.id
    ${whereClause}
  `).get(...params);

  const orders = db.prepare(`
    SELECT o.*, u.id as poster_id, u.real_name as poster_name, u.avatar as poster_avatar
    FROM orders o
    LEFT JOIN users u ON o.poster_id = u.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  if (keyword && req.user) {
    const existing = db.prepare('SELECT 1 FROM search_history WHERE user_id = ? AND keyword = ? AND search_type = ?')
      .get(req.user.id, keyword, search_type);
    
    if (!existing) {
      db.prepare('INSERT INTO search_history (user_id, keyword, search_type) VALUES (?, ?, ?)')
        .run(req.user.id, keyword, search_type);
    }
  }

  const formattedOrders = orders.map(order => ({
    ...order,
    tags: order.tags ? order.tags.split(',') : []
  }));

  res.json({
    orders: formattedOrders,
    total: totalResult.total,
    page: pageNum,
    page_size: pageSize
  });
});

router.get('/mine', authenticate, (req, res) => {
  const { type = 'posted', page = 1, page_size = 20 } = req.query;
  const pageNum = parseInt(page);
  const pageSize = parseInt(page_size);
  const offset = (pageNum - 1) * pageSize;

  let whereClause;
  const params = [req.user.id];

  if (type === 'posted') {
    whereClause = 'WHERE o.poster_id = ?';
  } else if (type === 'accepted') {
    whereClause = 'WHERE o.accepter_id = ?';
  } else {
    whereClause = 'WHERE o.poster_id = ? OR o.accepter_id = ?';
    params.push(req.user.id);
  }

  const totalResult = db.prepare(`
    SELECT COUNT(*) as total FROM orders o
    ${whereClause}
  `).get(...params);

  const orders = db.prepare(`
    SELECT o.*, 
           u.id as poster_id, u.real_name as poster_name, u.avatar as poster_avatar,
           a.id as accepter_id, a.real_name as accepter_name, a.avatar as accepter_avatar
    FROM orders o
    LEFT JOIN users u ON o.poster_id = u.id
    LEFT JOIN users a ON o.accepter_id = a.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  const formattedOrders = orders.map(order => ({
    ...order,
    tags: order.tags ? order.tags.split(',') : []
  }));

  res.json({
    orders: formattedOrders,
    total: totalResult.total,
    page: pageNum,
    page_size: pageSize
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;

  try {
    const order = getOrderWithUser(id, req.user?.id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json({ order });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

router.post('/', authenticate, [
  body('topic').notEmpty().withMessage('订单话题不能为空'),
  body('remark').notEmpty().withMessage('订单备注不能为空'),
  body('tags').notEmpty().withMessage('订单标签不能为空'),
  body('delivery_fee').isFloat({ min: 0 }).withMessage('配送费必须为正数'),
  body('item_price').isFloat({ min: 0 }).withMessage('物品价格必须为正数')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { topic, remark, tags, delivery_fee, item_price } = req.body;
  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags;
  const totalAmount = parseFloat(delivery_fee) + parseFloat(item_price);

  try {
    const insertOrder = db.prepare(`
      INSERT INTO orders (topic, remark, tags, delivery_fee, item_price, total_amount, poster_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertOrder.run(topic, remark, tagsStr, delivery_fee, item_price, totalAmount, req.user.id);
    const order = getOrderWithUser(result.lastInsertRowid, req.user.id);

    res.status(201).json({ order });
  } catch (error) {
    console.error('发布订单失败:', error);
    res.status(500).json({ error: '发布订单失败，请稍后重试' });
  }
});

router.post('/:id/accept', authenticate, (req, res) => {
  const { id } = req.params;

  const tx = db.transaction(() => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单已被接单或已完成' });
    }

    if (order.poster_id === req.user.id) {
      return res.status(400).json({ error: '不能接自己发布的订单' });
    }

    db.prepare(`
      UPDATE orders SET status = 'accepted', accepter_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, id);

    db.prepare(`
      INSERT INTO messages (type, sender_id, receiver_id, order_id, content)
      VALUES ('order_notification', ?, ?, ?, ?)
    `).run(req.user.id, order.poster_id, id, '您的订单已被接单');

    const updatedOrder = getOrderWithUser(id, req.user.id);

    res.json({ order: updatedOrder });
  });

  try {
    tx();
  } catch (error) {
    console.error('接单失败:', error);
    res.status(500).json({ error: '接单失败，请稍后重试' });
  }
});

router.post('/:id/complete', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.poster_id !== req.user.id && order.accepter_id !== req.user.id) {
      return res.status(403).json({ error: '无权操作此订单' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ error: '订单已完成' });
    }

    db.prepare(`
      UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    const updatedOrder = getOrderWithUser(id, req.user.id);

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('完成订单失败:', error);
    res.status(500).json({ error: '完成订单失败，请稍后重试' });
  }
});

router.post('/:id/cancel', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.poster_id !== req.user.id) {
      return res.status(403).json({ error: '只有发布者可以取消订单' });
    }

    if (order.status === 'accepted' || order.status === 'completed') {
      return res.status(400).json({ error: '订单已被接单或已完成，无法取消' });
    }

    db.prepare(`
      UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    const updatedOrder = getOrderWithUser(id, req.user.id);

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ error: '取消订单失败，请稍后重试' });
  }
});

router.get('/search/history', authenticate, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT DISTINCT keyword, search_type, MAX(created_at) as created_at
      FROM search_history
      WHERE user_id = ?
      GROUP BY keyword, search_type
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.user.id);

    res.json({ history });
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    res.status(500).json({ error: '获取搜索历史失败' });
  }
});

router.delete('/search/history', authenticate, (req, res) => {
  try {
    db.prepare('DELETE FROM search_history WHERE user_id = ?').run(req.user.id);
    res.json({ message: '搜索历史已清空' });
  } catch (error) {
    console.error('清空搜索历史失败:', error);
    res.status(500).json({ error: '清空搜索历史失败' });
  }
});

module.exports = router;
