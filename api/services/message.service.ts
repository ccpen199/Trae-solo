import db from '../db/database.js';
import { Message, MessageCreateRequest, ApiResponse, Conversation, UserRole, UserStatus } from '../../shared/types.js';
import { parseTask } from './task.service.js';

function parseUser(row: Record<string, unknown>) {
  if (!row) return undefined;
  return {
    id: row.id as number,
    email: row.email as string,
    phone: (row.phone as string) || '',
    name: row.name as string,
    avatar: (row.avatar as string) || null,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function parseMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as number,
    taskId: row.task_id as number,
    senderId: row.sender_id as number,
    content: row.content as string,
    type: row.type as Message['type'],
    fileUrl: (row.file_url as string) || null,
    fileName: (row.file_name as string) || null,
    read: Boolean(row.read),
    createdAt: row.created_at as string,
  };
}

export class MessageService {
  async getConversations(userId: number): Promise<ApiResponse<Conversation[]>> {
    const rows = db.prepare(`
      SELECT DISTINCT task_id FROM messages
      WHERE task_id IN (
        SELECT id FROM tasks WHERE employer_id = ? OR provider_id = ?
        UNION
        SELECT task_id FROM bids WHERE provider_id = ?
      )
      ORDER BY (SELECT MAX(created_at) FROM messages m WHERE m.task_id = messages.task_id) DESC
    `).all(userId, userId, userId) as { task_id: number }[];

    const conversations: Conversation[] = [];

    for (const row of rows) {
      const taskId = row.task_id;

      const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown> | undefined;
      if (!taskRow) continue;
      const task = parseTask(taskRow);

      const lastMsgRow = db.prepare(`
        SELECT * FROM messages WHERE task_id = ?
        ORDER BY created_at DESC LIMIT 1
      `).get(taskId) as Record<string, unknown> | undefined;
      if (!lastMsgRow) continue;

      const lastMessage = parseMessage(lastMsgRow);
      const senderRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(lastMessage.senderId) as Record<string, unknown> | undefined;
      lastMessage.sender = parseUser(senderRow);

      const unreadRow = db.prepare(`
        SELECT COUNT(*) as count FROM messages
        WHERE task_id = ? AND sender_id != ? AND read = 0
      `).get(taskId, userId) as { count: number };

      const participants = [];
      const employerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(task.employerId) as Record<string, unknown> | undefined;
      if (employerRow) participants.push(parseUser(employerRow));

      if (task.providerId) {
        const providerRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(task.providerId) as Record<string, unknown> | undefined;
        if (providerRow) participants.push(parseUser(providerRow));
      }

      conversations.push({
        taskId,
        taskTitle: task.title,
        lastMessage,
        unreadCount: unreadRow.count,
        participants: participants.filter(Boolean) as any,
      });
    }

    return { success: true, data: conversations };
  }

  async getMessages(taskId: number, userId: number): Promise<ApiResponse<Message[]>> {
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    const userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as Record<string, unknown> | undefined;
    const user = userRow ? parseUser(userRow) : undefined;

    if (user?.role !== 'admin' && task.employerId !== userId && task.providerId !== userId) {
      const hasBid = db.prepare(`SELECT 1 FROM bids WHERE task_id = ? AND provider_id = ?`).get(taskId, userId);
      if (!hasBid) {
        return { success: false, message: '无权访问此对话' };
      }
    }

    db.prepare(`
      UPDATE messages SET read = 1
      WHERE task_id = ? AND sender_id != ? AND read = 0
    `).run(taskId, userId);

    const rows = db.prepare(`
      SELECT * FROM messages WHERE task_id = ?
      ORDER BY created_at ASC
      LIMIT 100
    `).all(taskId) as Record<string, unknown>[];

    const messages = rows.map(row => {
      const msg = parseMessage(row);
      const senderRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(msg.senderId) as Record<string, unknown> | undefined;
      msg.sender = parseUser(senderRow);
      return msg;
    });

    return { success: true, data: messages };
  }

  async sendMessage(taskId: number, data: MessageCreateRequest, senderId: number): Promise<ApiResponse<Message>> {
    const taskRow = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown> | undefined;
    if (!taskRow) {
      return { success: false, message: '任务不存在' };
    }
    const task = parseTask(taskRow);

    const userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(senderId) as Record<string, unknown> | undefined;
    const user = userRow ? parseUser(userRow) : undefined;

    if (user?.role !== 'admin' && task.employerId !== senderId && task.providerId !== senderId) {
      const hasBid = db.prepare(`SELECT 1 FROM bids WHERE task_id = ? AND provider_id = ?`).get(taskId, senderId);
      if (!hasBid) {
        return { success: false, message: '无权发送消息' };
      }
    }

    const result = db.prepare(`
      INSERT INTO messages (task_id, sender_id, content, type, file_url, file_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      senderId,
      data.content,
      data.type || 'text',
      data.fileUrl || null,
      data.fileName || null
    );

    const row = db.prepare(`SELECT * FROM messages WHERE id = ?`).get(result.lastInsertRowid) as Record<string, unknown>;
    const message = parseMessage(row);
    message.sender = user;

    return { success: true, message: '发送成功', data: message };
  }

  async getUnreadCount(userId: number): Promise<ApiResponse<{ total: number; conversations: { taskId: number; count: number }[] }>> {
    const totalRow = db.prepare(`
      SELECT COUNT(*) as total FROM messages
      WHERE sender_id != ? AND read = 0
      AND task_id IN (
        SELECT id FROM tasks WHERE employer_id = ? OR provider_id = ?
        UNION
        SELECT task_id FROM bids WHERE provider_id = ?
      )
    `).get(userId, userId, userId, userId) as { total: number };

    const convRows = db.prepare(`
      SELECT task_id, COUNT(*) as count FROM messages
      WHERE sender_id != ? AND read = 0
      AND task_id IN (
        SELECT id FROM tasks WHERE employer_id = ? OR provider_id = ?
        UNION
        SELECT task_id FROM bids WHERE provider_id = ?
      )
      GROUP BY task_id
    `).all(userId, userId, userId, userId) as { task_id: number; count: number }[];

    return {
      success: true,
      data: {
        total: totalRow.total,
        conversations: convRows.map(r => ({ taskId: r.task_id, count: r.count })),
      },
    };
  }
}

export default new MessageService();
