const express = require('express');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils');

const router = express.Router();

router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let query = `
      SELECT n.*, u.username, u.avatar, v.title as video_title
      FROM notifications n
      JOIN users u ON n.from_user_id = u.id
      LEFT JOIN videos v ON n.video_id = v.id
      WHERE n.user_id = ?
    `;
    const params = [userId];

    if (type) {
      query += ' AND n.type = ?';
      params.push(type);
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const notifications = db.prepare(query).all(...params);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ?
      ${type ? ' AND type = ?' : ''}
    `).get(userId, ...(type ? [type] : []));

    successResponse(res, {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        hasMore: page * limit < total.count
      }
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    errorResponse(res, '获取通知失败');
  }
});

router.get('/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const counts = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = 0
      GROUP BY type
    `).all(userId);

    const result = {
      reply: 0,
      like: 0,
      mention: 0,
      system: 0,
      total: 0
    };

    counts.forEach(c => {
      if (result[c.type] !== undefined) {
        result[c.type] = c.count;
      }
      result.total += c.count;
    });

    successResponse(res, result);
  } catch (error) {
    console.error('获取未读数量失败:', error);
    errorResponse(res, '获取失败');
  }
});

router.post('/notifications/read', authMiddleware, async (req, res) => {
  try {
    const { id, type } = req.body;
    const userId = req.user.id;

    if (id) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    } else if (type) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE type = ? AND user_id = ?').run(type, userId);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    }

    successResponse(res, null, '标记已读成功');
  } catch (error) {
    console.error('标记已读失败:', error);
    errorResponse(res, '操作失败');
  }
});

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = db.prepare(`
      SELECT 
        u.id as user_id,
        u.username,
        u.avatar,
        m.content as last_message,
        m.created_at as last_time,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND sender_id = u.id AND is_read = 0) as unread_count
      FROM users u
      JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
      WHERE (m.sender_id = ? OR m.receiver_id = ?)
        AND u.id != ?
      GROUP BY u.id
      ORDER BY m.created_at DESC
    `).all(userId, userId, userId, userId);

    successResponse(res, conversations);
  } catch (error) {
    console.error('获取会话列表失败:', error);
    errorResponse(res, '获取失败');
  }
});

router.get('/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const messages = db.prepare(`
      SELECT m.*, u.username, u.avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(currentUserId, targetUserId, targetUserId, currentUserId, parseInt(limit), parseInt(offset));

    db.prepare(`
      UPDATE messages SET is_read = 1 
      WHERE sender_id = ? AND receiver_id = ?
    `).run(targetUserId, currentUserId);

    successResponse(res, {
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取消息历史失败:', error);
    errorResponse(res, '获取失败');
  }
});

router.post('/send/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId: receiverId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || content.trim().length === 0) {
      return errorResponse(res, '消息内容不能为空');
    }

    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `).run(senderId, receiverId, content.trim());

    successResponse(res, { id: result.lastInsertRowid }, '发送成功');
  } catch (error) {
    console.error('发送消息失败:', error);
    errorResponse(res, '发送失败');
  }
});

router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const following = db.prepare(`
      SELECT u.id, u.username, u.avatar
      FROM user_follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY u.username
    `).all(userId);

    const followers = db.prepare(`
      SELECT u.id, u.username, u.avatar
      FROM user_follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY u.username
    `).all(userId);

    successResponse(res, { following, followers });
  } catch (error) {
    console.error('获取通讯录失败:', error);
    errorResponse(res, '获取失败');
  }
});

router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId: followingId } = req.params;
    const followerId = req.user.id;

    if (followerId == followingId) {
      return errorResponse(res, '不能关注自己');
    }

    const existing = db.prepare('SELECT * FROM user_follows WHERE follower_id = ? AND following_id = ?').get(followerId, followingId);

    if (existing) {
      db.prepare('DELETE FROM user_follows WHERE id = ?').run(existing.id);
      successResponse(res, { followed: false }, '已取消关注');
    } else {
      db.prepare('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)').run(followerId, followingId);
      
      db.prepare(`
        INSERT INTO notifications (user_id, type, from_user_id)
        VALUES (?, 'follow', ?)
      `).run(followingId, followerId);
      
      successResponse(res, { followed: true }, '关注成功');
    }
  } catch (error) {
    console.error('关注操作失败:', error);
    errorResponse(res, '操作失败');
  }
});

router.post('/block/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId: blockedUserId } = req.params;
    const userId = req.user.id;

    if (userId == blockedUserId) {
      return errorResponse(res, '不能拉黑自己');
    }

    const existing = db.prepare('SELECT * FROM user_blocks WHERE user_id = ? AND blocked_user_id = ?').get(userId, blockedUserId);

    if (existing) {
      db.prepare('DELETE FROM user_blocks WHERE id = ?').run(existing.id);
      successResponse(res, { blocked: false }, '已取消拉黑');
    } else {
      db.prepare('INSERT INTO user_blocks (user_id, blocked_user_id) VALUES (?, ?)').run(userId, blockedUserId);
      successResponse(res, { blocked: true }, '拉黑成功');
    }
  } catch (error) {
    console.error('拉黑操作失败:', error);
    errorResponse(res, '操作失败');
  }
});

module.exports = router;
