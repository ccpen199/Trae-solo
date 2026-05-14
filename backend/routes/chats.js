const express = require('express');
const authMiddleware = require('../middleware/auth');
const { runQuery, getQuery, allQuery } = require('../database');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const chats = await allQuery(
      `SELECT 
        c.id, c.type, c.name, c.avatar, c.last_message, c.last_message_time,
        cm.is_top, cm.is_muted, cm.unread_count,
        u.id as user_id, u.nickname as user_nickname, u.avatar as user_avatar
       FROM chat_members cm
       JOIN chats c ON cm.chat_id = c.id
       LEFT JOIN chat_members cm2 ON c.id = cm2.chat_id AND cm2.user_id != cm.user_id
       LEFT JOIN users u ON cm2.user_id = u.id
       WHERE cm.user_id = ?
       ORDER BY cm.is_top DESC, c.last_message_time DESC`,
      [req.user.id]
    );

    const formattedChats = chats.map(chat => ({
      ...chat,
      display_name: chat.type === 0 ? chat.user_nickname : chat.name,
      display_avatar: chat.type === 0 ? chat.user_avatar : chat.avatar
    }));

    res.json({
      success: true,
      data: formattedChats
    });
  } catch (error) {
    console.error('获取聊天列表失败:', error);
    res.json({
      success: false,
      message: '获取聊天列表失败'
    });
  }
});

router.get('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const isMember = await getQuery(
      'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, req.user.id]
    );

    if (!isMember) {
      return res.json({
        success: false,
        message: '无权访问该聊天'
      });
    }

    const messages = await allQuery(
      `SELECT m.*, u.nickname, u.avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = ?
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [chatId, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    console.error('获取消息失败:', error);
    res.json({
      success: false,
      message: '获取消息失败'
    });
  }
});

router.post('/:chatId/messages', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { type = 0, content, mediaUrl } = req.body;

    const isMember = await getQuery(
      'SELECT id FROM chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, req.user.id]
    );

    if (!isMember) {
      return res.json({
        success: false,
        message: '无权发送消息'
      });
    }

    const result = await runQuery(
      'INSERT INTO messages (chat_id, sender_id, type, content, media_url) VALUES (?, ?, ?, ?, ?)',
      [chatId, req.user.id, type, content, mediaUrl]
    );

    await runQuery(
      'UPDATE chats SET last_message = ?, last_message_time = CURRENT_TIMESTAMP WHERE id = ?',
      [content || '[图片]', chatId]
    );

    const message = await getQuery(
      `SELECT m.*, u.nickname, u.avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.lastID]
    );

    res.json({
      success: true,
      message: '发送成功',
      data: message
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.json({
      success: false,
      message: '发送消息失败'
    });
  }
});

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { userId, type = 0 } = req.body;

    if (!userId) {
      return res.json({
        success: false,
        message: '请选择用户'
      });
    }

    const existingChat = await getQuery(
      `SELECT c.id 
       FROM chats c
       JOIN chat_members cm1 ON c.id = cm1.chat_id
       JOIN chat_members cm2 ON c.id = cm2.chat_id
       WHERE c.type = 0 AND cm1.user_id = ? AND cm2.user_id = ?`,
      [req.user.id, userId]
    );

    if (existingChat) {
      return res.json({
        success: true,
        data: { chatId: existingChat.id }
      });
    }

    const chatResult = await runQuery(
      'INSERT INTO chats (type, creator_id) VALUES (?, ?)',
      [type, req.user.id]
    );

    const chatId = chatResult.lastID;

    await runQuery(
      'INSERT INTO chat_members (chat_id, user_id) VALUES (?, ?), (?, ?)',
      [chatId, req.user.id, chatId, userId]
    );

    res.json({
      success: true,
      message: '创建成功',
      data: { chatId }
    });
  } catch (error) {
    console.error('创建聊天失败:', error);
    res.json({
      success: false,
      message: '创建聊天失败'
    });
  }
});

router.put('/:chatId/settings', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { isTop, isMuted } = req.body;

    const updates = [];
    const params = [];

    if (isTop !== undefined) {
      updates.push('is_top = ?');
      params.push(isTop ? 1 : 0);
    }

    if (isMuted !== undefined) {
      updates.push('is_muted = ?');
      params.push(isMuted ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(chatId, req.user.id);
      await runQuery(
        `UPDATE chat_members SET ${updates.join(', ')} WHERE chat_id = ? AND user_id = ?`,
        params
      );
    }

    res.json({
      success: true,
      message: '设置已更新'
    });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.json({
      success: false,
      message: '更新设置失败'
    });
  }
});

module.exports = router;
