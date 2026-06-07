import { type Request, type Response } from 'express';
import db from '../db/index.js';
import type { ApiResponse, ChatSession, Message, SopTemplate } from '../types/index.js';

const parseUserRow = (row: any) => {
  if (!row) return undefined;
  const { password_hash, tags, ...rest } = row;
  return {
    ...rest,
    tags: tags ? JSON.parse(tags) : []
  };
};

export const getSessions = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    let sessions: any[];

    if (role === 'advisor' || role === 'admin') {
      sessions = db.prepare(`
        SELECT cs.*, 
               c.name as customer_name, c.phone as customer_phone,
               a.name as advisor_name,
               p.project_name, p.address
        FROM chat_sessions cs
        LEFT JOIN users c ON cs.customer_id = c.id
        LEFT JOIN users a ON cs.advisor_id = a.id
        LEFT JOIN properties p ON cs.property_id = p.id
        WHERE cs.advisor_id = ? OR cs.customer_id = ?
        ORDER BY cs.last_message_at DESC
      `).all(userId, userId);
    } else {
      sessions = db.prepare(`
        SELECT cs.*, 
               c.name as customer_name, c.phone as customer_phone,
               a.name as advisor_name,
               p.project_name, p.address
        FROM chat_sessions cs
        LEFT JOIN users c ON cs.customer_id = c.id
        LEFT JOIN users a ON cs.advisor_id = a.id
        LEFT JOIN properties p ON cs.property_id = p.id
        WHERE cs.customer_id = ?
        ORDER BY cs.last_message_at DESC
      `).all(userId);
    }

    const sessionsWithLastMessage = sessions.map(session => {
      const lastMessage = db.prepare(`
        SELECT m.*, u.name as sender_name
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.session_id = ?
        ORDER BY m.timestamp DESC
        LIMIT 1
      `).get(session.id) as any;

      const unreadCount = db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE session_id = ? AND receiver_id = ? AND is_read = 0
      `).get(session.id, userId) as { count: number };

      return {
        ...session,
        last_message: lastMessage,
        unread_count: unreadCount.count
      };
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: sessionsWithLastMessage
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取会话列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getMessages = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const { sessionId } = req.params;
    const { page = 1, pageSize = 50 } = req.query;

    const pageNum = parseInt(page as string);
    const size = parseInt(pageSize as string);
    const offset = (pageNum - 1) * size;

    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(sessionId) as any;
    if (!session) {
      res.status(404).json({ code: 404, message: '会话不存在', data: null } as ApiResponse);
      return;
    }

    if (session.customer_id !== userId && session.advisor_id !== userId) {
      res.status(403).json({ code: 403, message: '无权访问该会话', data: null } as ApiResponse);
      return;
    }

    db.prepare(`
      UPDATE messages SET is_read = 1 
      WHERE session_id = ? AND receiver_id = ? AND is_read = 0
    `).run(sessionId, userId);

    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM messages WHERE session_id = ?
    `).get(sessionId) as { total: number };

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.session_id = ?
      ORDER BY m.timestamp DESC
      LIMIT ? OFFSET ?
    `).all(sessionId, size, offset) as any[];

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: messages.reverse(),
        total: countResult.total,
        page: pageNum,
        pageSize: size
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取消息列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const sendMessage = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const { sessionId, content, type = 'text' } = req.body;

    if (!sessionId || !content) {
      res.status(400).json({ code: 400, message: '参数不完整', data: null } as ApiResponse);
      return;
    }

    const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(sessionId) as any;
    if (!session) {
      res.status(404).json({ code: 404, message: '会话不存在', data: null } as ApiResponse);
      return;
    }

    if (session.customer_id !== userId && session.advisor_id !== userId) {
      res.status(403).json({ code: 403, message: '无权发送消息', data: null } as ApiResponse);
      return;
    }

    const receiverId = session.customer_id === userId ? session.advisor_id : session.customer_id;

    const result = db.prepare(`
      INSERT INTO messages (session_id, sender_id, receiver_id, content, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, userId, receiverId, content, type);

    db.prepare(`
      UPDATE chat_sessions SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(sessionId);

    const message = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      code: 200,
      message: '发送成功',
      data: message
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '发送消息失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const createSession = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '请先登录', data: null } as ApiResponse);
      return;
    }

    const { propertyId, advisorId } = req.body;

    if (!propertyId || !advisorId) {
      res.status(400).json({ code: 400, message: '参数不完整', data: null } as ApiResponse);
      return;
    }

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      res.status(404).json({ code: 404, message: '房源不存在', data: null } as ApiResponse);
      return;
    }

    const advisor = db.prepare('SELECT * FROM users WHERE id = ? AND role IN (?, ?)').get(advisorId, 'advisor', 'admin');
    if (!advisor) {
      res.status(404).json({ code: 404, message: '顾问不存在', data: null } as ApiResponse);
      return;
    }

    const existingSession = db.prepare(`
      SELECT * FROM chat_sessions 
      WHERE customer_id = ? AND property_id = ? AND advisor_id = ?
    `).get(userId, propertyId, advisorId) as any;

    if (existingSession) {
      res.json({
        code: 200,
        message: '会话已存在',
        data: existingSession
      } as ApiResponse);
      return;
    }

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    db.prepare(`
      INSERT INTO chat_sessions (id, customer_id, advisor_id, property_id)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, userId, advisorId, propertyId);

    const session = db.prepare(`
      SELECT cs.*, 
             c.name as customer_name,
             a.name as advisor_name,
             p.project_name, p.address
      FROM chat_sessions cs
      LEFT JOIN users c ON cs.customer_id = c.id
      LEFT JOIN users a ON cs.advisor_id = a.id
      LEFT JOIN properties p ON cs.property_id = p.id
      WHERE cs.id = ?
    `).get(sessionId);

    res.json({
      code: 200,
      message: '创建成功',
      data: session
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '创建会话失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getSopTemplates = (req: Request, res: Response): void => {
  try {
    const { category, scenario } = req.query;

    const where: string[] = [];
    const params: any[] = [];

    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (scenario) {
      where.push('scenario = ?');
      params.push(scenario);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const templates = db.prepare(`
      SELECT * FROM sop_templates ${whereClause} ORDER BY category, id
    `).all(...params) as SopTemplate[];

    res.json({
      code: 200,
      message: '获取成功',
      data: templates
    } as ApiResponse<SopTemplate[]>);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取SOP模板失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export const getAdvisors = (req: Request, res: Response): void => {
  try {
    const { city } = req.query;

    let advisors: any[];
    if (city) {
      advisors = db.prepare(`
        SELECT id, name, phone, role, city, tags, created_at
        FROM users 
        WHERE role IN (?, ?) AND city = ?
        ORDER BY created_at DESC
      `).all('advisor', 'admin', city);
    } else {
      advisors = db.prepare(`
        SELECT id, name, phone, role, city, tags, created_at
        FROM users 
        WHERE role IN (?, ?)
        ORDER BY created_at DESC
      `).all('advisor', 'admin');
    }

    const result = advisors.map(a => ({
      ...a,
      tags: a.tags ? JSON.parse(a.tags) : []
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: result
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取顾问列表失败：' + (error as Error).message,
      data: null
    } as ApiResponse);
  }
};

export default {
  getSessions,
  getMessages,
  sendMessage,
  createSession,
  getSopTemplates,
  getAdvisors
};
