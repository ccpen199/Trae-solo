import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.get('/stats/overview', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const totalOrders = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM labor_orders) + 
      (SELECT COUNT(*) FROM delivery_orders) + 
      (SELECT COUNT(*) FROM moving_orders) as count
  `).get() as any;
  const totalRevenue = db.prepare(`
    SELECT 
      COALESCE((SELECT SUM(total_price) FROM labor_orders WHERE status = 'completed'), 0) + 
      COALESCE((SELECT SUM(final_price) FROM delivery_orders WHERE status = 'completed'), 0) + 
      COALESCE((SELECT SUM(total_price) FROM moving_orders WHERE status = 'completed'), 0) as total
  `).get() as any;
  const pendingDisputes = db.prepare("SELECT COUNT(*) as count FROM disputes WHERE status = 'pending'").get() as any;
  const pendingClaims = db.prepare("SELECT COUNT(*) as count FROM insurance_claims WHERE status = 'pending'").get() as any;

  const workers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'worker'").get() as any;
  const drivers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'driver'").get() as any;
  const employers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employer'").get() as any;

  const todayOrders = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM labor_orders WHERE DATE(created_at) = DATE('now')) + 
      (SELECT COUNT(*) FROM delivery_orders WHERE DATE(created_at) = DATE('now')) + 
      (SELECT COUNT(*) FROM moving_orders WHERE DATE(created_at) = DATE('now')) as count
  `).get() as any;

  res.json({
    total_users: totalUsers.count,
    total_orders: totalOrders.count,
    total_revenue: totalRevenue.total,
    pending_disputes: pendingDisputes.count,
    pending_claims: pendingClaims.count,
    workers: workers.count,
    drivers: drivers.count,
    employers: employers.count,
    today_orders: todayOrders.count,
  });
});

router.get('/capacity/heatmap', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { city, service_type } = req.query;

  const districts = [
    { name: '朝阳区', lat: 39.9219, lng: 116.4433, workers: 45, drivers: 32, load: 78 },
    { name: '海淀区', lat: 39.9599, lng: 116.2983, workers: 52, drivers: 28, load: 65 },
    { name: '东城区', lat: 39.9289, lng: 116.4167, workers: 30, drivers: 18, load: 85 },
    { name: '西城区', lat: 39.9128, lng: 116.3634, workers: 28, drivers: 22, load: 72 },
    { name: '丰台区', lat: 39.8571, lng: 116.2871, workers: 38, drivers: 45, load: 55 },
    { name: '石景山区', lat: 39.9056, lng: 116.2229, workers: 20, drivers: 15, load: 45 },
    { name: '通州区', lat: 39.9025, lng: 116.6572, workers: 25, drivers: 35, load: 60 },
    { name: '大兴区', lat: 39.7268, lng: 116.3381, workers: 22, drivers: 40, load: 50 },
    { name: '昌平区', lat: 40.2181, lng: 116.2377, workers: 18, drivers: 25, load: 40 },
    { name: '房山区', lat: 39.7358, lng: 116.1454, workers: 15, drivers: 20, load: 35 },
  ];

  res.json({
    city: city || '北京市',
    districts,
    service_type: service_type || 'all',
  });
});

router.get('/capacity/real-time', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();

  const activeWorkers = db.prepare(`
    SELECT COUNT(*) as count FROM users u
    WHERE u.role = 'worker' AND EXISTS (
      SELECT 1 FROM labor_orders lo WHERE lo.worker_id = u.id AND lo.status = 'in_progress'
    )
  `).get() as any;

  const activeDrivers = db.prepare(`
    SELECT COUNT(*) as count FROM users u
    WHERE u.role = 'driver' AND EXISTS (
      SELECT 1 FROM delivery_orders d WHERE d.driver_id = u.id AND d.status = 'in_progress'
      UNION
      SELECT 1 FROM moving_orders m WHERE m.driver_id = u.id AND m.status = 'in_progress'
    )
  `).get() as any;

  const pendingLaborOrders = db.prepare("SELECT COUNT(*) as count FROM labor_orders WHERE status = 'pending'").get() as any;
  const biddingDeliveryOrders = db.prepare("SELECT COUNT(*) as count FROM delivery_orders WHERE status = 'bidding'").get() as any;
  const pendingMovingOrders = db.prepare("SELECT COUNT(*) as count FROM moving_orders WHERE status = 'pending'").get() as any;

  res.json({
    active_workers: activeWorkers.count,
    active_drivers: activeDrivers.count,
    total_available_workers: 0,
    total_available_drivers: 0,
    pending_labor_orders: pendingLaborOrders.count,
    bidding_delivery_orders: biddingDeliveryOrders.count,
    pending_moving_orders: pendingMovingOrders.count,
    utilization_rate: {
      workers: 0,
      drivers: 0,
    },
  });
});

