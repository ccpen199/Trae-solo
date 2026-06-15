import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'employer') {
    return res.status(403).json({ error: '只有雇主可以发布用工需求' });
  }

  const {
    title, description, category, skills_required, pricing_type,
    price_per_hour, task_price, estimated_hours, city, address,
    latitude, longitude, start_time, worker_count, split_enabled
  } = req.body;

  if (!title || !pricing_type || !city || !address) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  const db = getDB();
  const orderId = uuidv4();

  let totalPrice = 0;
  if (pricing_type === 'hourly' && price_per_hour && estimated_hours) {
    totalPrice = price_per_hour * estimated_hours * (worker_count || 1);
  } else if (pricing_type === 'task' && task_price) {
    totalPrice = task_price;
  }

  db.prepare(`
    INSERT INTO labor_orders (
      id, employer_id, title, description, category, skills_required,
      pricing_type, price_per_hour, task_price, estimated_hours, total_price,
      city, address, latitude, longitude, start_time, worker_count, split_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId, req.user!.id, title, description || '', category || '',
    JSON.stringify(skills_required || []),
    pricing_type, price_per_hour || 0, task_price || 0, estimated_hours || 0, totalPrice,
    city, address, latitude || null, longitude || null, start_time || null,
    worker_count || 1, split_enabled ? 1 : 0
  );

  createNotification(db, req.user!.id, 'order_created', '用工需求已发布', `您发布的"${title}"用工需求已成功`, orderId);

  res.json({ success: true, order_id: orderId, total_price: totalPrice });
});

router.get('/', (req: Request, res: Response) => {
  const db = getDB();
  const { city, category, status, page = 1, limit = 20, employer_id, worker_id } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (city) {
    whereClause += ' AND lo.city LIKE ?';
    params.push(`%${city}%`);
  }
  if (category) {
    whereClause += ' AND lo.category = ?';
    params.push(category);
  }
  if (status) {
    whereClause += ' AND lo.status = ?';
    params.push(status);
  }
  if (employer_id) {
    whereClause += ' AND lo.employer_id = ?';
    params.push(employer_id);
  }
  if (worker_id) {
    whereClause += ' AND lo.worker_id = ?';
    params.push(worker_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  const orders = db.prepare(`
    SELECT lo.*, 
           ue.username as employer_name, ue.real_name as employer_real_name, ue.avatar as employer_avatar, ue.phone as employer_phone,
           uw.username as worker_name, uw.real_name as worker_real_name, uw.avatar as worker_avatar, uw.phone as worker_phone
    FROM labor_orders lo
    LEFT JOIN users ue ON lo.employer_id = ue.id
    LEFT JOIN users uw ON lo.worker_id = uw.id
    ${whereClause}
    ORDER BY lo.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM labor_orders lo
    ${whereClause}
  `).get(...params) as any;

  const result = orders.map(o => ({
    ...o,
    skills_required: JSON.parse(o.skills_required || '[]'),
  }));

  res.json({ orders: result, total: total.count });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const order = db.prepare(`
    SELECT lo.*, 
           ue.username as employer_name, ue.real_name as employer_real_name, ue.avatar as employer_avatar, ue.phone as employer_phone,
           uw.username as worker_name, uw.real_name as worker_real_name, uw.avatar as worker_avatar, uw.phone as worker_phone
    FROM labor_orders lo
    LEFT JOIN users ue ON lo.employer_id = ue.id
    LEFT JOIN users uw ON lo.worker_id = uw.id
    WHERE lo.id = ?
  `).get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  order.skills_required = JSON.parse(order.skills_required || '[]');

  const subOrders = db.prepare(`
    SELECT lo.*, uw.username as worker_name, uw.real_name as worker_real_name
    FROM labor_orders lo
    LEFT JOIN users uw ON lo.worker_id = uw.id
    WHERE lo.parent_order_id = ?
  `).all(req.params.id) as any[];

  if (subOrders.length > 0) {
    order.sub_orders = subOrders.map(s => ({
      ...s,
      skills_required: JSON.parse(s.skills_required || '[]'),
    }));
  }

  res.json(order);
});

router.post('/:id/take-order', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'worker') {
    return res.status(403).json({ error: '只有工人可以接单' });
  }

  const db = getDB();
  const order = db.prepare('SELECT * FROM labor_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单状态不支持接单' });
  }

  if (order.split_enabled && order.worker_count > 1) {
    return res.status(400).json({ error: '拆单订单请使用子订单接单接口' });
  }

  db.prepare(`
    UPDATE labor_orders SET worker_id = ?, status = 'accepted', updated_at = datetime('now')
    WHERE id = ? AND status = 'pending'
  `).run(req.user!.id, req.params.id);

  createNotification(db, order.employer_id, 'order_accepted', '用工订单已被接单', `您的用工订单已被工人接单`, req.params.id);
  createNotification(db, req.user!.id, 'order_taken', '接单成功', `您已成功接用工订单`, req.params.id);

  res.json({ success: true, message: '接单成功' });
});

router.post('/:id/split', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'employer') {
    return res.status(403).json({ error: '只有雇主可以拆单' });
  }

  const db = getDB();
  const order = db.prepare('SELECT * FROM labor_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.employer_id !== req.user!.id) {
    return res.status(403).json({ error: '只能操作自己的订单' });
  }

  if (!order.split_enabled) {
    return res.status(400).json({ error: '该订单不支持拆单' });
  }

  const { sub_orders } = req.body;
  if (!sub_orders || !Array.isArray(sub_orders)) {
    return res.status(400).json({ error: '子订单数据无效' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO labor_orders (
      id, employer_id, title, description, category, skills_required,
      pricing_type, price_per_hour, task_price, estimated_hours, total_price,
      city, address, latitude, longitude, start_time, worker_count, parent_order_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const subOrderIds: string[] = [];

  const transaction = db.transaction(() => {
    for (const sub of sub_orders) {
      const subId = uuidv4();
      let totalPrice = 0;
      if (order.pricing_type === 'hourly' && sub.price_per_hour && sub.estimated_hours) {
        totalPrice = sub.price_per_hour * sub.estimated_hours;
      } else if (order.pricing_type === 'task' && sub.task_price) {
        totalPrice = sub.task_price;
      }

      insertStmt.run(
        subId, req.user!.id, sub.title || order.title, sub.description || order.description,
        order.category, JSON.stringify(sub.skills_required || []),
        order.pricing_type, sub.price_per_hour || order.price_per_hour,
        sub.task_price || order.task_price, sub.estimated_hours || order.estimated_hours,
        totalPrice, order.city, order.address, order.latitude, order.longitude,
        sub.start_time || order.start_time, 1, req.params.id
      );
      subOrderIds.push(subId);
    }

    db.prepare(`
      UPDATE labor_orders SET status = 'split', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);
  });

  transaction();

  res.json({ success: true, sub_order_ids: subOrderIds });
});

