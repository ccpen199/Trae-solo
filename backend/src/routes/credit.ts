import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const user = db.prepare('SELECT id, username, real_name, credit_score, role FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const evalStats = db.prepare(`
      SELECT COUNT(*) as total_evaluations,
             COALESCE(AVG(rating), 0) as avg_rating
      FROM evaluations WHERE to_user_id = ?
    `).get(userId) as any;

    let fulfillmentRate = 0;
    if (user.role === 'driver') {
      const taskStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM transport_tasks WHERE driver_id = ?
      `).get(userId) as any;
      fulfillmentRate = taskStats.total > 0 ? taskStats.completed / taskStats.total : 0;
    } else if (user.role === 'shipper') {
      const taskStats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
        FROM transport_tasks WHERE shipper_id = ?
      `).get(userId) as any;
      fulfillmentRate = taskStats.total > 0 ? taskStats.completed / taskStats.total : 0;
    }

    const recentLogs = db.prepare('SELECT * FROM credit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);

    res.json({
      ...user,
      total_evaluations: evalStats.total_evaluations,
      avg_rating: Math.round(evalStats.avg_rating * 10) / 10,
      fulfillment_rate: Math.round(fulfillmentRate * 100) / 100,
      recent_logs: recentLogs,
    });
  } catch (err) {
    res.status(500).json({ error: '获取信用评分失败' });
  }
});

router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { task_id, to_user_id, rating, comment } = req.body;

    if (!task_id || !to_user_id || !rating) {
      res.status(400).json({ error: '任务ID、被评价用户ID和评分为必填项' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: '评分必须在1-5之间' });
      return;
    }

    const task = db.prepare('SELECT * FROM transport_tasks WHERE id = ?').get(task_id) as any;
    if (!task) {
      res.status(404).json({ error: '运输任务不存在' });
      return;
    }

    const existing = db.prepare('SELECT id FROM evaluations WHERE task_id = ? AND from_user_id = ?').get(task_id, req.user!.userId);
    if (existing) {
      res.status(409).json({ error: '已评价过该任务' });
      return;
    }

    let evaluation_type = 'shipper_to_driver';
    if (req.user!.userId === task.driver_id) {
      evaluation_type = 'driver_to_shipper';
    }

    const result = db.prepare(`
      INSERT INTO evaluations (task_id, from_user_id, to_user_id, rating, comment, evaluation_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(task_id, req.user!.userId, to_user_id, rating, comment || '', evaluation_type);

    const changeValue = rating >= 4 ? 2 : rating <= 2 ? -3 : 0;
    if (changeValue !== 0) {
      const targetUser = db.prepare('SELECT credit_score FROM users WHERE id = ?').get(to_user_id) as any;
      if (targetUser) {
        const newScore = Math.max(0, Math.min(200, targetUser.credit_score + changeValue));
        db.prepare('UPDATE users SET credit_score = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newScore, to_user_id);
        db.prepare(`INSERT INTO credit_logs (user_id, change_type, change_value, reason, new_score) VALUES (?, ?, ?, ?, ?)`).run(
          to_user_id,
          changeValue > 0 ? 'evaluation_bonus' : 'evaluation_penalty',
          changeValue,
          `收到${rating}星评价`,
          newScore,
        );
      }
    }

    const evaluation = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(evaluation);
  } catch (err) {
    res.status(500).json({ error: '创建评价失败' });
  }
});

router.get('/:userId/history', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    const total = (db.prepare('SELECT COUNT(*) as count FROM evaluations WHERE to_user_id = ?').get(userId) as any).count;
    const items = db.prepare(`
      SELECT e.*, u.real_name as from_user_name, u.role as from_user_role
      FROM evaluations e
      LEFT JOIN users u ON e.from_user_id = u.id
      WHERE e.to_user_id = ?
      ORDER BY e.created_at DESC LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: '获取评价历史失败' });
  }
});

export default router;