router.get('/price/trends', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { city = '北京市', service_type = 'labor', days = 30 } = req.query;

  const trends: any[] = [];
  const numDays = Number(days);

  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    let basePrice = 50;
    if (service_type === 'delivery') basePrice = 200;
    if (service_type === 'moving') basePrice = 500;
    
    const variation = (Math.random() - 0.5) * 0.2;
    const avgPrice = basePrice * (1 + variation);
    
    trends.push({
      date: dateStr,
      avg_price: Math.round(avgPrice * 100) / 100,
      volume: Math.floor(Math.random() * 50) + 10,
    });
  }

  const currentAvg = trends[trends.length - 1].avg_price;
  const previousAvg = trends[trends.length - 8]?.avg_price || currentAvg;
  const change = ((currentAvg - previousAvg) / previousAvg * 100).toFixed(2);

  res.json({
    city,
    service_type,
    trends,
    current_avg: currentAvg,
    weekly_change: Number(change),
    warning: Math.abs(Number(change)) > 10,
  });
});

router.get('/price/warnings', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const warnings = [
    {
      id: 'w1',
      type: 'price_surge',
      city: '北京市',
      service_type: 'labor',
      category: '水电工',
      message: '近7日水电工用工价格上涨15.3%，超出预警阈值',
      current_price: 78.5,
      baseline_price: 68.1,
      change_percent: 15.3,
      severity: 'warning',
      created_at: '2024-01-15 10:30:00',
    },
    {
      id: 'w2',
      type: 'price_drop',
      city: '北京市',
      service_type: 'delivery',
      category: '厢式货车',
      message: '近3日厢式货车运费下跌8.7%，建议关注运力过剩情况',
      current_price: 182,
      baseline_price: 199.3,
      change_percent: -8.7,
      severity: 'info',
      created_at: '2024-01-14 14:20:00',
    },
    {
      id: 'w3',
      type: 'capacity_shortage',
      city: '北京市',
      service_type: 'moving',
      category: '周末搬家',
      message: '下周末搬家预约量已达运力85%，可能出现运力紧张',
      current_utilization: 85,
      warning_threshold: 80,
      severity: 'warning',
      created_at: '2024-01-15 09:00:00',
    },
  ];

  res.json({
    warnings,
    total: warnings.length,
    unread: 2,
  });
});

router.get('/quality-rules', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const rules = db.prepare('SELECT * FROM quality_rules ORDER BY created_at DESC').all() as any[];
  
  res.json({ rules });
});

router.post('/quality-rules', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { name, rule_type, threshold, action, description, enabled } = req.body;

  if (!name || !rule_type) {
    return res.status(400).json({ error: '请填写规则名称和类型' });
  }

  const ruleId = uuidv4();
  db.prepare(`
    INSERT INTO quality_rules (id, name, rule_type, threshold, action, description, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ruleId, name, rule_type, threshold || 0, action || '', description || '', enabled ? 1 : 0);

  res.json({ success: true, rule_id: ruleId });
});

router.put('/quality-rules/:id', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { name, rule_type, threshold, action, description, enabled } = req.body;
  const existing = db.prepare('SELECT * FROM quality_rules WHERE id = ?').get(req.params.id) as any;

  if (!existing) {
    return res.status(404).json({ error: '规则不存在' });
  }

  const nextName = name ?? existing.name;
  const nextRuleType = rule_type ?? existing.rule_type;

  if (!nextName || !nextRuleType) {
    return res.status(400).json({ error: '请填写规则名称和类型' });
  }

  db.prepare(`
    UPDATE quality_rules 
    SET name = ?, rule_type = ?, threshold = ?, action = ?, description = ?, enabled = ?
    WHERE id = ?
  `).run(
    nextName,
    nextRuleType,
    threshold ?? existing.threshold ?? 0,
    action ?? existing.action ?? '',
    description ?? existing.description ?? '',
    enabled === undefined ? existing.enabled : (enabled ? 1 : 0),
    req.params.id
  );

  res.json({ success: true });
});

router.delete('/quality-rules/:id', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  db.prepare('DELETE FROM quality_rules WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.get('/orders/all', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = '';
  const params: any[] = [];

  if (status) {
    whereClause = 'WHERE status = ?';
    params.push(status);
  }

  const laborOrders = db.prepare(`
    SELECT id, title, 'labor' as type, employer_id, worker_id, status, total_price, city, created_at
    FROM labor_orders
    ${whereClause}
  `).all(...params) as any[];

  const deliveryOrders = db.prepare(`
    SELECT id, title, 'delivery' as type, employer_id, driver_id, status, final_price as total_price, 
           pickup_address as city, created_at
    FROM delivery_orders
    ${whereClause}
  `).all(...params) as any[];

  const movingOrders = db.prepare(`
    SELECT id, title, 'moving' as type, employer_id, driver_id, status, total_price, from_address as city, created_at
    FROM moving_orders
    ${whereClause}
  `).all(...params) as any[];

  let allOrders = [...laborOrders, ...deliveryOrders, ...movingOrders];
  
  if (type) {
    allOrders = allOrders.filter(o => o.type === type);
  }

  allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = allOrders.length;
  const paginatedOrders = allOrders.slice(offset, offset + Number(limit));

  res.json({ orders: paginatedOrders, total });
});

router.get('/users/list', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { role, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }

  const users = db.prepare(`
    SELECT id, username, real_name, phone, role, credit_score, balance, city, created_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM users
    ${whereClause}
  `).get(...params) as any;

  res.json({ users, total: total.count });
});

export default router;
