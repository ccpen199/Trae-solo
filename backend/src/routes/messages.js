const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database');
const { authenticate } = require('../middleware');

const router = express.Router();

router.get('/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.student_id !== userId && order.teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此订单的消息'
      });
    }

    const messages = await allQuery(
      `SELECT 
        m.*,
        u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.order_id = ?
      ORDER BY m.created_at ASC`,
      [orderId]
    );

    await runQuery(
      'UPDATE messages SET is_read = 1 WHERE order_id = ? AND sender_id != ?',
      [orderId, userId]
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取消息失败',
      error: error.message
    });
  }
});

router.post('/order/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.student_id !== userId && order.teacher_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权在此订单发送消息'
      });
    }

    const result = await runQuery(
      'INSERT INTO messages (order_id, sender_id, content) VALUES (?, ?, ?)',
      [orderId, userId, content.trim()]
    );

    const message = await getQuery(
      `SELECT 
        m.*,
        u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?`,
      [result.lastID]
    );

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发送消息失败',
      error: error.message
    });
  }
});

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getQuery(
      `SELECT COUNT(*) as count 
       FROM messages m
       LEFT JOIN orders o ON m.order_id = o.id
       WHERE m.is_read = 0 
       AND m.sender_id != ?
       AND (o.student_id = ? OR o.teacher_id = ?)`,
      [userId, userId, userId]
    );

    res.json({
      success: true,
      data: {
        count: result?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取未读消息数失败',
      error: error.message
    });
  }
});

module.exports = router;
