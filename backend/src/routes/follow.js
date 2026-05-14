const express = require('express');
const { db } = require('../db');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

const createNotification = async (db, { userId, type, fromUserId, targetType, targetId, title, content }) => {
  const now = Date.now();
  await db.prepare(`
    INSERT INTO messages (user_id, type, from_user_id, target_type, target_id, title, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, type, fromUserId || null, targetType || null, targetId || null, title || '', content || '', 0, now);
};

router.post('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = Number(userId);
    const now = Date.now();

    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能关注自己'
      });
    }

    const targetUser = await db.prepare('SELECT id, nickname, username FROM users WHERE id = ? AND status = 1').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const existing = await db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user.id, targetUserId);

    let followed = true;
    if (existing) {
      await db.prepare('DELETE FROM follows WHERE id = ?').run(existing.id);
      followed = false;
    } else {
      await db.prepare('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)').run(req.user.id, targetUserId, now);

      await createNotification(db, {
        userId: targetUserId,
        type: 'follow',
        fromUserId: req.user.id,
        targetType: 'user',
        targetId: targetUserId,
        title: '收到新关注',
        content: `${req.user.nickname || req.user.username} 关注了你`
      });
    }

    const followingResult = await db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(req.user.id);
    const followersResult = await db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(targetUserId);

    res.json({
      success: true,
      data: {
        followed,
        following: followingResult.count,
        followers: followersResult.count
      }
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: '操作失败，请稍后重试'
    });
  }
});

router.get('/followers/:userId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const currentUserId = req.user?.id;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM follows WHERE following_id = ?').get(userId);
    const total = totalResult.total;

    const sql = `
      SELECT f.*, u.nickname, u.avatar, u.bio,
             (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following,
             (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers
      FROM follows f
      LEFT JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ? AND u.status = 1
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const followers = await db.prepare(sql).all(userId, limit, offset);

    const result = [];
    for (const f of followers) {
      let isFollowed = false;
      if (currentUserId) {
        const follow = await db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, f.follower_id);
        isFollowed = !!follow;
      }
      result.push({
        id: f.follower_id,
        nickname: f.nickname,
        avatar: f.avatar,
        bio: f.bio,
        following: f.following,
        followers: f.followers,
        isFollowed
      });
    }

    res.json({
      success: true,
      data: {
        list: result,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: '获取粉丝列表失败'
    });
  }
});

router.get('/following/:userId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const currentUserId = req.user?.id;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const totalResult = await db.prepare('SELECT COUNT(*) as total FROM follows WHERE follower_id = ?').get(userId);
    const total = totalResult.total;

    const sql = `
      SELECT f.*, u.nickname, u.avatar, u.bio,
             (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following,
             (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers
      FROM follows f
      LEFT JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ? AND u.status = 1
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const following = await db.prepare(sql).all(userId, limit, offset);

    const result = [];
    for (const f of following) {
      let isFollowed = false;
      if (currentUserId) {
        const follow = await db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, f.following_id);
        isFollowed = !!follow;
      }
      result.push({
        id: f.following_id,
        nickname: f.nickname,
        avatar: f.avatar,
        bio: f.bio,
        following: f.following,
        followers: f.followers,
        isFollowed
      });
    }

    res.json({
      success: true,
      data: {
        list: result,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
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
