import { Request, Response } from 'express';
import db from '../database/connection.js';
import type { KPIData, MerchantAnalytics, MemberProfile } from '../../../shared/types.js';

export async function getPropertyKPI(req: Request, res: Response) {
  try {
    const totalWorkOrders = db.prepare('SELECT COUNT(*) as count FROM work_orders').get() as { count: number };
    const pendingWorkOrders = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status = ?").get('pending') as { count: number };

    const timelyCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM work_orders 
      WHERE status IN ('completed', 'closed')
    `).get() as { count: number };

    const totalCompleted = db.prepare(`
      SELECT COUNT(*) as count FROM work_orders WHERE status IN ('completed', 'closed')
    `).get() as { count: number };

    const workOrderTimelyRate = totalCompleted.count > 0 ? Math.round((timelyCompleted.count / totalCompleted.count) * 100) : 100;

    const complaints = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE type = 'complaint'").get() as { count: number };
    const closedComplaints = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE type = 'complaint' AND status IN ('completed', 'closed')").get() as { count: number };

    const complaintCloseRate = complaints.count > 0 ? Math.round((closedComplaints.count / complaints.count) * 100) : 100;

    const totalDevices = db.prepare('SELECT COUNT(*) as count FROM access_devices').get() as { count: number };
    const onlineDevices = db.prepare("SELECT COUNT(*) as count FROM access_devices WHERE status = 'online'").get() as { count: number };

    const deviceOnlineRate = totalDevices.count > 0 ? Math.round((onlineDevices.count / totalDevices.count) * 100) : 100;

    const today = new Date().toISOString().split('T')[0];
    const todayVisitors = db.prepare(`
      SELECT COUNT(*) as count FROM access_records 
      WHERE DATE(access_time) = ? AND result = 'success'
    `).get(today) as { count: number };

    const kpiData: KPIData = {
      workOrderTimelyRate,
      complaintCloseRate,
      deviceOnlineRate,
      totalWorkOrders: totalWorkOrders.count,
      pendingWorkOrders: pendingWorkOrders.count,
      todayVisitors: todayVisitors.count
    };

    const workOrderTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM work_orders
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    const workOrderByType = db.prepare(`
      SELECT type, COUNT(*) as count
      FROM work_orders
      GROUP BY type
    `).all();

    const workOrderByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM work_orders
      GROUP BY status
    `).all();

    res.json({
      success: true,
      data: {
        kpi: kpiData,
        workOrderTrend,
        workOrderByType,
        workOrderByStatus
      }
    });
  } catch (error) {
    console.error('Get property KPI error:', error);
    res.status(500).json({ success: false, error: '获取KPI数据失败' });
  }
}

export async function getMerchantAnalytics(req: Request & { user?: any }, res: Response) {
  try {
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(req.user.id) as { id: number } | undefined;

    if (!merchant) {
      return res.status(404).json({ success: false, error: '商户不存在' });
    }

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(pay_amount), 0) as total FROM orders WHERE merchant_id = ? AND status = 'paid'
    `).get(merchant.id) as { total: number };

    const orderCount = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE merchant_id = ?
    `).get(merchant.id) as { count: number };

    const averageOrderValue = orderCount.count > 0 ? Math.round(totalRevenue.total / orderCount.count * 100) / 100 : 0;

    const userOrderCounts = db.prepare(`
      SELECT user_id, COUNT(*) as order_count 
      FROM orders 
      WHERE merchant_id = ?
      GROUP BY user_id
    `).all(merchant.id);

    const repeatUsers = userOrderCounts.filter((u: any) => u.order_count >= 2).length;
    const repeatPurchaseRate = userOrderCounts.length > 0 ? Math.round((repeatUsers / userOrderCounts.length) * 100) : 0;

    const coupons = db.prepare('SELECT * FROM coupons WHERE merchant_id = ?').all(merchant.id);
    const totalCoupons = coupons.reduce((sum: number, c: any) => sum + (c.total_quantity || 0), 0) as number;
    const usedCoupons = coupons.reduce((sum: number, c: any) => sum + (c.used_quantity || 0), 0) as number;
    const conversionRate = totalCoupons > 0 ? Math.round((usedCoupons / totalCoupons) * 100) : 0;

    const dailyRevenue = db.prepare(`
      SELECT DATE(created_at) as date, COALESCE(SUM(pay_amount), 0) as revenue
      FROM orders
      WHERE merchant_id = ? AND created_at >= DATE('now', '-30 days') AND status = 'paid'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all(merchant.id) as { date: string; revenue: number }[];

    const analytics: MerchantAnalytics = {
      totalRevenue: totalRevenue.total,
      orderCount: orderCount.count,
      averageOrderValue,
      repeatPurchaseRate,
      conversionRate,
      dailyRevenue
    };

    const topProducts = db.prepare(`
      SELECT p.name, SUM(oi.quantity) as sold_quantity
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.merchant_id = ? AND o.status = 'paid'
      GROUP BY p.id
      ORDER BY sold_quantity DESC
      LIMIT 10
    `).all(merchant.id);

    res.json({
      success: true,
      data: {
        analytics,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get merchant analytics error:', error);
    res.status(500).json({ success: false, error: '获取经营分析数据失败' });
  }
}

export async function getMemberProfile(req: Request & { user?: any }, res: Response) {
  try {
    const membership = db.prepare('SELECT * FROM memberships WHERE user_id = ?').get(req.user.id) as any;

    const userHouses = db.prepare(`
      SELECT h.* FROM houses h
      WHERE h.owner_id = ?
    `).all(req.user.id);

    const myOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE user_id = ?
    `).get(req.user.id) as { count: number };

    const myWorkOrders = db.prepare(`
      SELECT COUNT(*) as count FROM work_orders WHERE user_id = ?
    `).get(req.user.id) as { count: number };

    const couponUsed = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND coupon_id IS NOT NULL
    `).get(req.user.id) as { count: number };

    const visitCount = db.prepare(`
      SELECT COUNT(*) as count FROM access_records WHERE person_name = ?
    `).get(req.user.name) as { count: number };

    const recentOrders = db.prepare(`
      SELECT o.id, COALESCE(m.name, '社区商圈') AS merchantName, o.pay_amount AS totalAmount, o.status, o.created_at
      FROM orders o
      LEFT JOIN merchants m ON m.id = o.merchant_id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
      LIMIT 6
    `).all(req.user.id);

    const levelMap: Record<number, string> = {
      1: 'normal',
      2: 'silver',
      3: 'gold',
      4: 'platinum',
      5: 'diamond'
    };

    res.json({
      success: true,
      data: {
        level: levelMap[Number(membership?.level || 1)] || 'normal',
        points: Number(membership?.points || 0),
        totalSpent: Number(membership?.total_spent || 0),
        orderCount: myOrders.count,
        couponUsed: couponUsed.count,
        visitCount: visitCount.count,
        benefits: [
          '门禁通行记录实时同步',
          '工单优先派单提醒',
          '社区商圈会员权益',
          '邻里活动报名通知'
        ],
        recentOrders,
        membership,
        houses: userHouses,
        workOrderCount: myWorkOrders.count
      }
    });
  } catch (error) {
    console.error('Get member profile error:', error);
    res.status(500).json({ success: false, error: '获取个人信息失败' });
  }
}

export default { getPropertyKPI, getMerchantAnalytics, getMemberProfile };
