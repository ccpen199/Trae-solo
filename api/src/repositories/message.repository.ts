import { db } from '../database/connection';
import type { Message, MessageType } from '../../../shared/types';
import crypto from 'crypto';

interface MessageRow {
  id: string;
  type: string;
  title: string;
  content: string;
  target_role?: string;
  target_outlet_id?: string;
  target_courier_id?: string;
  related_id?: string;
  related_type?: string;
  is_read: number;
  created_at: string;
  read_at?: string;
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    type: row.type as MessageType,
    title: row.title,
    content: row.content,
    targetRole: row.target_role as Message['targetRole'],
    targetOutletId: row.target_outlet_id,
    targetCourierId: row.target_courier_id,
    relatedId: row.related_id,
    relatedType: row.related_type,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

interface MessageFilters {
  courierId?: string;
  outletId?: string;
  type?: MessageType;
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export const messageRepository = {
  findAll(filters: MessageFilters = {}): { list: Message[]; total: number } {
    const { courierId, outletId, type, isRead, page = 1, pageSize = 10 } = filters;
    
    let whereSql = 'WHERE 1=1';
    const params: any[] = [];

    if (courierId) {
      whereSql += ' AND (target_courier_id = ? OR target_courier_id IS NULL)';
      params.push(courierId);
    }
    if (outletId) {
      whereSql += ' AND (target_outlet_id = ? OR target_outlet_id IS NULL)';
      params.push(outletId);
    }
    if (type) {
      whereSql += ' AND type = ?';
      params.push(type);
    }
    if (isRead !== undefined) {
      whereSql += ' AND is_read = ?';
      params.push(isRead ? 1 : 0);
    }

    if (courierId || outletId) {
      whereSql += ' AND (target_courier_id IS NOT NULL OR target_outlet_id IS NOT NULL OR (target_courier_id IS NULL AND target_outlet_id IS NULL))';
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM messages ${whereSql}
    `).get(...params) as { total: number };

    const offset = (page - 1) * pageSize;
    const rows = db.prepare(`
      SELECT * FROM messages ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as MessageRow[];

    return {
      list: rows.map(rowToMessage),
      total: countRow.total,
    };
  },

  findById(id: string): Message | null {
    const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as MessageRow | undefined;
    return row ? rowToMessage(row) : null;
  },

  markAsRead(id: string): Message | null {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare('UPDATE messages SET is_read = 1, read_at = ? WHERE id = ?').run(now, id);
    return messageRepository.findById(id);
  },

  markAllAsRead(courierId?: string, outletId?: string): number {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let sql = 'UPDATE messages SET is_read = 1, read_at = ? WHERE is_read = 0';
    const params: any[] = [now];

    if (courierId) {
      sql += ' AND (target_courier_id = ? OR target_courier_id IS NULL)';
      params.push(courierId);
    }
    if (outletId) {
      sql += ' AND (target_outlet_id = ? OR target_outlet_id IS NULL)';
      params.push(outletId);
    }

    const result = db.prepare(sql).run(...params);
    return result.changes;
  },

  getUnreadCount(courierId?: string, outletId?: string): number {
    let sql = 'SELECT COUNT(*) as count FROM messages WHERE is_read = 0';
    const params: any[] = [];

    if (courierId) {
      sql += ' AND (target_courier_id = ? OR target_courier_id IS NULL)';
      params.push(courierId);
    }
    if (outletId) {
      sql += ' AND (target_outlet_id = ? OR target_outlet_id IS NULL)';
      params.push(outletId);
    }

    const row = db.prepare(sql).get(...params) as { count: number };
    return row.count;
  },

  create(messageData: Omit<Message, 'id' | 'createdAt' | 'isRead' | 'readAt'>): Message {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.prepare(`
      INSERT INTO messages (id, type, title, content, target_role, target_outlet_id, target_courier_id, related_id, related_type, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      messageData.type,
      messageData.title,
      messageData.content,
      messageData.targetRole || null,
      messageData.targetOutletId || null,
      messageData.targetCourierId || null,
      messageData.relatedId || null,
      messageData.relatedType || null,
      now
    );

    return messageRepository.findById(id)!;
  },

  findForUser(courierId?: string, outletId?: string, filters?: Partial<MessageFilters>): { list: Message[]; total: number } {
    return messageRepository.findAll({
      courierId,
      outletId,
      ...filters,
    });
  },
};
