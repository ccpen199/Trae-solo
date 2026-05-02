const express = require('express');
const { authMiddleware } = require('./auth');
const db = require('../database/init');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const { is_read, page = 1, pageSize = 20 } = req.query;

    let whereClauses = ['user_id = ?'];
    let params = [req.user.userId];

    if (is_read !== undefined && is_read !== '') {
      whereClauses.push('is_read = ?');
      params.push(is_read === 'true' || is_read === '1' ? 1 : 0);
    }

    const whereSql = whereClauses.join(' AND ');

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM messages WHERE ${whereSql}
    `).get(...params);

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const results = db.prepare(`
      SELECT 
        m.*,
        no.order_no,
        no.origin_address,
        no.dest_address
      FROM messages m
      LEFT JOIN navigation_orders no ON m.order_id = no.id
      WHERE ${whereSql}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      success: true,
      data: {
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(countResult.total / parseInt(pageSize)),
        items: results,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取消息列表失败',
      error: err.message,
    });
  }
});

router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0'
    ).get(req.user.userId);

    res.json({
      success: true,
      data: {
        unreadCount: result.count,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '获取未读消息数失败',
      error: err.message,
    });
  }
});

router.post('/:id/read', authMiddleware, (req, res) => {
  try {
    const messageId = req.params.id;

    const message = db.prepare(
      'SELECT * FROM messages WHERE id = ? AND user_id = ?'
    ).get(messageId, req.user.userId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或无权限访问',
      });
    }

    db.prepare(
      'UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(messageId);

    res.json({
      success: true,
      message: '已标记为已读',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '标记已读失败',
      error: err.message,
    });
  }
});

router.post('/read-all', authMiddleware, (req, res) => {
  try {
    const result = db.prepare(
      'UPDATE messages SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0'
    ).run(req.user.userId);

    res.json({
      success: true,
      message: `已标记 ${result.changes} 条消息为已读`,
      markedCount: result.changes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '批量标记已读失败',
      error: err.message,
    });
  }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const messageId = req.params.id;

    const message = db.prepare(
      'SELECT * FROM messages WHERE id = ? AND user_id = ?'
    ).get(messageId, req.user.userId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或无权限访问',
      });
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);

    res.json({
      success: true,
      message: '消息已删除',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '删除消息失败',
      error: err.message,
    });
  }
});

module.exports = router;
