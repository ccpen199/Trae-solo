import { Router, type Response } from 'express';
import type { ApiResponse, Notification, RemoteRecordStatus, PaginationParams, PaginationResponse } from '@shared/types';
import { getDb } from '../models/db.js';
import { type AuthRequest } from '../middleware/auth.js';

const notificationRouter = Router();
const remoteRecordRouter = Router();

notificationRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const { page = 1, pageSize = 20, type, level, unreadOnly } = req.query as PaginationParams & {
    type?: string;
    level?: string;
    unreadOnly?: string;
  };
  
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [userId];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  if (level) {
    sql += ' AND level = ?';
    params.push(level);
  }
  
  if (unreadOnly === 'true') {
    sql += ' AND is_read = 0';
  }
  
  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const totalResult = db.prepare(countSql).get(...params) as { count: number };
  const total = totalResult.count;
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
  
  const notifications = db.prepare(sql).all(...params) as any[];
  
  const formattedNotifications: Notification[] = notifications.map(n => ({
    id: n.id,
    type: n.type as Notification['type'],
    title: n.title,
    content: n.content,
    level: n.level as Notification['level'],
    read: !!n.is_read,
    createdAt: n.created_at,
    actionUrl: n.action_url || undefined,
    retryable: !!n.retryable
  }));
  
  const response: ApiResponse<PaginationResponse<Notification>> = {
    code: 0,
    message: '获取成功',
    data: {
      list: formattedNotifications,
      total,
      page: Number(page),
      pageSize: Number(pageSize)
    }
  };
  
  res.json(response);
});

notificationRouter.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { id } = req.params;
  const db = getDb();
  
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, userId);
  
  if (!notification) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '通知不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  
  const response: ApiResponse<{ success: boolean }> = {
    code: 0,
    message: '标记成功',
    data: { success: true }
  };
  
  res.json(response);
});

notificationRouter.post('/:id/retry', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { id } = req.params;
  const db = getDb();
  
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, userId) as any;
  
  if (!notification) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '通知不存在',
      data: null
    };
    res.status(404).json(response);
    return;
  }
  
  if (!notification.retryable) {
    const response: ApiResponse<null> = {
      code: 400,
      message: '该通知不支持重试',
      data: null
    };
    res.status(400).json(response);
    return;
  }
  
  const remoteRecords = db.prepare(`
    SELECT * FROM remote_records 
    WHERE user_id = ? AND status = 'failed'
  `).all(userId) as any[];
  
  if (remoteRecords.length > 0) {
    for (const rr of remoteRecords) {
      db.prepare(`
        UPDATE remote_records 
        SET status = 'pending', attempt_count = attempt_count + 1, next_retry = ?
        WHERE id = ?
      `).run(new Date(Date.now() + 5 * 1000).toISOString(), rr.id);
    }
  }
  
  const response: ApiResponse<{ success: boolean; message: string }> = {
    code: 0,
    message: '已提交重试申请，请等待处理',
    data: {
      success: true,
      message: '系统将在5秒后自动重试'
    }
  };
  
  res.json(response);
});

remoteRecordRouter.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const db = getDb();
  
  const records = db.prepare(`
    SELECT * FROM remote_records 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as any[];
  
  const formattedRecords: RemoteRecordStatus[] = records.map(r => ({
    id: r.id,
    status: r.status as RemoteRecordStatus['status'],
    area: r.area,
    hospital: r.hospital,
    attemptCount: r.attempt_count,
    nextRetryAt: r.next_retry || undefined,
    errorMessage: r.error_message || undefined
  }));
  
  const response: ApiResponse<RemoteRecordStatus[]> = {
    code: 0,
    message: '获取成功',
    data: formattedRecords
  };
  
  res.json(response);
});

remoteRecordRouter.post('/retry', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || 'user_001';
  const { id } = req.body as { id?: string };
  const db = getDb();
  
  let records: any[];
  
  if (id) {
    const record = db.prepare('SELECT * FROM remote_records WHERE id = ? AND user_id = ?').get(id, userId);
    if (!record) {
      const response: ApiResponse<null> = {
        code: 404,
        message: '备案记录不存在',
        data: null
      };
      res.status(404).json(response);
      return;
    }
    records = [record];
  } else {
    records = db.prepare(`
      SELECT * FROM remote_records 
      WHERE user_id = ? AND status = 'failed'
    `).all(userId);
  }
  
  for (const rr of records) {
    db.prepare(`
      UPDATE remote_records 
      SET status = 'pending', attempt_count = attempt_count + 1, next_retry = ?, error_message = NULL
      WHERE id = ?
    `).run(new Date(Date.now() + 5 * 1000).toISOString(), rr.id);
  }
  
  const response: ApiResponse<{ success: boolean; retryCount: number }> = {
    code: 0,
    message: '已提交重试申请',
    data: {
      success: true,
      retryCount: records.length
    }
  };
  
  res.json(response);
});

export { notificationRouter, remoteRecordRouter };
