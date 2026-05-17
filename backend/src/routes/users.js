const express = require('express');
const { run, get, all } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    const tags = await all('SELECT tag FROM user_tags WHERE user_id = ?', [userId]);
    const subscriptions = await all('SELECT * FROM subscriptions WHERE user_id = ?', [userId]);
    
    const friendCount = await get(
      'SELECT COUNT(*) as count FROM friends WHERE user_id1 = ? OR user_id2 = ?',
      [userId, userId]
    );
    
    const likeCount = await get('SELECT COUNT(*) as count FROM likes WHERE to_user_id = ?', [userId]);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          gender: user.gender,
          bio: user.bio,
          is_online: user.is_online
        },
        tags: tags.map(t => t.tag),
        subscriptions,
        friend_count: friendCount.count,
        like_count: likeCount.count
      }
    });
  } catch (error) {
    console.error('获取用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户资料失败'
    });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname, avatar, gender, bio, tags } = req.body;

    if (nickname) {
      await run('UPDATE users SET nickname = ? WHERE id = ?', [nickname, userId]);
    }
    if (avatar !== undefined) {
      await run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userId]);
    }
    if (gender) {
      await run('UPDATE users SET gender = ? WHERE id = ?', [gender, userId]);
    }
    if (bio !== undefined) {
      await run('UPDATE users SET bio = ? WHERE id = ?', [bio, userId]);
    }

    if (tags && Array.isArray(tags)) {
      await run('DELETE FROM user_tags WHERE user_id = ?', [userId]);
      for (const tag of tags) {
        await run('INSERT INTO user_tags (user_id, tag) VALUES (?, ?)', [userId, tag]);
      }
    }

    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const user = await get('SELECT id, nickname, avatar, gender, bio, is_online FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const tags = await all('SELECT tag FROM user_tags WHERE user_id = ?', [userId]);
    
    const isFriend = await get(
      'SELECT * FROM friends WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
      [currentUserId, userId, userId, currentUserId]
    );

    await run('INSERT OR REPLACE INTO recent_visits (user_id, visited_user_id, visited_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [currentUserId, userId]);

    res.json({
      success: true,
      data: {
        user,
        tags: tags.map(t => t.tag),
        is_friend: !!isFriend
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

router.get('/recent-visits', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const visits = await all(`
      SELECT rv.*, u.nickname, u.avatar, u.gender, u.is_online
      FROM recent_visits rv
      LEFT JOIN users u ON rv.visited_user_id = u.id
      WHERE rv.user_id = ?
      ORDER BY rv.visited_at DESC LIMIT 20
    `, [userId]);

    res.json({
      success: true,
      data: { visits }
    });
  } catch (error) {
    console.error('获取最近访问错误:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

module.exports = router;
