const express = require('express');
const { run, get, all } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/like/:toUserId', authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUserId = parseInt(req.params.toUserId);

    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        message: '不能给自己比心'
      });
    }

    const targetUser = await get('SELECT * FROM users WHERE id = ?', [toUserId]);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const existingLike = await get('SELECT * FROM likes WHERE from_user_id = ? AND to_user_id = ?', [fromUserId, toUserId]);
    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: '已经比过心了'
      });
    }

    const reverseLike = await get('SELECT * FROM likes WHERE from_user_id = ? AND to_user_id = ?', [toUserId, fromUserId]);
    
    await run('INSERT INTO likes (from_user_id, to_user_id, is_mutual) VALUES (?, ?, ?)', [fromUserId, toUserId, reverseLike ? 1 : 0]);
    
    if (reverseLike) {
      await run('UPDATE likes SET is_mutual = 1 WHERE id = ?', [reverseLike.id]);
      
      const existingFriendship = await get(
        'SELECT * FROM friends WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
        [fromUserId, toUserId, toUserId, fromUserId]
      );
      
      if (!existingFriendship) {
        await run('INSERT INTO friends (user_id1, user_id2) VALUES (?, ?)', [fromUserId, toUserId]);
      }
    }

    res.json({
      success: true,
      data: { is_mutual: !!reverseLike },
      message: reverseLike ? '互相比心成功，已成为好友！' : '比心成功'
    });
  } catch (error) {
    console.error('比心错误:', error);
    res.status(500).json({
      success: false,
      message: '比心失败'
    });
  }
});

router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await all(`
      SELECT 
        u.id, 
        u.nickname, 
        u.avatar, 
        u.gender, 
        u.is_online,
        f.created_at as friendship_time
      FROM friends f
      LEFT JOIN users u ON (f.user_id1 = u.id OR f.user_id2 = u.id) AND u.id != ?
      WHERE f.user_id1 = ? OR f.user_id2 = ?
      ORDER BY u.is_online DESC, f.created_at DESC
    `, [userId, userId, userId]);

    res.json({
      success: true,
      data: { friends }
    });
  } catch (error) {
    console.error('获取好友列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取好友列表失败'
    });
  }
});

router.get('/messages/:friendId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = parseInt(req.params.friendId);
    const { page = 1, limit = 50 } = req.query;

    const messages = await all(`
      SELECT * FROM (
        SELECT pm.*, u1.nickname as from_nickname, u1.avatar as from_avatar
        FROM private_messages pm
        LEFT JOIN users u1 ON pm.from_user_id = u1.id
        WHERE (pm.from_user_id = ? AND pm.to_user_id = ?) OR (pm.from_user_id = ? AND pm.to_user_id = ?)
        ORDER BY pm.created_at DESC LIMIT ? OFFSET ?
      ) AS sub
      ORDER BY created_at ASC
    `, [userId, friendId, friendId, userId, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);

    await run('UPDATE private_messages SET is_read = 1 WHERE from_user_id = ? AND to_user_id = ?', [friendId, userId]);

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('获取私聊消息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取消息失败'
    });
  }
});

router.post('/messages/:toUserId', authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUserId = parseInt(req.params.toUserId);
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    const targetUser = await get('SELECT * FROM users WHERE id = ?', [toUserId]);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await run(
      'INSERT INTO private_messages (from_user_id, to_user_id, content) VALUES (?, ?, ?)',
      [fromUserId, toUserId, content]
    );

    res.json({
      success: true,
      message: '发送成功'
    });
  } catch (error) {
    console.error('发送私聊消息错误:', error);
    res.status(500).json({
      success: false,
      message: '发送失败'
    });
  }
});

router.get('/received-likes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const likes = await all(`
      SELECT l.*, u.nickname, u.avatar, u.gender
      FROM likes l
      LEFT JOIN users u ON l.from_user_id = u.id
      WHERE l.to_user_id = ?
      ORDER BY l.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: { likes }
    });
  } catch (error) {
    console.error('获取收到的比心错误:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

module.exports = router;
