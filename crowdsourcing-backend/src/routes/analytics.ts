import { Router, Request, Response } from 'express';
import db from '../database';
import { success, error, logAudit } from '../utils/common';
import { auth, requireAdmin } from '../middleware/auth';

const router = Router();

const getPlatformStats = () => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  const totalProviders = (db.prepare('SELECT COUNT(*) as count FROM providers').get() as { count: number }).count;
  const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number }).count;
  const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as { count: number }).count;
  const totalPayments = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'").get() as { total: number }).total;
  const totalDisputes = (db.prepare('SELECT COUNT(*) as count FROM disputes').get() as { count: number }).count;
  const pendingReviews = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending_review'").get() as { count: number }).count;

  return {
    totalUsers,
    totalProviders,
    totalEmployers: Math.max(0, totalUsers - totalProviders - 1),
    totalTasks,
    completedTasks,
    pendingTasks: pendingReviews,
    totalDisputes,
    totalRevenue: totalPayments,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
};

const getCategoryStats = () => db.prepare(`
  SELECT
    c.id,
    c.name as categoryName,
    c.name,
    c.icon,
    COUNT(t.id) as taskCount,
    COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) as completedCount,
    COALESCE(SUM(t.budgetMax), 0) as amount
  FROM categories c
  LEFT JOIN tasks t ON c.id = t.categoryId
  GROUP BY c.id, c.name, c.icon
  ORDER BY taskCount DESC
`).all();

router.get('/platform-stats', auth, async (req: Request, res: Response) => {
  try {
    res.json(success(getPlatformStats(), '获取平台统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取平台统计失败', 500));
  }
});

router.get('/category-stats', auth, async (req: Request, res: Response) => {
  try {
    res.json(success(getCategoryStats(), '获取分类统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取分类统计失败', 500));
  }
});

router.get('/revenue-trend', auth, async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;
    const rows = db.prepare(`
      SELECT DATE(createdAt) as date, COALESCE(SUM(amount), 0) as amount
      FROM payments
      WHERE createdAt >= DATE('now', ?) AND status = 'completed'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `).all(`-${days} days`);
    res.json(success(rows, '获取收入趋势成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取收入趋势失败', 500));
  }
});

router.get('/task-heatmap', auth, async (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT COALESCE(p.location, '未知') as region,
             COUNT(DISTINCT t.id) as taskCount,
             COALESCE(SUM(t.budgetMax), 0) as amount
      FROM tasks t
      LEFT JOIN providers p ON t.providerId = p.id
      GROUP BY COALESCE(p.location, '未知')
      ORDER BY taskCount DESC
    `).all();
    res.json(success(rows, '获取任务热力数据成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取任务热力数据失败', 500));
  }
});

router.get('/my-stats', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const provider = db.prepare('SELECT id FROM providers WHERE userId = ?').get(userId) as any;
    const where = provider ? 'providerId = ?' : 'employerId = ?';
    const id = provider ? provider.id : userId;
    const row = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END), 0) as inProgress,
        COALESCE(SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END), 0) as pendingReview,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(budgetMax), 0) as totalAmount
      FROM tasks
      WHERE ${where}
    `).get(id) as any;
    res.json(success({
      ...row,
      thisMonthEarnings: row.totalAmount,
    }, '获取个人统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取个人统计失败', 500));
  }
});

router.get('/provider/:id', auth, async (req: Request, res: Response) => {
  try {
    const provider = db.prepare('SELECT * FROM providers WHERE id = ? OR userId = ?').get(req.params.id, req.params.id) as any;
    if (!provider) {
      return res.json(error('服务商不存在', 404));
    }
    res.json(success({
      completedTasks: provider.completedTasks || 0,
      totalEarnings: provider.totalEarnings || 0,
      rating: provider.rating || 5,
      responseRate: 98,
      onTimeRate: 95,
      goodRate: 98,
    }, '获取服务商统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取服务商统计失败', 500));
  }
});

router.get('/overview', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalProviders = db.prepare('SELECT COUNT(*) as count FROM providers').get() as { count: number };
    const totalTasks = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as { count: number };
    const totalPayments = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'").get() as { total: number };
    const totalDisputes = db.prepare('SELECT COUNT(*) as count FROM disputes').get() as { count: number };
    const resolvedDisputes = db.prepare("SELECT COUNT(*) as count FROM disputes WHERE status IN ('resolved', 'closed')").get() as { count: number };
    const totalIps = db.prepare('SELECT COUNT(*) as count FROM ip_certificates').get() as { count: number };
    const pendingReviews = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending_review'").get() as { count: number };

    const recentTasks = db.prepare(`
      SELECT t.id, t.title, t.status, t.budgetMax, t.createdAt, c.name as categoryName, u.name as employerName
      FROM tasks t
      LEFT JOIN categories c ON t.categoryId = c.id
      LEFT JOIN users u ON t.employerId = u.id
      ORDER BY t.createdAt DESC
      LIMIT 5
    `).all();

    const recentPayments = db.prepare(`
      SELECT p.*, t.title as taskTitle, u.name as payerName
      FROM payments p
      LEFT JOIN tasks t ON p.taskId = t.id
      LEFT JOIN users u ON p.payerId = u.id
      WHERE p.status = 'completed'
      ORDER BY p.createdAt DESC
      LIMIT 5
    `).all();

    logAudit(req.user!.id, 'analytics', 'overview', {
      ip: req.ip
    });

    res.json(success({
      users: {
        total: totalUsers.count,
        providers: totalProviders.count
      },
      tasks: {
        total: totalTasks.count,
        completed: completedTasks.count,
        pendingReview: pendingReviews.count,
        completionRate: totalTasks.count > 0 ? Math.round((completedTasks.count / totalTasks.count) * 100) : 0
      },
      finance: {
        totalTransaction: totalPayments.total,
        averageTransaction: completedTasks.count > 0 ? totalPayments.total / completedTasks.count : 0
      },
      disputes: {
        total: totalDisputes.count,
        resolved: resolvedDisputes.count
      },
      ip: {
        total: totalIps.count
      },
      recentTasks,
      recentPayments
    }, '获取平台统计总览成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取统计总览失败', 500));
  }
});

