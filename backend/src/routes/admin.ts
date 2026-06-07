import { Router, Request, Response } from 'express';
import { db } from '../database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/users', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (req.query.role) {
      where += ' AND role = ?';
      params.push(req.query.role);
    }
    if (req.query.status) {
      where += ' AND status = ?';
      params.push(req.query.status);
    }
    if (req.query.keyword) {
      where += ' AND (username LIKE ? OR real_name LIKE ? OR company_name LIKE ?)';
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`, `%${req.query.keyword}%`);
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params) as any).count;
    const items = db.prepare(`SELECT id, username, real_name, phone, email, role, company_name, license_number, credit_score, status, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset);

    res.json({ items, total, page, pageSize });
  } catch (err) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.patch('/users/:id', requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: '状态为必填项' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    db.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, userId);
    const updated = db.prepare('SELECT id, username, real_name, phone, email, role, company_name, credit_score, status FROM users WHERE id = ?').get(userId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: '更新用户状态失败' });
  }
});

router.get('/compliance', requireRole('admin'), async (_req: Request, res: Response) => {
  try {
    const complianceLogs = db.prepare(`
      SELECT cl.*, u.username, u.real_name, u.role
      FROM compliance_logs cl
      LEFT JOIN users u ON cl.user_id = u.id
      ORDER BY cl.checked_at DESC
    `).all();

    const summary = db.prepare(`
      SELECT
        COUNT(*) as total_checks,
        SUM(CASE WHEN check_result = 'pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN check_result = 'warning' THEN 1 ELSE 0 END) as warnings,
        SUM(CASE WHEN check_result = 'fail' THEN 1 ELSE 0 END) as failed
      FROM compliance_logs
    `).get();

    res.json({ summary, logs: complianceLogs });
  } catch (err) {
    res.status(500).json({ error: '获取合规检查状态失败' });
  }
});

export default router;
