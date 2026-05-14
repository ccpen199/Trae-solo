const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const payOrder = async (req, res) => {
  const { orderId, paymentMethod } = req.body;
  const user_id = req.user.id;

  if (!orderId) {
    return res.status(400).json({ success: false, message: '订单ID不能为空' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, user_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  if (order.status !== 'completed') {
    return res.status(400).json({ success: false, message: '订单未完成，无法支付' });
  }

  db.prepare(`
    UPDATE orders 
    SET status = ?
    WHERE id = ?
  `).run('paid', orderId);

  const assets = db.prepare('SELECT * FROM user_assets WHERE user_id = ?').get(user_id);
  if (assets && assets.balance >= order.actual_price) {
    db.prepare(`
      UPDATE user_assets 
      SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(order.actual_price, user_id);
  }

  const updatedOrder = db.prepare(`
    SELECT o.*, ct.display_name as car_type_name
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    WHERE o.id = ?
  `).get(orderId);

  res.json({
    success: true,
    message: '支付成功',
    data: updatedOrder
  });
};

const submitRating = async (req, res) => {
  const { orderId, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!orderId || !rating) {
    return res.status(400).json({ success: false, message: '订单ID和评分不能为空' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: '评分必须在1-5之间' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, user_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  const existingRating = db.prepare('SELECT * FROM ratings WHERE order_id = ?').get(orderId);
  if (existingRating) {
    return res.status(400).json({ success: false, message: '该订单已评价过' });
  }

  const ratingId = uuidv4();
  db.prepare(`
    INSERT INTO ratings (id, order_id, user_id, driver_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ratingId, orderId, user_id, order.driver_id, rating, comment || '');

  if (order.driver_id) {
    db.prepare(`
      UPDATE drivers 
      SET order_count = order_count + 1
      WHERE id = ?
    `).run(order.driver_id);
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('rated', orderId);

  res.json({
    success: true,
    message: '评价提交成功',
    data: { id: ratingId, orderId, rating, comment }
  });
};

const getOrderRating = async (req, res) => {
  const { orderId } = req.params;
  const user_id = req.user.id;

  const rating = db.prepare(`
    SELECT * FROM ratings 
    WHERE order_id = ? AND user_id = ?
  `).get(orderId, user_id);

  res.json({
    success: true,
    data: rating || null
  });
};

module.exports = {
  payOrder,
  submitRating,
  getOrderRating
};