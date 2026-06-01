import { Router, type Response } from 'express';
import db from '../db/init.js';
import authMiddleware, { roleMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
    const totalSettlements = db.prepare('SELECT COUNT(*) as count FROM settlements').get() as { count: number };
    const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM settlements WHERE status = ?').get('completed') as { total: number };

    const jobSeekers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('job_seeker') as { count: number };
    const employers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('employer') as { count: number };

    const pendingDisputes = db.prepare('SELECT COUNT(*) as count FROM disputes WHERE status = ?').get('pending') as { count: number };
    const pendingSettlements = db.prepare('SELECT COUNT(*) as count FROM settlements WHERE status = ?').get('processing') as { count: number };

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers.count,
        totalJobs: totalJobs.count,
        totalSettlements: totalSettlements.count,
        totalAmount: totalAmount.total,
        jobSeekers: jobSeekers.count,
        employers: employers.count,
        pendingDisputes: pendingDisputes.count,
        pendingSettlements: pendingSettlements.count
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    let query = 'SELECT id, email, name, role, status, created_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let params: any[] = [];

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const users = db.prepare(query).all(...params);

    const countParams = params.slice(0, params.length - 2);
    const countResult = db.prepare(countQuery).all(...countParams) as any[];
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        users,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: '获取用户列表失败' });
  }
});

router.put('/users/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

    res.json({ success: true, message: '用户状态更新成功' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, error: '更新用户状态失败' });
  }
});

router.get('/disputes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;

    let query = `
      SELECT d.*, j.title,
      u_seeker.name as job_seeker_name,
      u_employer.name as employer_name
      FROM disputes d
      JOIN employment_contracts ec ON d.contract_id = ec.id
      JOIN job_applications ja ON ec.application_id = ja.id
      JOIN jobs j ON ja.job_id = j.id
      JOIN job_seekers js ON ja.job_seeker_id = js.id
      JOIN users u_seeker ON js.user_id = u_seeker.id
      JOIN employers e ON j.employer_id = e.id
      JOIN users u_employer ON e.user_id = u_employer.id
    `;
    let params: any[] = [];

    if (status) {
      query += ' WHERE d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.created_at DESC';

    const disputes = db.prepare(query).all(...params);

    res.json({ success: true, data: disputes });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ success: false, error: '获取纠纷列表失败' });
  }
});

router.put('/disputes/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;

    db.prepare(`
      UPDATE disputes SET status = ?, resolution = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, resolution, id);

    res.json({ success: true, message: '纠纷处理完成' });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ success: false, error: '处理纠纷失败' });
  }
});

export default router;
