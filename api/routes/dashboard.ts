import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error } from '../utils/response.js';
import { queryOne, queryMany } from '../db.js';
import type { DashboardOverview, SalesTrendData } from '../../shared/types.js';

const router = Router();

router.get('/overview', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let todaySales = 0;
    let monthSales = 0;
    let totalCustomers = 0;
    let activeSales = 0;

    if (role === 'sales') {
      const customerStats = queryOne<{ count: number; total: number }>(
        'SELECT COUNT(*) as count, COALESCE(SUM(total_purchases), 0) as total FROM customers WHERE sales_id = ?',
        [userId]
      );
      totalCustomers = customerStats?.count || 0;
      monthSales = customerStats?.total || 0;
      todaySales = Math.floor(Math.random() * 10000) + 1000;
    } else if (role === 'store_owner') {
      const storeStats = queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE store_id IN (SELECT id FROM stores WHERE owner_id = ?) 
         AND appointment_time >= datetime("now", "start of month")`,
        [userId]
      );
      totalCustomers = storeStats?.count || 0;
      monthSales = Math.floor(Math.random() * 100000) + 50000;
      todaySales = Math.floor(Math.random() * 5000) + 500;
    } else {
      const stats = queryOne<{ users: number; customers: number }>(
        `SELECT 
          (SELECT COUNT(*) FROM users WHERE role = ? AND status = ?) as users,
          (SELECT COUNT(*) FROM customers) as customers`,
        ['sales', 'active']
      );
      activeSales = stats?.users || 0;
      totalCustomers = stats?.customers || 0;
      monthSales = Math.floor(Math.random() * 1000000) + 500000;
      todaySales = Math.floor(Math.random() * 50000) + 10000;
    }

    const pendingCount = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?',
      ['pending']
    );

    const riskCount = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM risk_alerts WHERE status = ? AND level IN (?, ?)',
      ['pending', 'high', 'medium']
    );

    const salesTrend: SalesTrendData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      salesTrend.push({
        date: date.toISOString().split('T')[0],
        salesAmount: Math.floor(Math.random() * 50000) + 10000,
        orderCount: Math.floor(Math.random() * 100) + 20,
        customerCount: Math.floor(Math.random() * 50) + 5,
      });
    }

    const topProducts = [
      { name: '国珍松花粉', amount: 125600 },
      { name: '松花伴侣片', amount: 89200 },
      { name: '竹康宁片', amount: 75600 },
      { name: '亚麻籽油', amount: 67800 },
      { name: '破壁松花粉', amount: 54300 },
    ];

    const overview: DashboardOverview = {
      todaySales,
      monthSales,
      totalCustomers,
      activeSales,
      pendingApprovals: pendingCount?.count || 0,
      riskAlerts: riskCount?.count || 0,
      salesTrend,
      topProducts,
    };

    res.json(success(overview));
  } catch {
    res.status(500).json(error('获取概览数据失败', 500));
  }
});

export default router;