router.post('/:id/start', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM labor_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'accepted') {
    return res.status(400).json({ error: '订单状态不支持开始服务' });
  }

  if (req.user!.role === 'worker' && order.worker_id !== req.user!.id) {
    return res.status(403).json({ error: '只有接单工人可以开始服务' });
  }
  if (req.user!.role === 'employer' && order.employer_id !== req.user!.id) {
    return res.status(403).json({ error: '只能操作自己的订单' });
  }

  db.prepare(`
    UPDATE labor_orders SET status = 'in_progress', start_time = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: '服务已开始' });
});

router.post('/:id/complete', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM labor_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'in_progress') {
    return res.status(400).json({ error: '订单状态不支持完工' });
  }

  const { completion_photos, notes } = req.body;

  let confirmation = db.prepare('SELECT * FROM order_confirmations WHERE order_id = ? AND order_type = ?').get(req.params.id, 'labor') as any;

  if (!confirmation) {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, completion_photos, notes)
      VALUES (?, ?, 'labor', ?, ?)
    `).run(confId, req.params.id, JSON.stringify(completion_photos || []), notes || '');
    confirmation = db.prepare('SELECT * FROM order_confirmations WHERE id = ?').get(confId) as any;
  }

  if (req.user!.role === 'worker') {
    if (order.worker_id !== req.user!.id) {
      return res.status(403).json({ error: '只有接单工人可以确认完工' });
    }
    db.prepare(`
      UPDATE order_confirmations SET worker_confirmed = 1
      WHERE order_id = ? AND order_type = 'labor'
    `).run(req.params.id);
  } else if (req.user!.role === 'employer') {
    if (order.employer_id !== req.user!.id) {
      return res.status(403).json({ error: '只有雇主可以确认完工' });
    }
    db.prepare(`
      UPDATE order_confirmations SET employer_confirmed = 1
      WHERE order_id = ? AND order_type = 'labor'
    `).run(req.params.id);
  }

  confirmation = db.prepare('SELECT * FROM order_confirmations WHERE order_id = ? AND order_type = ?').get(req.params.id, 'labor') as any;

  if (confirmation.employer_confirmed && confirmation.worker_confirmed) {
    db.prepare(`
      UPDATE labor_orders SET status = 'completed', end_time = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    if (order.worker_id) {
      db.prepare(`
        UPDATE worker_profiles 
        SET completed_orders = completed_orders + 1
        WHERE user_id = ?
      `).run(order.worker_id);
    }
  }

  res.json({ success: true, message: '确认已提交', confirmation });
});

function createNotification(db: any, userId: string, type: string, title: string, content: string, relatedId: string) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, type, title, content, relatedId);
}

export default router;
