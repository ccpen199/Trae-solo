const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, email, phone, avatar, bio, created_at
      FROM users WHERE id = ?
    `).get(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) as post_count,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as favorite_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count
    `).get(req.user.userId, req.user.userId, req.user.userId, req.user.userId);

    res.json({ success: true, data: { ...user, ...stats } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.put('/profile', authenticateToken, [
  body('username').optional().isString().isLength({ min: 2, max: 20 }),
  body('bio').optional().isString().isLength({ max: 200 })
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: '参数错误', errors: errors.array() });
    }

    const { username, bio, avatar } = req.body;
    const updates = [];
    const params = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (avatar) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有需要更新的内容' });
    }

    params.push(req.user.userId);

    db.prepare(`
      UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...params);

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const user = db.prepare(`
      SELECT id, username, avatar, bio, created_at
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) as post_count,
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as favorite_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count
    `).get(userId, userId, userId, userId);

    res.json({ success: true, data: { ...user, ...stats } });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.post('/:userId/follow', authenticateToken, (req, res) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ success: false, message: '不能关注自己' });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    try {
      db.prepare(`
        INSERT INTO follows (follower_id, following_id) VALUES (?, ?)
      `).run(req.user.userId, userId);

      res.json({ success: true, message: '关注成功', data: { following: true } });
    } catch (e) {
      db.prepare(`
        DELETE FROM follows WHERE follower_id = ? AND following_id = ?
      `).run(req.user.userId, userId);

      res.json({ success: true, message: '取消关注成功', data: { following: false } });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

router.get('/following/list', authenticateToken, (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const following = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.bio
      FROM users u
      INNER JOIN follows f ON u.id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.userId, parseInt(limit), parseInt(offset));

    res.json({ success: true, data: following });
  } catch (error) {
    console.error('Get following list error:', error);
    res.status(500).json({ success: false, message: '获取关注列表失败' });
  }
});

router.get('/followers/list', authenticateToken, (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const followers = db.prepare(`
      SELECT u.id, u.username, u.avatar, u.bio
      FROM users u
      INNER JOIN follows f ON u.id = f.follower_id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.userId, parseInt(limit), parseInt(offset));

    res.json({ success: true, data: followers });
  } catch (error) {
    console.error('Get followers list error:', error);
    res.status(500).json({ success: false, message: '获取粉丝列表失败' });
  }
});

module.exports = router;
