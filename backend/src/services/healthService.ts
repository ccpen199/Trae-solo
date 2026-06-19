import { getDb } from '../db';
import { nowTimestamp } from '../utils';
import type { HealthMetrics } from '../types';

export function getHealthMetrics(regionId?: number): HealthMetrics {
  const db = getDb();

  const totalRiders = db
    .prepare('SELECT COUNT(*) as count FROM riders')
    .get() as { count: number };

  const onlineRiders = db
    .prepare("SELECT COUNT(*) as count FROM riders WHERE status IN ('online', 'busy')")
    .get() as { count: number };

  const busyRiders = db
    .prepare("SELECT COUNT(*) as count FROM riders WHERE status = 'busy'")
    .get() as { count: number };

  const totalRiderCount = totalRiders.count;
  const onlineRiderCount = onlineRiders.count;
  const busyRiderCount = busyRiders.count;

  const onlineRate = totalRiderCount > 0 ? onlineRiderCount / totalRiderCount : 0;

  const since = nowTimestamp() - 3600;
  const assignments = db
    .prepare(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM order_assignments 
       WHERE created_at >= ?`
    )
    .get(since) as { total: number; rejected: number };

  const rejectionRate = assignments.total > 0 ? assignments.rejected / assignments.total : 0;

  const complaintSince = nowTimestamp() - 30 * 86400;
  const accidentComplaints = db
    .prepare(
      `SELECT COUNT(*) as count FROM complaints 
       WHERE type IN ('lost', 'service') AND created_at >= ?`
    )
    .get(complaintSince) as { count: number };

  const totalDelivered = db
    .prepare(
      `SELECT COUNT(*) as count FROM orders 
       WHERE status = 'delivered' AND delivered_at >= ?`
    )
    .get(complaintSince) as { count: number };

  const accidentRate = totalDelivered.count > 0 ? accidentComplaints.count / totalDelivered.count : 0;

  const avgFulfillment = db
    .prepare('SELECT AVG(fulfillment_rate) as avg FROM riders')
    .get() as { avg: number };

  return {
    online_rate: Math.round(onlineRate * 100) / 100,
    rejection_rate: Math.round(rejectionRate * 100) / 100,
    accident_rate: Math.round(accidentRate * 10000) / 10000,
    avg_fulfillment_rate: Math.round((avgFulfillment.avg || 0) * 100) / 100,
    total_rider_count: totalRiderCount,
    online_rider_count: onlineRiderCount,
    busy_rider_count: busyRiderCount,
  };
}

export function getRealtimeMetrics() {
  const db = getDb();
  const now = nowTimestamp();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = Math.floor(todayStart.getTime() / 1000);

  const todayOrders = db
    .prepare('SELECT COUNT(*) as count FROM orders WHERE created_at >= ?')
    .get(todayTimestamp) as { count: number };

  const pendingOrders = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'")
    .get() as { count: number };

  const deliveringOrders = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('assigned', 'picking', 'delivering')")
    .get() as { count: number };

  const todayDelivered = db
    .prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered' AND delivered_at >= ?")
    .get(todayTimestamp) as { count: number };

  const pendingComplaints = db
    .prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'")
    .get() as { count: number };

  return {
    timestamp: now,
    today_orders: todayOrders.count,
    pending_orders: pendingOrders.count,
    delivering_orders: deliveringOrders.count,
    today_delivered: todayDelivered.count,
    pending_complaints: pendingComplaints.count,
  };
}

export function recordHealthMetric(
  metricName: string,
  metricValue: number,
  regionId?: number
): void {
  const db = getDb();
  const now = nowTimestamp();
  const nowDate = new Date();
  const dateStr = nowDate.toISOString().slice(0, 10);
  const hour = nowDate.getHours();

  db.prepare(
    `INSERT INTO system_health 
     (metric_name, metric_value, region_id, date, hour, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(metricName, metricValue, regionId || null, dateStr, hour, now);
}

export function getHealthTrend(hours: number = 24): {
  time: string;
  online_count: number;
  order_count: number;
}[] {
  const db = getDb();
  const now = nowTimestamp();
  const since = now - hours * 3600;

  const result: { time: string; online_count: number; order_count: number }[] = [];

  for (let i = hours; i >= 0; i--) {
    const hourTime = now - i * 3600;
    const date = new Date(hourTime * 1000);
    const timeStr = date.toISOString().slice(11, 16);

    const hourStart = hourTime - 3600;
    const ordersInHour = db
      .prepare(
        'SELECT COUNT(*) as count FROM orders WHERE created_at >= ? AND created_at < ?'
      )
      .get(hourStart, hourTime) as { count: number };

    const onlineAtTime = db
      .prepare(
        `SELECT COUNT(*) as count FROM riders 
         WHERE last_online_at >= ? AND status IN ('online', 'busy')`
      )
      .get(hourStart) as { count: number };

    result.push({
      time: timeStr,
      online_count: onlineAtTime.count,
      order_count: ordersInHour.count,
    });
  }

  return result;
}
