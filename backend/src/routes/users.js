const express = require('express');
const db = require('../config/database');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const { id } = req.params;

    const user = db.prepare(`
      SELECT id, username, nickname, avatar, bio, created_at
      FROM users
      WHERE id = ?
    `).get(id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const following = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_follows
      WHERE follower_id = ?
    `).get(id).count;

    const followers = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_follows
      WHERE following_id = ?
    `).get(id).count;

    user.following_count = following;
    user.follower_count = followers;

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/:id/follow', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;

    if (id == req.user.userId) {
      return res.status(400).json({ success: false, message: '不能关注自己' });
    }

    const existing = db.prepare('SELECT * FROM user_follows WHERE follower_id = ? AND following_id = ?')
      .get(req.user.userId, id);

    if (existing) {
      db.prepare('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?')
        .run(req.user.userId, id);
      res.json({ success: true, message: '取消关注', followed: false });
    } else {
      db.prepare('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)')
        .run(req.user.userId, id);
      res.json({ success: true, message: '关注成功', followed: true });
    }
  } catch (error) {
    console.error('关注用户错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
