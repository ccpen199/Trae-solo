import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'employer') {
    return res.status(403).json({ error: '只有雇主可以发布找车需求' });
  }

  const {
    title, description, vehicle_type_required, weight, volume, goods_type,
    pickup_address, pickup_latitude, pickup_longitude,
    delivery_address, delivery_latitude, delivery_longitude,
    distance, base_price, bid_start_price, pickup_time
  } = req.body;

  if (!title || !pickup_address || !delivery_address) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  const db = getDB();
  const orderId = uuidv4();
  const waybillNo = 'WL' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000);

  db.prepare(`
    INSERT INTO delivery_orders (
      id, employer_id, title, description, vehicle_type_required, weight, volume, goods_type,
      pickup_address, pickup_latitude, pickup_longitude,
      delivery_address, delivery_latitude, delivery_longitude,
      distance, base_price, bid_start_price, final_price, pickup_time, waybill_no
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId, req.user!.id, title, description || '', vehicle_type_required || '厢式货车',
    weight || 0, volume || 0, goods_type || '',
    pickup_address, pickup_latitude || null, pickup_longitude || null,
    delivery_address, delivery_latitude || null, delivery_longitude || null,
    distance || 0, base_price || 0, bid_start_price || 0, bid_start_price || 0,
    pickup_time || null, waybillNo
  );

  createNotification(db, req.user!.id, 'delivery_created', '找车需求已发布', `您发布的"${title}"找车需求已成功`, orderId);

  res.json({ success: true, order_id: orderId, waybill_no: waybillNo });
});

router.get('/', (req: Request, res: Response) => {
  const db = getDB();
  const { vehicle_type, status, page = 1, limit = 20, employer_id, driver_id } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (vehicle_type) {
    whereClause += ' AND do.vehicle_type_required = ?';
    params.push(vehicle_type);
  }
  if (status) {
    whereClause += ' AND do.status = ?';
    params.push(status);
  }
  if (employer_id) {
    whereClause += ' AND do.employer_id = ?';
    params.push(employer_id);
  }
  if (driver_id) {
    whereClause += ' AND do.driver_id = ?';
    params.push(driver_id);
  }

  const offset = (Number(page) - 1) * Number(limit);
  
  const orders = db.prepare(`
    SELECT do.*, 
           ue.username as employer_name, ue.real_name as employer_real_name, ue.avatar as employer_avatar, ue.phone as employer_phone,
           ud.username as driver_name, ud.real_name as driver_real_name, ud.avatar as driver_avatar, ud.phone as driver_phone,
           dp.vehicle_type, dp.plate_number
    FROM delivery_orders do
    LEFT JOIN users ue ON do.employer_id = ue.id
    LEFT JOIN users ud ON do.driver_id = ud.id
    LEFT JOIN driver_profiles dp ON do.driver_id = dp.user_id
    ${whereClause}
    ORDER BY do.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM delivery_orders do
    ${whereClause}
  `).get(...params) as any;

  res.json({ orders, total: total.count });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const order = db.prepare(`
    SELECT do.*, 
           ue.username as employer_name, ue.real_name as employer_real_name, ue.avatar as employer_avatar, ue.phone as employer_phone,
           ud.username as driver_name, ud.real_name as driver_real_name, ud.avatar as driver_avatar, ud.phone as driver_phone,
           dp.vehicle_type, dp.vehicle_brand, dp.plate_number, dp.load_capacity, dp.rating
    FROM delivery_orders do
    LEFT JOIN users ue ON do.employer_id = ue.id
    LEFT JOIN users ud ON do.driver_id = ud.id
    LEFT JOIN driver_profiles dp ON do.driver_id = dp.user_id
    WHERE do.id = ?
  `).get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const bids = db.prepare(`
    SELECT db.*, u.username as driver_name, u.avatar as driver_avatar, u.credit_score,
           dp.vehicle_type, dp.plate_number, dp.rating, dp.completed_orders
    FROM delivery_bids db
    LEFT JOIN users u ON db.driver_id = u.id
    LEFT JOIN driver_profiles dp ON db.driver_id = dp.user_id
    WHERE db.order_id = ?
    ORDER BY db.bid_price ASC, db.created_at ASC
  `).all(req.params.id) as any[];

  order.bids = bids;

  res.json(order);
});

router.post('/:id/bid', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'driver') {
    return res.status(403).json({ error: '只有司机可以竞价' });
  }

  const db = getDB();
  const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'bidding') {
    return res.status(400).json({ error: '订单不在竞价阶段' });
  }

  const { bid_price, message } = req.body;

  if (!bid_price || bid_price <= 0) {
    return res.status(400).json({ error: '请输入有效的竞价价格' });
  }

  const existingBid = db.prepare('SELECT id FROM delivery_bids WHERE order_id = ? AND driver_id = ?').get(req.params.id, req.user!.id) as any;
  
  if (existingBid) {
    db.prepare(`
      UPDATE delivery_bids SET bid_price = ?, message = ?, created_at = datetime('now')
      WHERE id = ?
    `).run(bid_price, message || '', existingBid.id);
  } else {
    const bidId = uuidv4();
    db.prepare(`
      INSERT INTO delivery_bids (id, order_id, driver_id, bid_price, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(bidId, req.params.id, req.user!.id, bid_price, message || '');
  }

  createNotification(db, order.employer_id, 'new_bid', '收到新报价', `您的找车订单收到了新的司机报价`, req.params.id);

  res.json({ success: true, message: '竞价提交成功' });
});

