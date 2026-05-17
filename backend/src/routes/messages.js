const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.post('/', (req, res) => {
  try {
    const { roomId, userId, content, type = 'chat' } = req.body;

    if (!roomId || !userId || !content) {
      return res.status(400).json({
        success: false,
        message: '缺少必填参数'
      });
    }

    db.prepare(`
      INSERT INTO messages (room_id, user_id, content, type)
      VALUES (?, ?, ?, ?)
    `).run(roomId, userId, content, type);

    const message = db.prepare(`
      SELECT m.*, u.nickname, u.avatar
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = last_insert_rowid()
    `).get();

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败'
    });
  }
});

router.get('/room/:roomId', (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    let query = `
      SELECT m.*, u.nickname, u.avatar
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
    `;
    const params = [roomId];

    if (before) {
      query += ' AND m.id < ?';
      params.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const messages = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败'
    });
  }
});

module.exports = router;
