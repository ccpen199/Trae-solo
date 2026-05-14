import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../database';
import { generateId, hashUrl } from '../utils/crypto';
import { successResponse, errorResponse, badRequestResponse } from '../utils/response';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const getOrCreateRoomSchema = z.object({
  pageUrl: z.string().url('页面URL格式无效'),
  pageTitle: z.string().max(200).optional(),
});

const sendMessageSchema = z.object({
  pageUrl: z.string().url('页面URL格式无效'),
  content: z.string().min(1, '消息内容不能为空').max(1000, '消息内容最多1000个字符'),
  messageType: z.enum(['text', 'emoji', 'system']).default('text'),
});

router.post('/room', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const validation = getOrCreateRoomSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const { pageUrl, pageTitle } = validation.data;
    const pageUrlHash = hashUrl(pageUrl);
    const db = getDb();
    
    let room = db
      .prepare('SELECT * FROM chat_rooms WHERE page_url_hash = ?')
      .get(pageUrlHash) as { id: string; page_url_hash: string; page_title?: string; online_count: number; created_at: string; updated_at: string } | undefined;
    
    if (!room) {
      const roomId = generateId();
      db.prepare(`
        INSERT INTO chat_rooms (id, page_url_hash, page_title, online_count)
        VALUES (?, ?, ?, 0)
      `).run(roomId, pageUrlHash, pageTitle || null);
      
      room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(roomId) as typeof room;
    } else if (pageTitle && room.page_title !== pageTitle) {
      db.prepare('UPDATE chat_rooms SET page_title = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(pageTitle, room.id);
    }
    
    return res.json(
      successResponse({
        room: {
          id: room!.id,
          pageUrlHash: room!.page_url_hash,
          pageTitle: room!.page_title,
          onlineCount: room!.online_count,
        },
      })
    );
  } catch (error) {
    console.error('Get room error:', error);
    return res.status(500).json(errorResponse('获取聊天室失败'));
  }
});

router.get('/messages', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { pageUrl, limit = '50', offset = '0' } = req.query;
    
    if (!pageUrl || typeof pageUrl !== 'string') {
      return res.status(400).json(badRequestResponse('缺少pageUrl参数'));
    }
    
    const pageUrlHash = hashUrl(pageUrl);
    const db = getDb();
    
    const room = db
      .prepare('SELECT id FROM chat_rooms WHERE page_url_hash = ?')
      .get(pageUrlHash) as { id: string } | undefined;
    
    if (!room) {
      return res.json(successResponse({ messages: [], hasMore: false }));
    }
    
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
    const offsetNum = parseInt(offset as string, 10) || 0;
    
    const messages = db
      .prepare(`
        SELECT m.*, u.nickname, u.avatar_config
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(room.id, limitNum, offsetNum) as Array<{
        id: string;
        room_id: string;
        user_id: string;
        content: string;
        message_type: string;
        created_at: string;
        nickname: string;
        avatar_config: string;
      }>;
    
    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg.id,
      userId: msg.user_id,
      nickname: msg.nickname,
      avatarConfig: JSON.parse(msg.avatar_config || '{}'),
      content: msg.content,
      messageType: msg.message_type,
      createdAt: msg.created_at,
    }));
    
    const totalCount = (db
      .prepare('SELECT COUNT(*) as count FROM chat_messages WHERE room_id = ?')
      .get(room.id) as { count: number }).count;
    
    return res.json(
      successResponse({
        messages: formattedMessages,
        hasMore: offsetNum + limitNum < totalCount,
      })
    );
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json(errorResponse('获取消息失败'));
  }
});

router.post('/messages', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(badRequestResponse(validation.error.issues[0]?.message || '参数验证失败'));
    }
    
    const { pageUrl, content, messageType } = validation.data;
    const pageUrlHash = hashUrl(pageUrl);
    const db = getDb();
    
    let room = db
      .prepare('SELECT id FROM chat_rooms WHERE page_url_hash = ?')
      .get(pageUrlHash) as { id: string } | undefined;
    
    if (!room) {
      const roomId = generateId();
      db.prepare(`
        INSERT INTO chat_rooms (id, page_url_hash, online_count)
        VALUES (?, ?, 0)
      `).run(roomId, pageUrlHash);
      room = { id: roomId };
    }
    
    const messageId = generateId();
    db.prepare(`
      INSERT INTO chat_messages (id, room_id, user_id, content, message_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(messageId, room.id, req.userId, content, messageType);
    
    const message = db
      .prepare(`
        SELECT m.*, u.nickname, u.avatar_config
        FROM chat_messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = ?
      `)
      .get(messageId) as {
        id: string;
        user_id: string;
        content: string;
        message_type: string;
        created_at: string;
        nickname: string;
        avatar_config: string;
      };
    
    return res.status(201).json(
      successResponse({
        message: {
          id: message.id,
          userId: message.user_id,
          nickname: message.nickname,
          avatarConfig: JSON.parse(message.avatar_config || '{}'),
          content: message.content,
          messageType: message.message_type,
          createdAt: message.created_at,
        },
      }, '消息发送成功')
    );
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json(errorResponse('发送消息失败'));
  }
});

router.get('/online-users', authMiddleware, (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json(errorResponse('未登录'));
    }
    
    const { pageUrl } = req.query;
    if (!pageUrl || typeof pageUrl !== 'string') {
      return res.status(400).json(badRequestResponse('缺少pageUrl参数'));
    }
    
    const pageUrlHash = hashUrl(pageUrl);
    const db = getDb();
    
    const users = db
      .prepare(`
        SELECT p.user_id, u.nickname, u.avatar_config, p.scroll_position
        FROM page_presence p
        JOIN users u ON p.user_id = u.id
        WHERE p.page_url_hash = ? AND p.is_active = 1
        AND p.last_seen > datetime('now', '-5 minutes')
      `)
      .all(pageUrlHash) as Array<{
        user_id: string;
        nickname: string;
        avatar_config: string;
        scroll_position: number;
      }>;
    
    return res.json(
      successResponse({
        users: users.map((u) => ({
          userId: u.user_id,
          nickname: u.nickname,
          avatarConfig: JSON.parse(u.avatar_config || '{}'),
          scrollPosition: u.scroll_position,
        })),
      })
    );
  } catch (error) {
    console.error('Get online users error:', error);
    return res.status(500).json(errorResponse('获取在线用户失败'));
  }
});

export default router;
