const express = require('express');
const authMiddleware = require('../middleware/auth');
const { runQuery, getQuery, allQuery } = require('../database');

const router = express.Router();

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await getQuery(
      'SELECT id, phone, nickname, avatar, bio, gender, birthday, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    const stats = await getQuery(
      `SELECT 
        (SELECT COUNT(*) FROM friends WHERE user_id = ? AND status = 1) as friends_count,
        (SELECT COUNT(*) FROM moments WHERE user_id = ?) as moments_count
      `,
      [req.user.id, req.user.id]
    );

    res.json({
      success: true,
      data: { ...user, ...stats }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar, bio, gender, birthday } = req.body;

    await runQuery(
      'UPDATE users SET nickname = ?, avatar = ?, bio = ?, gender = ?, birthday = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nickname || req.user.nickname, avatar || req.user.avatar, bio || req.user.bio, gender || 0, birthday || null, req.user.id]
    );

    const user = await getQuery(
      'SELECT id, phone, nickname, avatar, bio, gender, birthday FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: '更新成功',
      data: user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.json({
      success: false,
      message: '更新失败'
    });
  }
});

router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const friends = await allQuery(
      `SELECT u.id, u.nickname, u.avatar, u.bio, f.status
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = ? AND f.status = 1
       ORDER BY u.nickname`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    console.error('获取好友列表失败:', error);
    res.json({
      success: false,
      message: '获取好友列表失败'
    });
  }
});

router.get('/suggested', authMiddleware, async (req, res) => {
  try {
    const suggested = await allQuery(
      `SELECT u.id, u.nickname, u.avatar, u.bio
       FROM users u
       WHERE u.id != ? AND u.id NOT IN (
         SELECT friend_id FROM friends WHERE user_id = ?
       )
       ORDER BY RANDOM()
       LIMIT 10`,
      [req.user.id, req.user.id]
    );

    res.json({
      success: true,
      data: suggested
    });
  } catch (error) {
    console.error('获取推荐好友失败:', error);
    res.json({
      success: false,
      message: '获取推荐好友失败'
    });
  }
});

router.post('/add-friend', authMiddleware, async (req, res) => {
  try {
    const { friendId } = req.body;

    if (!friendId || friendId === req.user.id) {
      return res.json({
        success: false,
        message: '无效的用户'
      });
    }

    const friend = await getQuery('SELECT id FROM users WHERE id = ?', [friendId]);
    if (!friend) {
      return res.json({
        success: false,
        message: '用户不存在'
      });
    }

    try {
      await runQuery(
        'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 1)',
        [req.user.id, friendId]
      );
      await runQuery(
        'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 1)',
        [friendId, req.user.id]
      );
    } catch (e) {
      return res.json({
        success: false,
        message: '已经是好友了'
      });
    }

    res.json({
      success: true,
      message: '添加好友成功'
    });
  } catch (error) {
    console.error('添加好友失败:', error);
    res.json({
      success: false,
      message: '添加好友失败'
    });
  }
});

module.exports = router;
