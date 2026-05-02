const express = require('express');
const db = require('../models/database');
const { authenticateToken, logOperation } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const userId = req.user.id;

    let conditions = ['user_id = ?'];
    let params = [userId];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM messages ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params);
    const total = countResult.total;

    const offset = (page - 1) * pageSize;
    params.push(parseInt(pageSize), offset);

    const query = `
      SELECT m.*, vs.session_no
      FROM messages m
      LEFT JOIN viewing_sessions vs ON m.session_id = vs.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const messages = db.prepare(query).all(...params);

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({ error: '获取消息列表失败' });
  }
});

router.put('/:id/read', authenticateToken, logOperation('messages'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    if (message.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此消息' });
    }

    db.prepare(`
      UPDATE messages 
      SET status = 'read', read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const updatedMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);

    res.json(updatedMessage);
  } catch (error) {
    console.error('标记消息已读失败:', error);
    res.status(500).json({ error: '标记消息已读失败' });
  }
});

router.put('/read-all', authenticateToken, logOperation('messages'), async (req, res) => {
  try {
    const userId = req.user.id;

    db.prepare(`
      UPDATE messages 
      SET status = 'read', read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND status = 'unread'
    `).run(userId);

    res.json({ message: '所有消息已标记为已读' });
  } catch (error) {
    console.error('批量标记消息已读失败:', error);
    res.status(500).json({ error: '批量标记消息已读失败' });
  }
});

module.exports = router;
