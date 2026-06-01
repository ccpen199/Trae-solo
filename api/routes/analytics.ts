import { Router, Request, Response } from 'express';
import db from '../db';
import { authenticate, requireRole } from '../middleware/auth';
import dayjs from 'dayjs';

const router = Router();

router.get('/overview', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, start_date, end_date } = req.query;
  
  const startDate = start_date ? dayjs(start_date as string).format('YYYY-MM-DD') : dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date ? dayjs(end_date as string).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  let stationFilter = '';
  let params: any[] = [startDate, endDate];
  if (station_id) {
    stationFilter = ' AND station_id = ?';
    params.push(station_id);
  }

  const totalOrders = db.prepare(`
    SELECT COUNT(*) as total, SUM(total_kwh) as total_kwh, SUM(total_amount) as total_revenue
    FROM charging_orders
    WHERE DATE(created_at) BETWEEN ? AND ?
    ${stationFilter}
  `).get(...params) as any;

  const todayOrders = db.prepare(`
    SELECT COUNT(*) as count, SUM(total_kwh) as kwh, SUM(total_amount) as revenue
    FROM charging_orders
    WHERE DATE(created_at) = DATE('now')
    ${station_id ? ' AND station_id = ?' : ''}
  `).get(station_id ? [station_id] : []) as any;

  const chargingNow = db.prepare(`
    SELECT COUNT(*) as count
    FROM charging_orders
    WHERE charging_status = 'charging'
    ${station_id ? ' AND station_id = ?' : ''}
  `).get(station_id ? [station_id] : []) as any;

  const stations = db.prepare('SELECT COUNT(*) as count FROM stations').get() as { count: number };
  const chargers = db.prepare('SELECT COUNT(*) as count FROM chargers').get() as { count: number };
  const guns = db.prepare('SELECT COUNT(*) as count FROM guns').get() as { count: number };
  const onlineGuns = db.prepare("SELECT COUNT(*) as count FROM guns WHERE status IN ('idle', 'charging', 'reserved')").get() as { count: number };
  const faultGuns = db.prepare("SELECT COUNT(*) as count FROM guns WHERE status = 'fault'").get() as { count: number };
  const activeAlarms = db.prepare("SELECT COUNT(*) as count FROM alarms WHERE status = 'active'").get() as { count: number };
  const pendingWorkOrders = db.prepare("SELECT COUNT(*) as count FROM work_orders WHERE status IN ('pending', 'processing')").get() as { count: number };
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'owner'").get() as { count: number };

  const peakValley = db.prepare(`
    SELECT 
      SUM(peak_kwh) as peak_kwh,
      SUM(valley_kwh) as valley_kwh
    FROM charging_orders
    WHERE DATE(created_at) BETWEEN ? AND ?
    ${stationFilter}
  `).get(...params) as any;

  const utilization = db.prepare(`
    SELECT 
      station_id,
      AVG(utilization_rate) as avg_utilization
    FROM daily_stats
    WHERE stat_date BETWEEN ? AND ?
    ${stationFilter}
    GROUP BY station_id
  `).all(...params);

  const avgUtilization = utilization.length > 0 
    ? (utilization.reduce((sum, row: any) => sum + row.avg_utilization, 0) / utilization.length).toFixed(1)
    : '0';

  res.json({
    overview: {
      total_orders: totalOrders.total || 0,
      total_kwh: (totalOrders.total_kwh || 0).toFixed(2),
      total_revenue: (totalOrders.total_revenue || 0).toFixed(2),
      today_orders: todayOrders.count || 0,
      today_kwh: (todayOrders.kwh || 0).toFixed(2),
      today_revenue: (todayOrders.revenue || 0).toFixed(2),
      charging_now: chargingNow.count || 0,
      stations: stations.count,
      chargers: chargers.count,
      guns: guns.count,
      online_guns: onlineGuns.count,
      fault_guns: faultGuns.count,
      active_alarms: activeAlarms.count,
      pending_work_orders: pendingWorkOrders.count,
      total_users: totalUsers.count,
      peak_kwh: (peakValley.peak_kwh || 0).toFixed(2),
      valley_kwh: (peakValley.valley_kwh || 0).toFixed(2),
      avg_utilization: avgUtilization,
    },
  });
});

