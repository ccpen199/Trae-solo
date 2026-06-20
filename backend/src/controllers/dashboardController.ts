import { Request, Response } from 'express';
import db from '../db';

export const getFulfillmentMetrics = (_req: Request, res: Response) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as { count: number };
    const cancelledOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'").get() as { count: number };
    const pendingExceptions = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status = 'pending'").get() as { count: number };
    const activeDrivers = db.prepare("SELECT COUNT(*) as count FROM drivers WHERE status IN ('available', 'busy')").get() as { count: number };

    const overdueOrders = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE status = 'in_transit' 
      AND time_window_end IS NOT NULL 
      AND datetime('now') > time_window_end
    `).get() as { count: number };

    const total = totalOrders.count || 1;
    const onTimeRate = completedOrders.count > 0
      ? parseFloat((((completedOrders.count - overdueOrders.count) / completedOrders.count) * 100).toFixed(2))
      : 100;

    res.success({
      total_orders: totalOrders.count,
      completed_orders: completedOrders.count,
      on_time_rate: onTimeRate,
      avg_delivery_time: 45,
      active_drivers: activeDrivers.count,
      exception_count: pendingExceptions.count,
    });
  } catch (error) {
    res.error('Failed to fetch fulfillment metrics');
  }
};

export const getTrendsData = (_req: Request, res: Response) => {
  try {
    const days = 7;
    const trends: { date: string; orders: number; completed: number; rate: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOrders = Math.floor(Math.random() * 20) + 30;
      const dayCompleted = Math.floor(dayOrders * (0.8 + Math.random() * 0.15));
      const dayRate = parseFloat(((dayCompleted / dayOrders) * 100).toFixed(1));

      trends.push({
        date: dateStr,
        orders: dayOrders,
        completed: dayCompleted,
        rate: dayRate,
      });
    }

    res.success(trends);
  } catch (error) {
    res.error('Failed to fetch trends data');
  }
};

export const getSupplyDemand = (_req: Request, res: Response) => {
  try {
    const areas = db.prepare('SELECT * FROM heatmap_data').all() as any[];

    const supplyDemandData = areas.map((area) => {
      const orderDemand = Math.floor(area.available_drivers * (1.2 + Math.random() * 0.8));
      const gap = orderDemand - area.available_drivers;

      return {
        area: area.area_name,
        supply: area.available_drivers,
        demand: orderDemand,
        gap: gap,
      };
    });

    res.success(supplyDemandData);
  } catch (error) {
    res.error('Failed to fetch supply demand data');
  }
};

export const getEarlyWarnings = (_req: Request, res: Response) => {
  try {
    const areas = db.prepare('SELECT * FROM heatmap_data').all() as any[];

    const warnings: { id: number; type: string; level: string; message: string; time: string }[] = [];

    let warningId = 1;
    areas.forEach((area) => {
      const orderDemand = Math.floor(area.available_drivers * (1.2 + Math.random() * 0.8));
      const gap = orderDemand - area.available_drivers;

      if (gap > 5) {
        warnings.push({
          id: warningId++,
          type: gap > 10 ? 'supply_shortage' : 'imbalance',
          level: gap > 10 ? 'red' : 'orange',
          message: `${area.area_name}运力缺口${gap}单，预计响应时间延长`,
          time: new Date().toISOString(),
        });
      }

      if (area.avg_response_time > 15) {
        warnings.push({
          id: warningId++,
          type: 'slow_response',
          level: 'yellow',
          message: `${area.area_name}平均响应时间${area.avg_response_time}分钟，超过阈值`,
          time: new Date().toISOString(),
        });
      }
    });

    warnings.sort((a, b) => {
      const levelOrder: Record<string, number> = { red: 0, orange: 1, yellow: 2 };
      return levelOrder[a.level] - levelOrder[b.level];
    });

    res.success(warnings);
  } catch (error) {
    res.error('Failed to fetch early warnings');
  }
};
