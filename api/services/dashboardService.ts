import { dbQueries, getDb, type DashboardMetrics, type Order, type Rider } from '../db/database.js';

export interface DailyOrderStat {
  date: string;
  total_orders: number;
  completed_orders: number;
  revenue: number;
}

export interface HourlyOrderStat {
  hour: number;
  total_orders: number;
  completed_orders: number;
}

export interface RiderPerformance {
  rider_id: string;
  rider_name: string;
  total_orders: number;
  avg_delivery_time: number;
  on_time_rate: number;
  credit_score: number;
}

export interface TopGoodsType {
  goods_type: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface DashboardOverview extends DashboardMetrics {
  today_orders: number;
  today_revenue: number;
  weekly_orders: number;
  weekly_revenue: number;
}

function getDaysAgoISO(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function getStartOfDayISO(): string {
  return getDaysAgoISO(0);
}

function getStartOfWeekISO(): string {
  return getDaysAgoISO(7);
}

function convertRowToMetrics(
  row: { total_orders: number; completed_orders: number; in_progress_orders: number; exception_orders: number; total_revenue: number },
  pendingCount: number,
): DashboardMetrics {
  return {
    total_orders: row.total_orders,
    completed_orders: row.completed_orders,
    pending_orders: pendingCount,
    exception_orders: row.exception_orders,
    total_revenue: row.total_revenue,
    active_riders: 0,
    avg_delivery_time: 0,
  };
}

export function getDashboardOverview(): DashboardOverview {
  const allTime = dbQueries.dashboard.orderStats().get('1970-01-01T00:00:00.000Z') as {
    total_orders: number;
    completed_orders: number;
    in_progress_orders: number;
    exception_orders: number;
    total_revenue: number;
  };

  const today = dbQueries.dashboard.orderStats().get(getStartOfDayISO()) as {
    total_orders: number;
    completed_orders: number;
    in_progress_orders: number;
    exception_orders: number;
    total_revenue: number;
  };

  const weekly = dbQueries.dashboard.orderStats().get(getStartOfWeekISO()) as {
    total_orders: number;
    completed_orders: number;
    in_progress_orders: number;
    exception_orders: number;
    total_revenue: number;
  };

  const activeRiders = dbQueries.dashboard.activeRiders().get() as { count: number };
  const avgDelivery = dbQueries.dashboard.avgDeliveryTime().get(getStartOfWeekISO()) as { avg_minutes: number };

  const pendingOrders = dbQueries.orders.findByStatus().all('pending') as Order[];

  return {
    ...convertRowToMetrics(allTime, pendingOrders.length),
    active_riders: activeRiders.count,
    avg_delivery_time: Math.round(avgDelivery.avg_minutes * 10) / 10,
    today_orders: today.total_orders,
    today_revenue: Math.round(today.total_revenue * 100) / 100,
    weekly_orders: weekly.total_orders,
    weekly_revenue: Math.round(weekly.total_revenue * 100) / 100,
  };
}

export function getDailyOrderStats(days: number = 7): DailyOrderStat[] {
  const stats: DailyOrderStat[] = [];
  const db = getDb();

  for (let i = days - 1; i >= 0; i--) {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - i);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const row = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        COALESCE(SUM(actual_price), 0) as revenue
      FROM orders
      WHERE created_at >= ? AND created_at < ?
    `).get(startDate.toISOString(), endDate.toISOString()) as {
      total_orders: number;
      completed_orders: number;
      revenue: number;
    };

    stats.push({
      date: startDate.toISOString().split('T')[0],
      total_orders: row.total_orders,
      completed_orders: row.completed_orders,
      revenue: Math.round(row.revenue * 100) / 100,
    });
  }

  return stats;
}

export function getHourlyOrderStats(): HourlyOrderStat[] {
  const stats: HourlyOrderStat[] = [];
  const db = getDb();

  for (let hour = 0; hour < 24; hour++) {
    const row = db.prepare(`
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders
      FROM orders
      WHERE CAST(strftime('%H', created_at) AS INTEGER) = ?
        AND created_at >= ?
    `).get(hour, getStartOfDayISO()) as { total_orders: number; completed_orders: number };

    stats.push({
      hour,
      total_orders: row.total_orders,
      completed_orders: row.completed_orders,
    });
  }

  return stats;
}

export function getRiderPerformance(limit: number = 10): RiderPerformance[] {
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      r.id as rider_id,
      r.name as rider_name,
      r.total_orders,
      r.on_time_rate,
      r.credit_score,
      COALESCE(AVG(
        CAST((julianday(o.completed_at) - julianday(o.picked_up_at)) * 24 * 60 AS REAL)
      ), 0) as avg_delivery_time
    FROM riders r
    LEFT JOIN orders o ON r.id = o.rider_id AND o.status = 'completed'
    WHERE r.total_orders > 0
    GROUP BY r.id
    ORDER BY r.total_orders DESC
    LIMIT ?
  `).all(limit) as Array<{
    rider_id: string;
    rider_name: string;
    total_orders: number;
    on_time_rate: number;
    credit_score: number;
    avg_delivery_time: number;
  }>;

  return rows.map((row) => ({
    rider_id: row.rider_id,
    rider_name: row.rider_name,
    total_orders: row.total_orders,
    avg_delivery_time: Math.round(row.avg_delivery_time * 10) / 10,
    on_time_rate: Math.round(row.on_time_rate * 100) / 100,
    credit_score: row.credit_score,
  }));
}

export function getTopGoodsTypes(limit: number = 5): TopGoodsType[] {
  const db = getDb();

  const totalRow = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(actual_price), 0) as total_revenue FROM orders').get() as {
    count: number;
    total_revenue: number;
  };

  const rows = db.prepare(`
    SELECT
      goods_type,
      COUNT(*) as count,
      COALESCE(SUM(actual_price), 0) as revenue
    FROM orders
    GROUP BY goods_type
    ORDER BY count DESC
    LIMIT ?
  `).all(limit) as Array<{ goods_type: string; count: number; revenue: number }>;

  return rows.map((row) => ({
    goods_type: row.goods_type,
    count: row.count,
    revenue: Math.round(row.revenue * 100) / 100,
    percentage: totalRow.count > 0 ? Math.round((row.count / totalRow.count) * 1000) / 10 : 0,
  }));
}

export function getRecentOrders(limit: number = 10): Order[] {
  return dbQueries.orders.findAll().all().slice(0, limit) as Order[];
}

export function getActiveRidersCount(): number {
  const row = dbQueries.dashboard.activeRiders().get() as { count: number };
  return row.count;
}

export function getOrderStatusCounts(): Record<string, number> {
  const statuses: Order['status'][] = ['pending', 'assigned', 'picked_up', 'delivering', 'completed', 'cancelled', 'exception'];
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const orders = dbQueries.orders.findByStatus().all(status) as Order[];
    counts[status] = orders.length;
  }

  return counts;
}