router.post('/:id/accept-bid', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'employer') {
    return res.status(403).json({ error: '只有雇主可以接受竞价' });
  }

  const db = getDB();
  const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.employer_id !== req.user!.id) {
    return res.status(403).json({ error: '只能操作自己的订单' });
  }

  if (order.status !== 'bidding') {
    return res.status(400).json({ error: '订单不在竞价阶段' });
  }

  const { bid_id } = req.body;
  const bid = db.prepare('SELECT * FROM delivery_bids WHERE id = ?').get(bid_id) as any;

  if (!bid || bid.order_id !== req.params.id) {
    return res.status(400).json({ error: '竞价记录不存在' });
  }

  const transaction = db.transaction(() => {
    db.prepare(`
      UPDATE delivery_orders 
      SET driver_id = ?, final_price = ?, status = 'accepted', updated_at = datetime('now')
      WHERE id = ?
    `).run(bid.driver_id, bid.bid_price, req.params.id);

    db.prepare(`
      UPDATE delivery_bids SET status = 'accepted' WHERE id = ?
    `).run(bid_id);

    db.prepare(`
      UPDATE delivery_bids SET status = 'rejected' WHERE order_id = ? AND id != ?
    `).run(req.params.id, bid_id);
  });

  transaction();

  createNotification(db, bid.driver_id, 'bid_accepted', '报价已被接受', `您的报价已被雇主接受`, req.params.id);

  res.json({ success: true, message: '已接受报价', final_price: bid.bid_price });
});

router.post('/:id/start', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'accepted') {
    return res.status(400).json({ error: '订单状态不支持开始运输' });
  }

  if (req.user!.role === 'driver' && order.driver_id !== req.user!.id) {
    return res.status(403).json({ error: '只有接单司机可以开始运输' });
  }

  db.prepare(`
    UPDATE delivery_orders SET status = 'in_progress', pickup_time = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: '运输已开始' });
});

router.post('/:id/complete', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM delivery_orders WHERE id = ?').get(req.params.id) as any;

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'in_progress') {
    return res.status(400).json({ error: '订单状态不支持确认送达' });
  }

  const { completion_photos, notes } = req.body;

  let confirmation = db.prepare('SELECT * FROM order_confirmations WHERE order_id = ? AND order_type = ?').get(req.params.id, 'delivery') as any;

  if (!confirmation) {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, completion_photos, notes)
      VALUES (?, ?, 'delivery', ?, ?)
    `).run(confId, req.params.id, JSON.stringify(completion_photos || []), notes || '');
  }

  if (req.user!.role === 'driver') {
    if (order.driver_id !== req.user!.id) {
      return res.status(403).json({ error: '只有接单司机可以确认送达' });
    }
    db.prepare(`
      UPDATE order_confirmations SET driver_confirmed = 1
      WHERE order_id = ? AND order_type = 'delivery'
    `).run(req.params.id);
  } else if (req.user!.role === 'employer') {
    if (order.employer_id !== req.user!.id) {
      return res.status(403).json({ error: '只有雇主可以确认收货' });
    }
    db.prepare(`
      UPDATE order_confirmations SET employer_confirmed = 1
      WHERE order_id = ? AND order_type = 'delivery'
    `).run(req.params.id);
  }

  confirmation = db.prepare('SELECT * FROM order_confirmations WHERE order_id = ? AND order_type = ?').get(req.params.id, 'delivery') as any;

  if (confirmation.employer_confirmed && confirmation.driver_confirmed) {
    db.prepare(`
      UPDATE delivery_orders SET status = 'completed', delivery_time = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

    if (order.driver_id) {
      db.prepare(`
        UPDATE driver_profiles 
        SET completed_orders = completed_orders + 1
        WHERE user_id = ?
      `).run(order.driver_id);
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