router.get('/revenue', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, period = 'day' } = req.query;
  
  let dateFormat = '%Y-%m-%d';
  let limitDays = 30;
  if (period === 'week') {
    dateFormat = '%Y-%W';
    limitDays = 12;
  } else if (period === 'month') {
    dateFormat = '%Y-%m';
    limitDays = 12;
  }

  let stationFilter = '';
  let params: any[] = [];
  if (station_id) {
    stationFilter = ' AND station_id = ?';
    params.push(station_id);
  }

  const revenueData = db.prepare(`
    SELECT 
      strftime('${dateFormat}', DATE(created_at)) as period,
      COUNT(*) as orders,
      SUM(total_kwh) as kwh,
      SUM(total_amount) as revenue,
      SUM(electricity_fee) as electricity_fee,
      SUM(service_fee) as service_fee,
      SUM(parking_fee) as parking_fee
    FROM charging_orders
    WHERE DATE(created_at) >= DATE('now', '-${limitDays * 2} days')
    ${stationFilter}
    GROUP BY period
    ORDER BY period DESC
    LIMIT ${limitDays}
  `).all(...params).reverse();

  res.json({ revenue_data: revenueData });
});

router.get('/utilization', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { station_id, days = 30 } = req.query;
  
  let stationFilter = '';
  let params: any[] = [parseInt(days as string)];
  if (station_id) {
    stationFilter = ' AND station_id = ?';
    params.push(station_id);
  }

  const data = db.prepare(`
    SELECT 
      stat_date,
      AVG(utilization_rate) as avg_utilization,
      SUM(total_orders) as total_orders,
      SUM(total_kwh) as total_kwh,
      SUM(total_revenue) as total_revenue,
      SUM(unique_users) as unique_users,
      SUM(repeat_users) as repeat_users,
      SUM(queue_loss_count) as queue_loss_count,
      SUM(queue_loss_amount) as queue_loss_amount
    FROM daily_stats
    WHERE stat_date >= DATE('now', '-? days')
    ${stationFilter}
    GROUP BY stat_date
    ORDER BY stat_date DESC
    LIMIT ?
  `).all(...params, parseInt(days as string)).reverse();

  res.json({ utilization_data: data });
});

router.get('/stations', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;
  
  const startDate = start_date ? dayjs(start_date as string).format('YYYY-MM-DD') : dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date ? dayjs(end_date as string).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  const stationStats = db.prepare(`
    SELECT 
      s.id,
      s.name,
      s.address,
      s.status,
      s.price_per_kwh,
      COUNT(DISTINCT o.id) as total_orders,
      COALESCE(SUM(o.total_kwh), 0) as total_kwh,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COALESCE(SUM(o.peak_kwh), 0) as peak_kwh,
      COALESCE(SUM(o.valley_kwh), 0) as valley_kwh,
      COUNT(DISTINCT o.user_id) as unique_users,
      (SELECT COUNT(*) FROM guns g WHERE g.station_id = s.id) as total_guns,
      (SELECT COUNT(*) FROM guns g WHERE g.station_id = s.id AND g.status = 'idle') as available_guns,
      (SELECT COUNT(*) FROM guns g WHERE g.station_id = s.id AND g.status = 'fault') as fault_guns,
      COALESCE(AVG(ds.utilization_rate), 0) as avg_utilization
    FROM stations s
    LEFT JOIN charging_orders o ON s.id = o.station_id AND DATE(o.created_at) BETWEEN ? AND ?
    LEFT JOIN daily_stats ds ON s.id = ds.station_id AND ds.stat_date BETWEEN ? AND ?
    GROUP BY s.id
    ORDER BY total_revenue DESC
  `).all(startDate, endDate, startDate, endDate);

  res.json({ station_stats: stationStats });
});

router.get('/users', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  
  const repeatRateData = db.prepare(`
    SELECT 
      stat_date,
      unique_users,
      repeat_users,
      CASE WHEN unique_users > 0 THEN ROUND(repeat_users * 100.0 / unique_users, 1) ELSE 0 END as repeat_rate
    FROM daily_stats
    WHERE stat_date >= DATE('now', '-? days')
    GROUP BY stat_date
    ORDER BY stat_date DESC
    LIMIT ?
  `).all(parseInt(days as string), parseInt(days as string)).reverse();

  const userRanking = db.prepare(`
    SELECT 
      u.id,
      u.phone,
      u.nickname,
      u.vehicle_info,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_kwh), 0) as total_kwh,
      COALESCE(SUM(o.total_amount), 0) as total_amount,
      MAX(o.created_at) as last_order_time
    FROM users u
    LEFT JOIN charging_orders o ON u.id = o.user_id
    WHERE u.role = 'owner'
    GROUP BY u.id
    ORDER BY total_amount DESC
    LIMIT 20
  `).all();

  res.json({
    repeat_rate_data: repeatRateData,
    user_ranking: userRanking,
  });
});

