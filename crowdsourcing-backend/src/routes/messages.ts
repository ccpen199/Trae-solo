import { Router, Request, Response } from 'express';
import Joi from 'joi';
import db from '../database';
import { success, error, getPagination, getPagedResult, logAudit } from '../utils/common';
import { auth } from '../middleware/auth';

const router = Router();

const sendMessageSchema = Joi.object({
  receiverId: Joi.number().integer().positive().required(),
  content: Joi.string().min(1).required(),
  type: Joi.string().valid('text', 'image', 'file').default('text')
});

const getConversationId = (userId1: number, userId2: number) => {
  return `conv_${Math.min(userId1, userId2)}_${Math.max(userId1, userId2)}`;
};

router.get('/conversations', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const conversations = db.prepare(`
      SELECT
        m.conversationId,
        CASE
          WHEN m.senderId = ? THEN m.receiverId
          ELSE m.senderId
        END as otherUserId,
        (SELECT name FROM users WHERE id = CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END) as otherUserName,
        (SELECT avatar FROM users WHERE id = CASE WHEN m.senderId = ? THEN m.receiverId ELSE m.senderId END) as otherUserAvatar,
        m.content as lastMessage,
        m.createdAt as lastMessageTime,
        (SELECT COUNT(*) FROM messages WHERE conversationId = m.conversationId AND receiverId = ? AND isRead = 0) as unreadCount
      FROM messages m
      WHERE m.id IN (
        SELECT MAX(id) FROM messages
        WHERE senderId = ? OR receiverId = ?
        GROUP BY conversationId
      )
      ORDER BY m.createdAt DESC
    `).all(userId, userId, userId, userId, userId, userId);

    res.json(success(conversations, '获取会话列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取会话列表失败', 500));
  }
});

router.get('/:userId', auth, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = Number(req.params.userId);

    const { page, pageSize, offset, limit } = getPagination(
      Number(req.query.page),
      Number(req.query.pageSize)
    );

    const conversationId = getConversationId(currentUserId, otherUserId);

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM messages WHERE conversationId = ?
    `).get(conversationId) as { total: number };

    const messages = db.prepare(`
      SELECT m.*,
             u.name as senderName, u.avatar as senderAvatar
      FROM messages m
      LEFT JOIN users u ON m.senderId = u.id
      WHERE m.conversationId = ?
      ORDER BY m.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(conversationId, limit, offset);

    res.json(success(getPagedResult(messages.reverse(), countResult.total, page, pageSize), '获取消息列表成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取消息列表失败', 500));
  }
});

router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const senderId = req.user!.id;

    const { error: validationError, value } = sendMessageSchema.validate(req.body);
    if (validationError) {
      return res.json(error(validationError.details[0].message, 400));
    }

    if (value.receiverId === senderId) {
      return res.json(error('不能给自己发送消息', 400));
    }

    const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(value.receiverId);
    if (!receiver) {
      return res.json(error('接收用户不存在', 404));
    }

    const conversationId = getConversationId(senderId, value.receiverId);

    const result = db.prepare(`
      INSERT INTO messages (conversationId, senderId, receiverId, content, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(conversationId, senderId, value.receiverId, value.content, value.type);

    const messageId = result.lastInsertRowid as number;

    logAudit(senderId, 'message', 'send', {
      targetId: messageId,
      targetType: 'message',
      details: { receiverId: value.receiverId, type: value.type },
      ip: req.ip
    });

    const message = db.prepare(`
      SELECT m.*,
             u.name as senderName, u.avatar as senderAvatar
      FROM messages m
      LEFT JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `).get(messageId);

    res.json(success(message, '发送消息成功'));
  } catch (err: any) {
    res.json(error(err.message || '发送消息失败', 500));
  }
});

router.get('/unread/count', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = db.prepare(`
      SELECT COUNT(*) as unreadCount
      FROM messages
      WHERE receiverId = ? AND isRead = 0
    `).get(userId) as { unreadCount: number };

    const details = db.prepare(`
      SELECT senderId, COUNT(*) as count
      FROM messages
      WHERE receiverId = ? AND isRead = 0
      GROUP BY senderId
    `).all(userId);

    res.json(success({
      total: result.unreadCount,
      details: details
    }, '获取未读消息统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取未读消息统计失败', 500));
  }
});

router.post('/:userId/read', auth, async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = Number(req.params.userId);

    const conversationId = getConversationId(currentUserId, otherUserId);

    db.prepare(`
      UPDATE messages SET isRead = 1
      WHERE conversationId = ? AND receiverId = ? AND isRead = 0
    `).run(conversationId, currentUserId);

    logAudit(currentUserId, 'message', 'mark_read', {
      details: { conversationId, otherUserId },
      ip: req.ip
    });

    res.json(success(null, '标记已读成功'));
  } catch (err: any) {
    res.json(error(err.message || '标记已读失败', 500));
  }
});

export default router;
