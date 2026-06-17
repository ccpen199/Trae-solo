import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'employer') {
    return res.status(403).json({ error: '只有雇主可以发布搬家需求' });
  }

  const {
    title, description, from_address, from_floor, from_elevator,
    to_address, to_floor, to_elevator, distance, vehicle_type,
    package_list, service_packages, base_price, package_price, floor_price, total_price, move_date
  } = req.body;

  if (!from_address || !to_address) {
    return res.status(400).json({ error: '请填写起始地和目的地' });
  }

  const db = getDB();
  const orderId = uuidv4();

  let calculatedTotal = base_price || 0;
  if (package_price) calculatedTotal += package_price;
  if (floor_price) calculatedTotal += floor_price;

  db.prepare(`
    INSERT INTO moving_orders (
      id, employer_id, title, description, from_address, from_floor, from_elevator,
      to_address, to_floor, to_elevator, distance, vehicle_type,
      package_list, service_packages, base_price, package_price, floor_price, total_price, move_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId, req.user!.id, title || '搬家服务', description || '',
    from_address, from_floor || 1, from_elevator ? 1 : 0,
    to_address, to_floor || 1, to_elevator ? 1 : 0,
    distance || 0, vehicle_type || '厢式货车',
    JSON.stringify(package_list || []), JSON.stringify(service_packages || []),
    base_price || 0, package_price || 0, floor_price || 0,
    total_price || calculatedTotal, move_date || null
  );

  createNotification(db, req.user!.id, 'moving_created', '搬家需求已发布', `您的搬家需求已成功发布`, orderId);

  res.json({ success: true, order_id: orderId, total_price: total_price || calculatedTotal });
});

router.get('/', (req: Request, res: Response) => {
  const db = getDB();
  const { status, keyword, page = 1, limit = 20, employer_id, vehicle_type } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND mo.status = ?';
    params.push(status);
  }
  if (vehicle_type) {
    whereClause += ' AND mo.vehicle_type = ?';
    params.push(vehicle_type);
  }
  if (keyword) {
    whereClause += ` AND (
      mo.title LIKE '%' || ? || '%' OR
      mo.description LIKE '%' || ? || '%' OR
      mo.from_address LIKE '%' || ? || '%' OR
      mo.to_address LIKE '%' || ? || '%'
    )`;
    params.push(keyword, keyword, keyword, keyword);
  }
  if (employer_id) {
    whereClause += ' AND mo.employer_id = ?';
    params.push(employer_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  const orders = db.prepare(`
    SELECT mo.*, 
           ue.username as employer_name, ue.real_name as employer_real_name, ue.avatar as employer_avatar, ue.phone as employer_phone,
           ud.username as driver_name, ud.real_name as driver_real_name, ud.avatar as driver_avatar, ud.phone as driver_phone,
           dp.vehicle_type as driver_vehicle_type, dp.plate_number, dp.rating as driver_rating, dp.completed_orders as driver_completed_orders
    FROM moving_orders mo
    LEFT JOIN users ue ON mo.employer_id = ue.id
    LEFT JOIN users ud ON mo.driver_id = ud.id
    LEFT JOIN driver_profiles dp ON mo.driver_id = dp.user_id
    ${whereClause}
    ORDER BY mo.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM moving_orders mo
    ${whereClause}
  `).get(...params) as any;

  const result = orders.map(o => ({
    ...o,
    package_list: JSON.parse(o.package_list || '[]'),
    service_packages: JSON.parse(o.service_packages || '[]'),
    worker_ids: o.worker_ids ? JSON.parse(o.worker_ids) : [],
    package_type: JSON.parse(o.service_packages || '[]').map((p: any) => p.name).join('+') || '标准服务',
  }));

  res.json({ orders: result, total: total.count });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const order = db.prepare(`
    SELECT mo.*, 
           ue.username as employer_name, ue.real_name as employer_real_name, ue.avatar as employer_avatar, ue.phone as employer_phone,
           ud.username as driver_name, ud.real_name as driver_real_name, ud.avatar as driver_avatar, ud.phone as driver_phone,
           dp.vehicle_type, dp.vehicle_brand, dp.plate_number, dp.rating
    FROM moving_orders mo
    LEFT JOIN users ue ON mo.employer_id = ue.id
    LEFT JOIN users ud ON mo.driver_id = ud.id
    LEFT JOIN driver_profiles dp ON mo.driver_id = dp.user_id
    WHERE mo.id = ?
  `).get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  order.package_list = JSON.parse(order.package_list || '[]');
  order.service_packages = JSON.parse(order.service_packages || '[]');
  order.worker_ids = order.worker_ids ? JSON.parse(order.worker_ids) : [];
  order.package_type = order.service_packages.map((p: any) => p.name).join('+') || '标准服务';

  if (order.worker_ids && order.worker_ids.length > 0) {
    const placeholders = order.worker_ids.map(() => '?').join(',');
    const workers = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.avatar, u.phone,
             wp.skills, wp.rating
      FROM users u
      LEFT JOIN worker_profiles wp ON u.id = wp.user_id
      WHERE u.id IN (${placeholders})
    `).all(...order.worker_ids) as any[];
    order.workers = workers.map(w => ({
      ...w,
      skills: JSON.parse(w.skills || '[]'),
    }));
  }
  order.confirmation = db.prepare('SELECT * FROM order_confirmations WHERE order_id = ? AND order_type = ?').get(req.params.id, 'moving') || null;
  order.gps_tracks = db.prepare('SELECT * FROM gps_tracks WHERE order_id = ? AND order_type = ? ORDER BY timestamp DESC LIMIT 10').all(req.params.id, 'moving');
  order.disputes = db.prepare('SELECT * FROM disputes WHERE order_id = ? AND order_type = ? ORDER BY created_at DESC').all(req.params.id, 'moving');
  order.insurance_claims = db.prepare('SELECT * FROM insurance_claims WHERE order_id = ? AND order_type = ? ORDER BY created_at DESC').all(req.params.id, 'moving');

  res.json(order);
});

