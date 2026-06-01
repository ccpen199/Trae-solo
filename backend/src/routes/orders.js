const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT o.*, u.nickname, u.avatar 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
  `;
  const params = [];

  if (status) {
    query += 'WHERE o.status = ? ';
    params.push(status);
  }

  query += 'ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

router.post('/', authMiddleware, [
  body('title').notEmpty().withMessage('标题不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, reward } = req.body;

  const result = db.prepare(
    'INSERT INTO orders (user_id, title, description, reward) VALUES (?, ?, ?, ?)'
  ).run(
    req.user.userId,
    title,
    description || null,
    reward || 0
  );

  const order = db.prepare(`
    SELECT o.*, u.nickname, u.avatar 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
    WHERE o.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(order);
});

router.post('/:id/accept', authMiddleware, (req, res) => {
  const orderId = req.params.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单已被接受' });
  }

  if (order.user_id === req.user.userId) {
    return res.status(400).json({ error: '不能接受自己的订单' });
  }

  db.prepare('UPDATE orders SET status = ?, accepted_by = ? WHERE id = ?').run(
    'accepted',
    req.user.userId,
    orderId
  );

  res.json({ success: true });
});

module.exports = router;