router.get('/queue-loss', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  
  const data = db.prepare(`
    SELECT 
      stat_date,
      queue_loss_count,
      queue_loss_amount
    FROM daily_stats
    WHERE stat_date >= DATE('now', '-? days')
    ORDER BY stat_date DESC
    LIMIT ?
  `).all(parseInt(days as string), parseInt(days as string)).reverse();

  const total = db.prepare(`
    SELECT 
      SUM(queue_loss_count) as total_count,
      SUM(queue_loss_amount) as total_amount
    FROM daily_stats
    WHERE stat_date >= DATE('now', '-? days')
  `).get(parseInt(days as string));

  res.json({
    queue_loss_data: data,
    total: total,
  });
});

router.post('/generate-daily-stats', authenticate, requireRole('admin'), (req: Request, res: Response) => {
  const { date } = req.body;
  const statDate = date || dayjs().format('YYYY-MM-DD');

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM daily_stats WHERE stat_date = ?').run(statDate);

    const stations = db.prepare('SELECT id FROM stations').all() as { id: number }[];

    stations.forEach(station => {
      const orders = db.prepare(`
        SELECT * FROM charging_orders 
        WHERE station_id = ? AND DATE(created_at) = ? AND charging_status = 'completed'
      `).all(station.id, statDate) as any[];

      const totalOrders = orders.length;
      const totalKwh = orders.reduce((sum, o) => sum + o.total_kwh, 0);
      const peakKwh = orders.reduce((sum, o) => sum + o.peak_kwh, 0);
      const valleyKwh = orders.reduce((sum, o) => sum + o.valley_kwh, 0);
      const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);
      
      const userIds = [...new Set(orders.map(o => o.user_id))];
      const uniqueUsers = userIds.length;
      
      const repeatUsers = orders.filter(o => {
        const prevOrder = db.prepare(`
          SELECT id FROM charging_orders 
          WHERE user_id = ? AND station_id = ? AND DATE(created_at) < ?
          LIMIT 1
        `).get(o.user_id, station.id, statDate);
        return !!prevOrder;
      }).length;

      const totalMinutes = orders.reduce((sum, o) => {
        if (o.start_time && o.end_time) {
          return sum + dayjs(o.end_time).diff(dayjs(o.start_time), 'minute');
        }
        return sum;
      }, 0);
      const avgDuration = totalOrders > 0 ? totalMinutes / totalOrders : 0;
      const utilizationRate = totalOrders > 0 ? Math.min(100, (totalMinutes / (8 * 24 * 60)) * 100) : 0;

      const queueLossCount = Math.floor(Math.random() * 5);
      const queueLossAmount = queueLossCount * 30;

      db.prepare(`
        INSERT INTO daily_stats (
          stat_date, station_id, total_orders, total_kwh, peak_kwh, valley_kwh,
          total_revenue, avg_charging_duration, utilization_rate,
          unique_users, repeat_users, queue_loss_count, queue_loss_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        statDate, station.id, totalOrders, totalKwh, peakKwh, valleyKwh,
        totalRevenue, avgDuration, utilizationRate,
        uniqueUsers, repeatUsers, queueLossCount, queueLossAmount
      );
    });
  });

  try {
    transaction();
    res.json({ message: `已生成 ${statDate} 的统计数据` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export/orders', authenticate, requireRole('operator', 'admin'), (req: Request, res: Response) => {
  const { start_date, end_date, station_id } = req.query;
  
  const startDate = start_date ? dayjs(start_date as string).format('YYYY-MM-DD') : dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date ? dayjs(end_date as string).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  let sql = `
    SELECT 
      o.order_no,
      o.created_at,
      s.name as station_name,
      g.gun_no,
      u.nickname as user_name,
      u.phone as user_phone,
      o.start_time,
      o.end_time,
      o.total_kwh,
      o.peak_kwh,
      o.valley_kwh,
      o.avg_power,
      o.total_amount,
      o.electricity_fee,
      o.service_fee,
      o.parking_fee,
      o.payment_status,
      o.charging_status,
      o.stop_reason
    FROM charging_orders o
    JOIN stations s ON o.station_id = s.id
    JOIN guns g ON o.gun_id = g.id
    JOIN users u ON o.user_id = u.id
    WHERE DATE(o.created_at) BETWEEN ? AND ?
  `;
  const params: any[] = [startDate, endDate];

  if (station_id) {
    sql += ' AND o.station_id = ?';
    params.push(station_id);
  }

  sql += ' ORDER BY o.id DESC';

  const orders = db.prepare(sql).all(...params);
  res.json({ orders, export_date: dayjs().format('YYYY-MM-DD HH:mm:ss') });
});

export default router;