router.post('/:id/assign', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'employer' && req.user!.role !== 'admin') {
    return res.status(403).json({ error: '权限不足' });
  }

  const db = getDB();
  const order = db.prepare('SELECT * FROM moving_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单状态不支持派单' });
  }

  const { driver_id, worker_ids } = req.body;

  if (!driver_id && (!worker_ids || worker_ids.length === 0)) {
    return res.status(400).json({ error: '请至少指派司机或工人' });
  }

  db.prepare(`
    UPDATE moving_orders 
    SET driver_id = ?, worker_ids = ?, status = 'accepted', updated_at = datetime('now')
    WHERE id = ?
  `).run(driver_id || null, JSON.stringify(worker_ids || []), req.params.id);

  if (driver_id) {
    createNotification(db, driver_id, 'moving_assigned', '搬家订单指派', `您被指派了新的搬家订单`, req.params.id);
  }

  res.json({ success: true, message: '派单成功' });
});

router.post('/:id/start', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM moving_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'accepted') {
    return res.status(400).json({ error: '订单状态不支持开始服务' });
  }

  db.prepare(`
    UPDATE moving_orders SET status = 'in_progress', updated_at = datetime('now')
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: '搬家服务已开始' });
});

router.post('/:id/complete', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM moving_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'in_progress') {
    return res.status(400).json({ error: '订单状态不支持确认完工' });
  }

  const { completion_photos, notes, damaged_items } = req.body;

  let confirmation = db.prepare('SELECT * FROM order_confirmations WHERE order_id = ? AND order_type = ?').get(req.params.id, 'moving') as any;

  if (!confirmation) {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, completion_photos, notes)
      VALUES (?, ?, 'moving', ?, ?)
    `).run(confId, req.params.id, JSON.stringify(completion_photos || []), notes || '');
  }

  if (req.user!.role === 'employer') {
    if (order.employer_id !== req.user!.id) {
      return res.status(403).json({ error: '只有雇主可以确认完工' });
    }
    db.prepare(`
      UPDATE order_confirmations SET employer_confirmed = 1
      WHERE order_id = ? AND order_type = 'moving'
    `).run(req.params.id);
  } else if (req.user!.role === 'driver') {
    if (order.driver_id !== req.user!.id) {
      return res.status(403).json({ error: '只有指派司机可以确认完工' });
    }
    db.prepare(`
      UPDATE order_confirmations SET driver_confirmed = 1
      WHERE order_id = ? AND order_type = 'moving'
    `).run(req.params.id);
  } else if (req.user!.role === 'worker') {
    db.prepare(`
      UPDATE order_confirmations SET worker_confirmed = 1
      WHERE order_id = ? AND order_type = 'moving'
    `).run(req.params.id);
  }

  confirmation = db.prepare('SELECT * FROM order_confirmations WHERE order_id = ? AND order_type = ?').get(req.params.id, 'moving') as any;

  if (confirmation.employer_confirmed && (confirmation.driver_confirmed || confirmation.worker_confirmed)) {
    db.prepare(`
      UPDATE moving_orders SET status = 'completed', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    if (damaged_items && damaged_items.length > 0) {
      checkQualityRules(db, order.id, 'moving', damaged_items);
    }
  }

  res.json({ success: true, message: '确认已提交', confirmation });
});

function checkQualityRules(db: any, orderId: string, orderType: string, damagedItems: any[]) {
  const rules = db.prepare("SELECT * FROM quality_rules WHERE rule_type = 'damage_rate' AND enabled = 1").all() as any[];
  
  for (const rule of rules) {
    if (damagedItems.length > 0 && rule.action === 'auto_compensation') {
      const claimId = uuidv4();
      db.prepare(`
        INSERT INTO insurance_claims (id, order_id, order_type, claimant_id, claim_amount, claim_reason, description, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        claimId, orderId, orderType, 
        (db.prepare('SELECT employer_id as id FROM moving_orders WHERE id = ?').get(orderId) as any).id,
        500, '搬运破损', `搬运过程中出现${damagedItems.length}件物品破损，触发自动赔付规则`,
        'auto_triggered'
      );
    }
  }
}

function createNotification(db: any, userId: string, type: string, title: string, content: string, relatedId: string) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, type, title, content, relatedId);
}

router.get('/service-packages/list', (req: Request, res: Response) => {
  const packages = [
    { id: 'basic', name: '基础搬家', description: '含司机1名，不包含搬运', base_price: 200, includes: ['运输', '司机'] },
    { id: 'standard', name: '标准搬家', description: '含司机1名 + 搬运工2名', base_price: 500, includes: ['运输', '司机', '2名搬运工', '基础打包'] },
    { id: 'premium', name: '豪华搬家', description: '含司机1名 + 搬运工4名 + 专业打包', base_price: 1000, includes: ['运输', '司机', '4名搬运工', '专业打包', '家具拆装', '清洁服务'] },
    { id: 'piano', name: '钢琴搬运', description: '专业钢琴搬运服务', base_price: 800, includes: ['专业搬运设备', '4名搬运工', '保险'] },
    { id: 'safe', name: '保险柜搬运', description: '重型保险柜搬运', base_price: 600, includes: ['专业设备', '2名搬运工', '保险'] },
  ];

  res.json({ packages });
});

export default router;
