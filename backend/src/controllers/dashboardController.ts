import { Request, Response } from 'express';
import db from '../db';

export const getFulfillmentMetrics = (_req: Request, res: Response) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as { count: number };
    const cancelledOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'").get() as { count: number };
    const pendingExceptions = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status = 'pending'").get() as { count: number };
    const lowRatingCount = db.prepare('SELECT COUNT(*) as count FROM order_evaluations WHERE rating <= 2').get() as { count: number };

    const total = totalOrders.count || 1;
    const cancelRate = ((cancelledOrders.count / total) * 100).toFixed(2);
    const complaintRate = ((lowRatingCount.count / (completedOrders.count || 1)) * 100).toFixed(2);

    const overdueOrders = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status = 'in_transit' 
      AND time_window_end IS NOT NULL 
      AND datetime('now') > time_window_end
    `).get() as { count: number };

    const overdueRate = ((overdueOrders.count / (completedOrders.count || 1)) * 100).toFixed(2);

    res.json({
      total_orders: totalOrders.count,
      completed_orders: completedOrders.count,
      cancelled_orders: cancelledOrders.count,
      cancel_rate: parseFloat(cancelRate),
      overdue_rate: parseFloat(overdueRate),
      complaint_rate: parseFloat(complaintRate),
      pending_exceptions: pendingExceptions.count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fulfillment metrics' });
  }
};

export const getTrendsData = (_req: Request, res: Response) => {
  try {
    const days = 7;
    const trends: { date: string; orders: number; completed: number; cancelled: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOrders = Math.floor(Math.random() * 20) + 30;
      const dayCompleted = Math.floor(dayOrders * (0.8 + Math.random() * 0.15));
      const dayCancelled = Math.floor(dayOrders * (0.02 + Math.random() * 0.05));

      trends.push({
        date: dateStr,
        orders: dayOrders,
        completed: dayCompleted,
        cancelled: dayCancelled,
      });
    }

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
};

export const getSupplyDemand = (_req: Request, res: Response) => {
  try {
    const areas = db.prepare('SELECT * FROM heatmap_data').all() as any[];

    const supplyDemandData = areas.map((area) => {
      const orderDemand = Math.floor(area.available_drivers * (1.2 + Math.random() * 0.8));
      const gap = orderDemand - area.available_drivers;
      const warningLevel = gap > 10 ? 'high' : gap > 5 ? 'medium' : 'low';

      return {
        area_code: area.area_code,
        area_name: area.area_name,
        available_drivers: area.available_drivers,
        order_demand: orderDemand,
        gap: gap,
        warning_level: warningLevel,
        lng: area.lng,
        lat: area.lat,
      };
    });

    res.json(supplyDemandData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supply demand data' });
  }
};

export const getEarlyWarnings = (_req: Request, res: Response) => {
  try {
    const areas = db.prepare('SELECT * FROM heatmap_data').all() as any[];

    const warnings: { id: number; area_code: string; area_name: string; type: string; level: string; message: string; created_at: string }[] = [];

    let warningId = 1;
    areas.forEach((area) => {
      const orderDemand = Math.floor(area.available_drivers * (1.2 + Math.random() * 0.8));
      const gap = orderDemand - area.available_drivers;

      if (gap > 5) {
        warnings.push({
          id: warningId++,
          area_code: area.area_code,
          area_name: area.area_name,
          type: 'supply_shortage',
          level: gap > 10 ? 'high' : 'medium',
          message: `${area.area_name}运力缺口${gap}单，预计响应时间延长`,
          created_at: new Date().toISOString(),
        });
      }

      if (area.avg_response_time > 15) {
        warnings.push({
          id: warningId++,
          area_code: area.area_code,
          area_name: area.area_name,
          type: 'slow_response',
          level: 'medium',
          message: `${area.area_name}平均响应时间${area.avg_response_time}分钟，超过阈值`,
          created_at: new Date().toISOString(),
        });
      }
    });

    warnings.push({
      id: warningId++,
      area_code: 'BJ-CY',
      area_name: '朝阳区',
      type: 'peak_hour',
      level: 'high',
      message: '晚高峰即将到来，预计订单量增长40%',
      created_at: new Date().toISOString(),
    });

    warnings.sort((a, b) => {
      const levelOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return levelOrder[a.level] - levelOrder[b.level];
    });

    res.json(warnings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch early warnings' });
  }
};
