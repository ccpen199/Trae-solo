const express = require('express');
const { query, run } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, message_type, page = 1, pageSize = 20 } = req.query;
    
    let sql = `SELECT m.*, t.ticket_no, t.title as ticket_title
               FROM messages m
               LEFT JOIN tickets t ON m.ticket_id = t.id
               WHERE m.user_id = ?`;
    const params = [userId];
    
    if (status) {
      sql += ' AND m.status = ?';
      params.push(status);
    }
    if (message_type) {
      sql += ' AND m.message_type = ?';
      params.push(message_type);
    }
    
    sql += ' ORDER BY m.created_at DESC';
    
    const allMessages = query(sql, params);
    const total = allMessages.length;
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(pageSize), offset);
    
    const messages = query(sql, params);
    
    const unreadCount = query(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND status = ?',
      [userId, 'unread']
    )[0]?.count || 0;
    
    res.json({
      success: true,
      data: {
        messages,
        unreadCount,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    });
  } catch (error) {
    console.error('获取消息列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.get('/unread', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = query(
      `SELECT m.*, t.ticket_no, t.title as ticket_title
       FROM messages m
       LEFT JOIN tickets t ON m.ticket_id = t.id
       WHERE m.user_id = ? AND m.status = 'unread'
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    const count = query(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND status = ?',
      [userId, 'unread']
    )[0]?.count || 0;
    
    res.json({
      success: true,
      data: {
        messages,
        count
      }
    });
  } catch (error) {
    console.error('获取未读消息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const existing = query(
      'SELECT * FROM messages WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: '消息不存在或无权限'
      });
    }
    
    run(
      `UPDATE messages 
       SET status = 'read', is_read = 1, read_at = datetime('now')
       WHERE id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    console.error('标记消息已读错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    run(
      `UPDATE messages 
       SET status = 'read', is_read = 1, read_at = datetime('now')
       WHERE user_id = ? AND status = 'unread'`,
      [userId]
    );
    
    res.json({
      success: true,
      message: '所有消息已标记为已读'
    });
  } catch (error) {
    console.error('批量标记已读错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
