import { Router, Response } from 'express';
import { getDatabase } from '../database';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { Message, AssetMaster, AssetDetail } from '../types';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const { type, status, page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereClause = `userId = ?`;
    const params: (string | number)[] = [req.user.userId];

    if (type && type !== 'ALL') {
      whereClause += ` AND type = ?`;
      params.push(String(type));
    }

    if (status && status !== 'ALL') {
      whereClause += ` AND status = ?`;
      params.push(String(status));
    }

    const countQuery = `SELECT COUNT(*) as total FROM messages WHERE ${whereClause}`;
    const countResult = db.get<{ total: number }>(countQuery, params);
    const total = countResult?.total || 0;

    const query = `
      SELECT * FROM messages 
      WHERE ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const messages = db.all<Message>(query, [...params, Number(pageSize), offset]);

    const unreadCount = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE userId = ? AND status = 'UNREAD'`,
      [req.user.userId]
    );

    const todoCount = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE userId = ? AND type = 'TODO' AND status = 'UNREAD'`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: {
        list: messages,
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total,
          totalPages: Math.ceil(total / Number(pageSize))
        },
        stats: {
          unreadCount: unreadCount?.count || 0,
          todoCount: todoCount?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败'
    });
  }
});

router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const unreadCount = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE userId = ? AND status = 'UNREAD'`,
      [req.user.userId]
    );

    const todoCount = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE userId = ? AND type = 'TODO' AND status = 'UNREAD'`,
      [req.user.userId]
    );

    const notificationCount = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE userId = ? AND type = 'NOTIFICATION' AND status = 'UNREAD'`,
      [req.user.userId]
    );

    const alertCount = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM messages WHERE userId = ? AND type = 'ALERT' AND status = 'UNREAD'`,
      [req.user.userId]
    );

    const pendingRegister = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM asset_masters WHERE status = 'PENDING_REGISTER' AND currentHandlerId = ?`,
      [req.user.userId]
    );

    const pendingReceive = db.get<{ count: number }>(
      `SELECT COUNT(DISTINCT m.id) as count 
       FROM asset_masters m
       JOIN asset_details d ON m.id = d.masterId
       WHERE m.status = 'PENDING_RECEIVE' 
       AND (d.managerId = ? OR d.department = ?)`,
      [req.user.userId, req.user.department]
    );

    const pendingDepreciation = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM asset_masters WHERE status = 'PENDING_DEPRECIATION' AND currentHandlerId = ?`,
      [req.user.userId]
    );

    const pendingInventory = db.get<{ count: number }>(
      `SELECT COUNT(DISTINCT m.id) as count 
       FROM asset_masters m
       JOIN asset_details d ON m.id = d.masterId
       WHERE m.status = 'PENDING_INVENTORY' 
       AND (d.managerId = ? OR d.department = ?)`,
      [req.user.userId, req.user.department]
    );

    const pendingTransfer = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM asset_masters WHERE status = 'PENDING_TRANSFER' AND currentHandlerId = ?`,
      [req.user.userId]
    );

    const pendingScrap = db.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM asset_masters WHERE status = 'PENDING_SCRAP' AND currentHandlerId = ?`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: {
        messages: {
          unread: unreadCount?.count || 0,
          todo: todoCount?.count || 0,
          notification: notificationCount?.count || 0,
          alert: alertCount?.count || 0
        },
        workflow: {
          pendingRegister: pendingRegister?.count || 0,
          pendingReceive: pendingReceive?.count || 0,
          pendingDepreciation: pendingDepreciation?.count || 0,
          pendingInventory: pendingInventory?.count || 0,
          pendingTransfer: pendingTransfer?.count || 0,
          pendingScrap: pendingScrap?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
});

router.post('/:messageId/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const { messageId } = req.params;
    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const message = db.get<Message>(
      `SELECT * FROM messages WHERE id = ? AND userId = ?`,
      [messageId, req.user.userId]
    );

    if (!message) {
      res.status(404).json({
        success: false,
        message: '消息不存在'
      });
      return;
    }

    const now = new Date().toISOString();
    db.run(
      `UPDATE messages SET status = ? WHERE id = ?`,
      ['READ', messageId]
    );

    res.json({
      success: true,
      message: '消息已标记为已读'
    });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({
      success: false,
      message: '标记消息已读失败'
    });
  }
});

router.post('/read-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    db.run(
      `UPDATE messages SET status = ? WHERE userId = ? AND status = 'UNREAD'`,
      ['READ', req.user.userId]
    );

    res.json({
      success: true,
      message: '所有消息已标记为已读'
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: '标记所有消息已读失败'
    });
  }
});

router.delete('/:messageId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未登录用户' });
      return;
    }

    const { messageId } = req.params;
    const dbPath = process.env.DB_PATH || 'data/app.sqlite';
    const db = await getDatabase(dbPath);

    const result = db.run(
      `DELETE FROM messages WHERE id = ? AND userId = ?`,
      [messageId, req.user.userId]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: '消息不存在'
      });
      return;
    }

    res.json({
      success: true,
      message: '消息已删除'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: '删除消息失败'
    });
  }
});

export default router;