router.get('/categories', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const categoryStats = db.prepare(`
      SELECT
        c.id,
        c.name,
        c.icon,
        COUNT(t.id) as taskCount,
        COALESCE(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END), 0) as completedCount,
        COALESCE(SUM(t.budgetMax), 0) as totalBudget,
        COALESCE(AVG(p.rating), 0) as avgRating
      FROM categories c
      LEFT JOIN tasks t ON c.id = t.categoryId
      LEFT JOIN providers p ON c.id = p.categoryId
      GROUP BY c.id, c.name, c.icon
      ORDER BY taskCount DESC
    `).all();

    logAudit(req.user!.id, 'analytics', 'categories', {
      ip: req.ip
    });

    res.json(success(categoryStats, '获取分类统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取分类统计失败', 500));
  }
});

router.get('/tasks/trend', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;

    const taskTrend = db.prepare(`
      SELECT
        DATE(createdAt) as date,
        COUNT(*) as total,
        COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) as published,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed
      FROM tasks
      WHERE createdAt >= DATE('now', ?)
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `).all(`-${days} days`);

    const budgetTrend = db.prepare(`
      SELECT
        DATE(p.createdAt) as date,
        COALESCE(SUM(CASE WHEN p.type = 'release' THEN p.amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN p.type = 'refund' THEN p.amount ELSE 0 END), 0) as refund
      FROM payments p
      WHERE p.createdAt >= DATE('now', ?) AND p.status = 'completed'
      GROUP BY DATE(p.createdAt)
      ORDER BY date ASC
    `).all(`-${days} days`);

    logAudit(req.user!.id, 'analytics', 'task_trend', {
      details: { days },
      ip: req.ip
    });

    res.json(success({
      taskTrend,
      budgetTrend
    }, '获取任务趋势成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取任务趋势失败', 500));
  }
});

router.get('/finance', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const totalIncome = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE status = 'completed' AND type = 'release'
    `).get() as { total: number };

    const totalEscrow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE status = 'completed' AND type = 'escrow'
    `).get() as { total: number };

    const totalMilestone = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE status = 'completed' AND type = 'milestone'
    `).get() as { total: number };

    const totalRefund = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments
      WHERE status = 'completed' AND type = 'refund'
    `).get() as { total: number };

    const monthlyStats = db.prepare(`
      SELECT
        strftime('%Y-%m', createdAt) as month,
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM payments
      WHERE status = 'completed'
      GROUP BY strftime('%Y-%m', createdAt), type
      ORDER BY month DESC
      LIMIT 12
    `).all();

    const topEarners = db.prepare(`
      SELECT
        p.id,
        u.name,
        u.avatar,
        p.totalEarnings,
        p.completedTasks,
        p.rating
      FROM providers p
      LEFT JOIN users u ON p.userId = u.id
      ORDER BY p.totalEarnings DESC
      LIMIT 10
    `).all();

    logAudit(req.user!.id, 'analytics', 'finance', {
      ip: req.ip
    });

    res.json(success({
      summary: {
        totalIncome: totalIncome.total,
        totalEscrow: totalEscrow.total,
        totalMilestone: totalMilestone.total,
        totalRefund: totalRefund.total,
        netRevenue: totalIncome.total + totalMilestone.total - totalRefund.total
      },
      monthlyStats,
      topEarners
    }, '获取财务统计成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取财务统计失败', 500));
  }
});

router.get('/heatmap', auth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const regionTaskStats = db.prepare(`
      SELECT
        COALESCE(p.location, '未知') as region,
        COUNT(DISTINCT p.id) as providerCount,
        COUNT(DISTINCT t.id) as taskCount,
        COALESCE(SUM(p.totalEarnings), 0) as totalAmount
      FROM providers p
      LEFT JOIN tasks t ON p.id = t.providerId
      WHERE p.location IS NOT NULL
      GROUP BY p.location
      ORDER BY taskCount DESC
    `).all() as Array<{ region: string; taskCount: number; providerCount: number; totalAmount: number }>;

    const heatmapData = regionTaskStats.map((item) => ({
      region: item.region,
      taskCount: item.taskCount,
      providerCount: item.providerCount,
      totalAmount: item.totalAmount,
      intensity: Math.min(100, Math.round((item.taskCount / Math.max(1, regionTaskStats[0]?.taskCount || 1)) * 100))
    }));

    logAudit(req.user!.id, 'analytics', 'heatmap', {
      ip: req.ip
    });

    res.json(success({
      regions: heatmapData,
      totalRegions: heatmapData.length,
      maxTasks: Math.max(...heatmapData.map((d: any) => d.taskCount)),
      maxAmount: Math.max(...heatmapData.map((d: any) => d.totalAmount))
    }, '获取热力图数据成功'));
  } catch (err: any) {
    res.json(error(err.message || '获取热力图数据失败', 500));
  }
});

export default router;
