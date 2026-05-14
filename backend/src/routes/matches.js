const express = require('express');
const { db } = require('../database/init');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/:userId', authMiddleware, (req, res) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: '不能匹配自己' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    let match = db.prepare(`
      SELECT * FROM matches 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(req.user.id, userId, userId, req.user.id);

    if (match) {
      return res.json({ success: true, data: { match, is_new: false }, message: '已匹配' });
    }

    const stmt = db.prepare('INSERT INTO matches (user1_id, user2_id, match_score, status) VALUES (?, ?, ?, ?)');
    const result = stmt.run(req.user.id, userId, 80, 'pending');

    match = db.prepare('SELECT * FROM matches WHERE id = ?').get(result.lastInsertRowid);

    db.prepare('INSERT INTO analytics (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)').run(
      req.user.id,
      'match',
      JSON.stringify({ target_user_id: userId, match_id: match.id }),
      'planet'
    );

    res.json({ success: true, data: { match, is_new: true }, message: '匹配成功' });
  } catch (error) {
    console.error('Match error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/', authMiddleware, (req, res) => {
  try {
    const matches = db.prepare(`
      SELECT 
        m.*,
        u.id as user_id,
        u.nickname,
        u.avatar,
        u.bio
      FROM matches m
      JOIN users u ON (m.user1_id = ? AND m.user2_id = u.id) OR (m.user2_id = ? AND m.user1_id = u.id)
      WHERE m.user1_id = ? OR m.user2_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);

    res.json({ success: true, data: { matches } });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
