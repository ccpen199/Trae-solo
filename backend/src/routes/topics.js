const express = require('express');
const db = require('../config/database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const topics = db.prepare(`
      SELECT * FROM topics
      ORDER BY follower_count DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), offset);

    const total = db.prepare('SELECT COUNT(*) as total FROM topics').get().total;

    res.json({
      success: true,
      data: {
        list: topics || [],
        total
      }
    });
  } catch (error) {
    console.error('获取话题列表错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/follow', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM topic_follows WHERE user_id = ? AND topic_id = ?')
      .get(req.user.userId, id);

    if (existing) {
      db.prepare('DELETE FROM topic_follows WHERE user_id = ? AND topic_id = ?')
        .run(req.user.userId, id);
      db.prepare('UPDATE topics SET follower_count = follower_count - 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '取消关注', followed: false });
    } else {
      db.prepare('INSERT INTO topic_follows (user_id, topic_id) VALUES (?, ?)')
        .run(req.user.userId, id);
      db.prepare('UPDATE topics SET follower_count = follower_count + 1 WHERE id = ?').run(id);
      res.json({ success: true, message: '关注成功', followed: true });
    }
  } catch (error) {
    console.error('关注话题错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
