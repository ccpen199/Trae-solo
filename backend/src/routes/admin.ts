import { Router, Response } from 'express';
import db from '../models/database';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  try {
    const stats: any = {};

    stats.totalWorkers = (db.prepare("SELECT COUNT(*) as count FROM workers WHERE status = 'active'").get() as any).count;
    stats.totalEmployers = (db.prepare('SELECT COUNT(*) as count FROM employers').get() as any).count;
    stats.totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
    stats.completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as any).count;
    stats.pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").get() as any).count;
    stats.disputedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'disputed'").get() as any).count;
    stats.totalRevenue = (db.prepare("SELECT COALESCE(SUM(actual_amount), 0) as total FROM orders WHERE status = 'completed'").get() as any).total;
    stats.avgRating = (db.prepare('SELECT COALESCE(AVG(rating), 0) as avg FROM workers').get() as any).avg;

    const orderTrend = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN actual_amount ELSE 0 END), 0) as revenue
      FROM orders
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    const roleDistribution = db.prepare(`
      SELECT role, COUNT(*) as count FROM workers GROUP BY role
    `).all();

    const cityDistribution = db.prepare(`
      SELECT service_cities, COUNT(*) as count FROM workers
      WHERE service_cities IS NOT NULL AND service_cities != ''
      GROUP BY service_cities ORDER BY count DESC LIMIT 10
    `).all();

    const pendingReviews = (db.prepare("SELECT COUNT(*) as count FROM workers WHERE status = 'pending_review'").get() as any).count;
    const pendingDisputes = (db.prepare("SELECT COUNT(*) as count FROM dispute_tickets WHERE status IN ('pending', 'processing')").get() as any).count;
    const pendingSalaries = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM salary_records WHERE status = 'pending'").get() as any).total;

    res.json({
      stats,
      orderTrend,
      roleDistribution,
      cityDistribution,
      alerts: {
        pendingReviews,
        pendingDisputes,
        pendingSalaries,
      },
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: '数据加载失败', message: error.message });
  }
});

router.get('/service-grids', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { city } = req.query;

  let where = [];
  let params: any[] = [];

  if (city) {
    where.push('city = ?');
    params.push(city);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const list = db.prepare(`
    SELECT sg.*,
      (SELECT COUNT(*) FROM workers w WHERE w.service_cities LIKE '%' || sg.city || '%') as actual_workers,
      (SELECT COUNT(*) FROM orders o WHERE o.city = sg.city AND o.district = sg.district) as grid_orders
    FROM service_grids sg
    ${whereSql}
    ORDER BY sg.city, sg.district
  `).all(...params);

  res.json({ list });
});

