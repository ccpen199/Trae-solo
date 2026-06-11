import express, { Request, Response } from 'express';
import { getDb } from '../database';
import { authenticateToken } from '../middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import { Message } from '../types';

const router = express.Router();

router.use(authenticateToken);

interface AuthRequest extends Request {
  user?: { userId: string; idCard: string };
}

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { type, is_read, page = 1, pageSize = 20 } = req.query;

    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (type && type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (is_read !== undefined && is_read !== '') {
      whereClause += ' AND is_read = ?';
      params.push(is_read === 'true' ? 1 : 0);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM messages ${whereClause}`);
    const { total } = countStmt.get(...params) as any;

    const offset = (Number(page) - 1) * Number(pageSize);
    const stmt = db.prepare(`
      SELECT * FROM messages ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    params.push(Number(pageSize), offset);

    const messages = stmt.all(...params) as any[];

    return paginatedResponse(res, messages, total, Number(page), Number(pageSize));
  } catch (err) {
    return errorResponse(res, '获取消息列表失败', 500);
  }
});

router.get('/unread-count', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;

    const counts = db.prepare(`
      SELECT 
        type,
        COUNT(*) as count
      FROM messages 
      WHERE user_id = ? AND is_read = 0
      GROUP BY type
    `).all(userId) as any[];

    const totalUnread = counts.reduce((sum, item: any) => sum + item.count, 0);

    const typeMap: Record<string, number> = {
      system: 0,
      business: 0,
      approval: 0,
      service: 0,
    };

    counts.forEach((item: any) => {
      typeMap[item.type] = item.count;
    });

    return successResponse(res, {
      total: totalUnread,
      byType: typeMap,
    });
  } catch (err) {
    return errorResponse(res, '获取未读消息数失败', 500);
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const message = db.prepare(
      'SELECT * FROM messages WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!message) {
      return errorResponse(res, '消息不存在', 404);
    }

    if (!message.is_read) {
      db.prepare(
        'UPDATE messages SET is_read = 1, read_at = ? WHERE id = ?'
      ).run(new Date().toISOString(), id);
    }

    return successResponse(res, message);
  } catch (err) {
    return errorResponse(res, '获取消息详情失败', 500);
  }
});

router.post('/:id/read', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const message = db.prepare(
      'SELECT * FROM messages WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!message) {
      return errorResponse(res, '消息不存在', 404);
    }

    db.prepare(
      'UPDATE messages SET is_read = 1, read_at = ? WHERE id = ?'
    ).run(new Date().toISOString(), id);

    return successResponse(res, null, '标记已读成功');
  } catch (err) {
    return errorResponse(res, '标记已读失败', 500);
  }
});

router.post('/read-all', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { type } = req.body;

    let whereClause = 'user_id = ? AND is_read = 0';
    const params: any[] = [userId];

    if (type && type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const result = db.prepare(`
      UPDATE messages 
      SET is_read = 1, read_at = ?
      WHERE ${whereClause}
    `).run(new Date().toISOString(), ...params);

    return successResponse(res, {
      updated: result.changes,
    }, `已标记${result.changes}条消息为已读`);
  } catch (err) {
    return errorResponse(res, '批量标记已读失败', 500);
  }
});

router.post('/:id/delete', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const { id } = req.params;

    const message = db.prepare(
      'SELECT * FROM messages WHERE id = ? AND user_id = ?'
    ).get(id, userId) as any;

    if (!message) {
      return errorResponse(res, '消息不存在', 404);
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(id);

    return successResponse(res, null, '删除成功');
  } catch (err) {
    return errorResponse(res, '删除失败', 500);
  }
});

router.post('/delete-read', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;

    const result = db.prepare(`
      DELETE FROM messages 
      WHERE user_id = ? AND is_read = 1
    `).run(userId);

    return successResponse(res, {
      deleted: result.changes,
    }, `已删除${result.changes}条已读消息`);
  } catch (err) {
    return errorResponse(res, '清空已读消息失败', 500);
  }
});

router.get('/settings', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;

    const settings = db.prepare(
      'SELECT * FROM notification_settings WHERE user_id = ?'
    ).get(userId) as any;

    if (settings) {
      return successResponse(res, settings);
    }

    return successResponse(res, {
      push_enabled: true,
      system_enabled: true,
      business_enabled: true,
      approval_enabled: true,
      service_enabled: true,
      sound_enabled: true,
      vibration_enabled: false,
      quiet_start: '22:00',
      quiet_end: '07:00',
      quiet_enabled: false,
    });
  } catch (err) {
    return errorResponse(res, '获取通知设置失败', 500);
  }
});

router.post('/settings', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user?.userId;
    const {
      push_enabled,
      system_enabled,
      business_enabled,
      approval_enabled,
      service_enabled,
      sound_enabled,
      vibration_enabled,
      quiet_start,
      quiet_end,
      quiet_enabled,
    } = req.body;

    const existing = db.prepare(
      'SELECT id FROM notification_settings WHERE user_id = ?'
    ).get(userId) as any;

    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE notification_settings SET
          push_enabled = ?,
          system_enabled = ?,
          business_enabled = ?,
          approval_enabled = ?,
          service_enabled = ?,
          sound_enabled = ?,
          vibration_enabled = ?,
          quiet_start = ?,
          quiet_end = ?,
          quiet_enabled = ?,
          updated_at = ?
        WHERE user_id = ?
      `).run(
        push_enabled ? 1 : 0,
        system_enabled ? 1 : 0,
        business_enabled ? 1 : 0,
        approval_enabled ? 1 : 0,
        service_enabled ? 1 : 0,
        sound_enabled ? 1 : 0,
        vibration_enabled ? 1 : 0,
        quiet_start || '22:00',
        quiet_end || '07:00',
        quiet_enabled ? 1 : 0,
        now,
        userId
      );
    } else {
      db.prepare(`
        INSERT INTO notification_settings (
          user_id, push_enabled, system_enabled, business_enabled,
          approval_enabled, service_enabled, sound_enabled, vibration_enabled,
          quiet_start, quiet_end, quiet_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        push_enabled ? 1 : 0,
        system_enabled ? 1 : 0,
        business_enabled ? 1 : 0,
        approval_enabled ? 1 : 0,
        service_enabled ? 1 : 0,
        sound_enabled ? 1 : 0,
        vibration_enabled ? 1 : 0,
        quiet_start || '22:00',
        quiet_end || '07:00',
        quiet_enabled ? 1 : 0,
        now,
        now
      );
    }

    return successResponse(res, null, '设置保存成功');
  } catch (err) {
    return errorResponse(res, '保存设置失败', 500);
  }
});

export default router;
