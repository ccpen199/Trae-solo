const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, isRead } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    let whereClause = 'user_id = ?';
    const params = [req.user.id];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (isRead !== undefined) {
      whereClause += ' AND is_read = ?';
      params.push(Number(isRead));
    }

    const countSql = `SELECT COUNT(*) as total FROM messages WHERE ${whereClause}`;
    const totalResult = await db.prepare(countSql).get(...params);
    const total = totalResult.total;

    const sql = `
      SELECT m.*, u.nickname as from_nickname, u.avatar as from_avatar
      FROM messages m
      LEFT JOIN users u ON m.from_user_id = u.id
      WHERE ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const messages = await db.prepare(sql).all(...params, limit, offset);

    res.json({
      success: true,
      data: {
        list: messages,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败'
    });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0').get(req.user.id);

    const byType = await db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM messages 
      WHERE user_id = ? AND is_read = 0 
      GROUP BY type
    `).all(req.user.id);

    const typeCount = {};
    for (const item of byType) {
      typeCount[item.type] = item.count;
    }

    res.json({
      success: true,
      data: {
        total: result.count,
        byType: typeCount
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: '获取未读消息数失败'
    });
  }
});

router.post('/read/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await db.prepare('SELECT id FROM messages WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }

    await db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '标记已读成功'
    });
  } catch (error) {
    console.error('Read message error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.post('/read-all', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;

    let whereClause = 'user_id = ?';
    const params = [req.user.id];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    await db.prepare(`UPDATE messages SET is_read = 1 WHERE ${whereClause}`).run(...params);

    res.json({
      success: true,
      message: '全部标记已读成功'
    });
  } catch (error) {
    console.error('Read all messages error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await db.prepare('SELECT id FROM messages WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }

    await db.prepare('DELETE FROM messages WHERE id = ?').run(id);

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败，请稍后重试'
    });
  }
});

module.exports = router;
