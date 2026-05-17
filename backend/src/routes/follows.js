const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/:userId', authenticateToken, (req, res) => {
  try {
    const followingId = parseInt(req.params.userId);
    const followerId = req.user.id;

    if (followingId === followerId) {
      return res.status(400).json({ 
        success: false, 
        message: '不能关注自己' 
      });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(followingId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(followerId, followingId);
      db.prepare('UPDATE users SET following_count = following_count - 1 WHERE id = ?').run(followerId);
      db.prepare('UPDATE users SET followers_count = followers_count - 1 WHERE id = ?').run(followingId);
      
      res.json({
        success: true,
        message: '取消关注',
        data: { is_followed: false }
      });
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId);
      db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(followerId);
      db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(followingId);
      
      res.json({
        success: true,
        message: '关注成功',
        data: { is_followed: true }
      });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ 
      success: false, 
      message: '操作失败' 
    });
  }
});

router.get('/followers/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const followers = db.prepare(`
      SELECT 
        u.id,
        u.nickname,
        u.avatar,
        u.bio,
        u.followers_count
      FROM follows f
      LEFT JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    res.json({
      success: true,
      data: { list: followers }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取粉丝列表失败' 
    });
  }
});

router.get('/following/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const following = db.prepare(`
      SELECT 
        u.id,
        u.nickname,
        u.avatar,
        u.bio,
        u.followers_count
      FROM follows f
      LEFT JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, limit, offset);

    res.json({
      success: true,
      data: { list: following }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取关注列表失败' 
    });
  }
});

module.exports = router;
