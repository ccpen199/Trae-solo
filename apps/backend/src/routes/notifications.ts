import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { isRead, type, limit = 20 } = req.query;
    const userId = req.user?.userId;
    const role = req.user?.role;

    let queryText = `
      SELECT * FROM notifications 
      WHERE (target_id = $1 OR target_type = 'admin')
    `;
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (isRead !== undefined) {
      queryText += ` AND is_read = $${paramIndex++}`;
      params.push(isRead === 'true');
    }

    if (type) {
      queryText += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
    params.push(parseInt(limit as string, 10));

    const result = await query(queryText, params);

    const notifications = result.rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      targetType: row.target_type,
      targetId: row.target_id,
      title: row.title,
      content: row.content,
      relatedId: row.related_id,
      isRead: row.is_read,
      createdAt: row.created_at,
    }));

    const unreadResult = await query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE (target_id = $1 OR target_type = 'admin') AND is_read = false`,
      [userId]
    );

    res.json({
      notifications,
      unreadCount: parseInt(unreadResult.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: '获取通知列表失败' });
  }
});

router.put('/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '通知不存在' });
    }

    res.json({ message: '标记已读成功' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: '标记通知已读失败' });
  }
});

router.put('/read-all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    await query(
      `UPDATE notifications SET is_read = true 
       WHERE (target_id = $1 OR target_type = 'admin') AND is_read = false`,
      [userId]
    );

    res.json({ message: '所有通知已标记为已读' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: '标记所有通知已读失败' });
  }
});

export default router;