router.post('/service-grids', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { city, district, worker_capacity, order_demand, min_rating, max_orders_per_day } = req.body;

  if (!city || !district) {
    return res.status(400).json({ error: '城市和区域不能为空' });
  }

  const existing = db.prepare('SELECT id FROM service_grids WHERE city = ? AND district = ?').get(city, district);
  if (existing) {
    return res.status(400).json({ error: '该网格已存在' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO service_grids (id, city, district, worker_capacity, current_workers, order_demand, min_rating, max_orders_per_day)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `).run(id, city, district, worker_capacity || 0, order_demand || 0, min_rating || 0, max_orders_per_day || 5);

  res.json({ success: true, id, message: '创建成功' });
});

router.put('/service-grids/:id', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { worker_capacity, order_demand, min_rating, max_orders_per_day } = req.body;

  db.prepare(`
    UPDATE service_grids SET
      worker_capacity = COALESCE(?, worker_capacity),
      order_demand = COALESCE(?, order_demand),
      min_rating = COALESCE(?, min_rating),
      max_orders_per_day = COALESCE(?, max_orders_per_day),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(worker_capacity, order_demand, min_rating, max_orders_per_day, req.params.id);

  res.json({ success: true, message: '更新成功' });
});

router.get('/conversion-funnel', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { start_date, end_date, city, worker_role } = req.query;

  let where = [];
  let params: any[] = [];

  if (start_date) {
    where.push('date >= ?');
    params.push(start_date);
  }
  if (end_date) {
    where.push('date <= ?');
    params.push(end_date);
  }
  if (city) {
    where.push('city = ?');
    params.push(city);
  }
  if (worker_role) {
    where.push('worker_role = ?');
    params.push(worker_role);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const aggregated = db.prepare(`
    SELECT
      COALESCE(SUM(registered_workers), 0) as registered_workers,
      COALESCE(SUM(certified_workers), 0) as certified_workers,
      COALESCE(SUM(online_workers), 0) as online_workers,
      COALESCE(SUM(order_received), 0) as order_received,
      COALESCE(SUM(order_accepted), 0) as order_accepted,
      COALESCE(SUM(order_completed), 0) as order_completed
    FROM conversion_funnels
    ${whereSql}
  `).get(...params);

  const dailyData = db.prepare(`
    SELECT date, city, worker_role,
      registered_workers, certified_workers, online_workers,
      order_received, order_accepted, order_completed
    FROM conversion_funnels
    ${whereSql}
    ORDER BY date DESC
    LIMIT 30
  `).all(...params);

  const calcRate = (a: number, b: number) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0.0');

  const agg: any = aggregated;
  const funnel = [
    { name: '注册阿姨数', value: agg.registered_workers, rate: '100.0' },
    { name: '持证阿姨数', value: agg.certified_workers, rate: calcRate(agg.certified_workers, agg.registered_workers) },
    { name: '在线接单数', value: agg.online_workers, rate: calcRate(agg.online_workers, agg.certified_workers) },
    { name: '接到订单数', value: agg.order_received, rate: calcRate(agg.order_received, agg.online_workers) },
    { name: '确认接单', value: agg.order_accepted, rate: calcRate(agg.order_accepted, agg.order_received) },
    { name: '完成订单', value: agg.order_completed, rate: calcRate(agg.order_completed, agg.order_accepted) },
  ];

  res.json({ funnel, dailyData, raw: aggregated });
});

router.post('/generate-funnel-data', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const roles = ['nanny', 'cleaner', 'maternity'];
  const cities = ['上海市', '北京市', '广州市', '深圳市'];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO conversion_funnels
    (id, date, city, worker_role, registered_workers, certified_workers, online_workers, order_received, order_accepted, order_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    cities.forEach(city => {
      roles.forEach(role => {
        const id = `${today}-${city}-${role}`;
        const registered = Math.floor(Math.random() * 100) + 50;
        const certified = Math.floor(registered * (0.6 + Math.random() * 0.3));
        const online = Math.floor(certified * (0.5 + Math.random() * 0.3));
        const orderReceived = Math.floor(online * (0.8 + Math.random() * 0.2));
        const orderAccepted = Math.floor(orderReceived * (0.7 + Math.random() * 0.2));
        const orderCompleted = Math.floor(orderAccepted * (0.85 + Math.random() * 0.15));

        stmt.run(id, today, city, role, registered, certified, online, orderReceived, orderAccepted, orderCompleted);
      });
    });
  });

  try {
    tx();
    res.json({ success: true, message: '漏斗数据已生成' });
  } catch (error) {
    res.status(500).json({ error: '生成失败' });
  }
});

router.get('/workers/approval-list', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const list = db.prepare(`
    SELECT w.*, u.username, u.phone
    FROM workers w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE w.status = 'pending_review'
    ORDER BY w.created_at DESC
  `).all();

  res.json({ list });
});

router.post('/workers/:id/approve', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  db.prepare("UPDATE workers SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'pending_review'")
    .run(req.params.id);

  res.json({ success: true, message: '审核通过' });
});

router.post('/workers/:id/reject', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { reason } = req.body;
  db.prepare("UPDATE workers SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.params.id);

  res.json({ success: true, message: '已驳回' });
});

router.get('/reports/worker-performance', authMiddleware(['admin']), (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 20, city } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = [];
  let params: any[] = [];

  if (city) {
    where.push('w.service_cities LIKE ?');
    params.push(`%${city}%`);
  }

  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM workers w ${whereSql}`).get(...params) as any;

  const list = db.prepare(`
    SELECT
      w.id, w.name, w.role, w.phone, w.rating, w.review_count, w.order_count,
      w.experience_years, w.status,
      (SELECT COUNT(*) FROM orders o WHERE o.worker_id = w.id AND o.status = 'completed') as completed_orders,
      (SELECT COALESCE(SUM(o.actual_amount), 0) FROM orders o WHERE o.worker_id = w.id AND o.status = 'completed') as total_earnings,
      (SELECT COUNT(*) FROM reviews r WHERE r.worker_id = w.id AND r.rating >= 4) as good_reviews
    FROM workers w
    ${whereSql}
    ORDER BY w.order_count DESC, w.rating DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({
    list,
    total: total.count,
    page: Number(page),
    pageSize: Number(pageSize),
  });
});

export default router;
