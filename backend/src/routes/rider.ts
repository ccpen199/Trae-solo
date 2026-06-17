import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authenticate, getUserId } from './auth';

const router = Router();

function rowToOrder(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    orderNo: row.order_no as string,
    category: row.category as string,
    status: row.status as string,
    amount: row.amount as number,
    goodsAmount: row.goods_amount as number,
    deliveryFee: row.delivery_fee as number,
    distance: row.distance as number,
    weight: row.weight as number,
    pickupName: row.pickup_name as string,
    pickupPhone: row.pickup_phone as string,
    pickupAddress: row.pickup_address as string,
    pickupLat: row.pickup_lat as number,
    pickupLng: row.pickup_lng as number,
    deliverName: row.deliver_name as string,
    deliverPhone: row.deliver_phone as string,
    deliverAddress: row.deliver_address as string,
    deliverLat: row.deliver_lat as number,
    deliverLng: row.deliver_lng as number,
    goodsDescription: row.goods_description as string,
    remark: row.remark as string,
    expectedAt: row.expected_at as string | null,
    acceptedAt: row.accepted_at as string | null,
    pickedUpAt: row.picked_up_at as string | null,
    completedAt: row.completed_at as string | null,
    createdAt: row.created_at as string
  };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get('/dashboard', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const riderId = rider.id as string;
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
      FROM orders WHERE rider_id = ? AND DATE(created_at) = ?
    `).get(riderId, today) as { count: number; total: number };
    const completedToday = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE rider_id = ? AND status = 'completed' AND DATE(created_at) = ?
    `).get(riderId, today) as { count: number };
    const onlineMinutes = rider.online_at ? Math.floor((Date.now() - new Date(rider.online_at as string).getTime()) / 60000) : 0;
    res.json({
      code: 0,
      message: 'ok',
      data: {
        todayOrders: todayOrders.count,
        todayIncome: Number(todayOrders.total.toFixed(2)),
        completedOrders: completedToday.count,
        onlineMinutes,
        level: rider.level,
        avgRating: rider.avg_rating,
        totalOrders: rider.total_orders,
        creditScore: rider.credit_score
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/hall', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { minDistance, maxDistance, minPrice, maxPrice, category } = req.query as {
      minDistance?: string; maxDistance?: string; minPrice?: string; maxPrice?: string; category?: string;
    };
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const riderLat = rider.current_lat as number || 39.9042;
    const riderLng = rider.current_lng as number || 116.4074;
    let sql = 'SELECT * FROM orders WHERE status = ? AND rider_id IS NULL';
    const params: unknown[] = ['pending'];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    let orders = rows.map(o => {
      const order = rowToOrder(o);
      order.distanceFromMe = Number(haversineDistance(
        riderLat, riderLng,
        order.pickupLat as number, order.pickupLng as number
      ).toFixed(2));
      return order;
    });
    if (minDistance) {
      orders = orders.filter(o => (o.distanceFromMe as number) >= Number(minDistance));
    }
    if (maxDistance) {
      orders = orders.filter(o => (o.distanceFromMe as number) <= Number(maxDistance));
    }
    if (minPrice) {
      orders = orders.filter(o => (o.amount as number) >= Number(minPrice));
    }
    if (maxPrice) {
      orders = orders.filter(o => (o.amount as number) <= Number(maxPrice));
    }
    res.json({ code: 0, message: 'ok', data: orders });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/grab', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    if (rider.online_status === 'offline') {
      res.json({ code: 400, message: '请先上线', data: null });
      return;
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (order.status !== 'pending' || order.rider_id) {
      res.json({ code: 400, message: '订单已被接单', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET rider_id = ?, status = ?, accepted_at = ? WHERE id = ?')
      .run(rider.id, 'accepted', now, id);
    db.prepare('UPDATE riders SET current_orders = current_orders + 1, updated_at = ? WHERE id = ?')
      .run(now, rider.id);
    res.json({ code: 0, message: '抢单成功', data: { id, status: 'accepted', acceptedAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/accept', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND rider_id = ?').get(id, rider.id) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (order.status !== 'accepted') {
      res.json({ code: 400, message: '当前状态无法确认', data: null });
      return;
    }
    res.json({ code: 0, message: '确认接单成功', data: { id, status: 'accepted' } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/tasks', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status } = req.query as { status?: string };
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    let sql = 'SELECT * FROM orders WHERE rider_id = ?';
    const params: unknown[] = [rider.id];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    res.json({ code: 0, message: 'ok', data: rows.map(rowToOrder) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/tasks/:id/pickup', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND rider_id = ?').get(id, rider.id) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (!['accepted', 'picked_up'].includes(order.status as string)) {
      res.json({ code: 400, message: '当前状态无法取货', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, picked_up_at = COALESCE(picked_up_at, ?) WHERE id = ?')
      .run('delivering', now, id);
    res.json({ code: 0, message: '取货成功', data: { id, status: 'delivering', pickedUpAt: order.picked_up_at || now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/tasks/:id/deliver', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND rider_id = ?').get(id, rider.id) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (order.status !== 'delivering') {
      res.json({ code: 400, message: '当前状态无法送达', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, completed_at = ? WHERE id = ?')
      .run('completed', now, id);
    db.prepare('UPDATE riders SET total_orders = total_orders + 1, current_orders = MAX(current_orders - 1, 0), updated_at = ? WHERE id = ?')
      .run(now, rider.id);
    const amount = order.amount as number;
    const settlementId = uuidv4();
    db.prepare(`
      INSERT INTO settlements (id, order_id, rider_id, rider_income, merchant_id, merchant_income, platform_income, insurance_fee, tax, settled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      settlementId, id, rider.id,
      Number((amount * 0.7).toFixed(2)),
      order.merchant_id as string | null,
      order.merchant_id ? Number((amount * 0.2).toFixed(2)) : 0,
      Number((amount * 0.1).toFixed(2)),
      0.5,
      Number((amount * 0.1 * 0.06).toFixed(2)),
      now
    );
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
      .run(Number((amount * 0.7).toFixed(2)), userId);
    res.json({ code: 0, message: '送达成功', data: { id, status: 'completed', completedAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/earnings', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const total = db.prepare('SELECT COALESCE(SUM(rider_income), 0) as total FROM settlements WHERE rider_id = ?')
      .get(rider.id) as { total: number };
    const today = new Date().toISOString().split('T')[0];
    const todayIncome = db.prepare(`
      SELECT COALESCE(SUM(rider_income), 0) as total FROM settlements WHERE rider_id = ? AND DATE(settled_at) = ?
    `).get(rider.id, today) as { total: number };
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthIncome = db.prepare(`
      SELECT COALESCE(SUM(rider_income), 0) as total FROM settlements WHERE rider_id = ? AND strftime('%Y-%m', settled_at) = ?
    `).get(rider.id, thisMonth) as { total: number };
    const details = db.prepare(`
      SELECT s.*, o.order_no, o.amount as order_amount, o.category
      FROM settlements s JOIN orders o ON s.order_id = o.id
      WHERE s.rider_id = ? ORDER BY s.settled_at DESC LIMIT 50
    `).all(rider.id) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalIncome: Number(total.total.toFixed(2)),
        todayIncome: Number(todayIncome.total.toFixed(2)),
        monthIncome: Number(monthIncome.total.toFixed(2)),
        details: details.map(d => ({
          id: d.id,
          orderId: d.order_id,
          orderNo: d.order_no,
          orderAmount: d.order_amount,
          category: d.category,
          riderIncome: d.rider_income,
          settledAt: d.settled_at
        }))
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/withdraw', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { amount, bankCard, bankName, holderName } = req.body as {
      amount: number; bankCard: string; bankName: string; holderName: string;
    };
    if (!amount || amount <= 0) {
      res.json({ code: 400, message: '提现金额无效', data: null });
      return;
    }
    const db = getDb();
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!user || (user.balance as number) < amount) {
      res.json({ code: 400, message: '余额不足', data: null });
      return;
    }
    const fee = Number((amount * 0.01).toFixed(2));
    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO withdrawals (id, user_id, amount, fee, bank_card, bank_name, holder_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, amount, fee, bankCard || '', bankName || '', holderName || '', 'pending', now);
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, userId);
    res.json({ code: 0, message: '提现申请已提交', data: { id, status: 'pending', createdAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/withdraw', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const rows = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
      .all(userId) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: rows.map(r => ({
        id: r.id,
        amount: r.amount,
        fee: r.fee,
        bankName: r.bank_name,
        bankCard: r.bank_card,
        holderName: r.holder_name,
        status: r.status,
        auditNote: r.audit_note,
        createdAt: r.created_at,
        paidAt: r.paid_at
      }))
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/growth', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const medals = db.prepare('SELECT * FROM rider_medals WHERE rider_id = ? ORDER BY awarded_at DESC')
      .all(rider.id) as Record<string, unknown>[];
    const levels = [
      { id: 'bronze', name: '青铜骑士', minOrders: 0, current: rider.total_orders as number, reached: true },
      { id: 'silver', name: '白银骑士', minOrders: 100, current: rider.total_orders as number, reached: (rider.total_orders as number) >= 100 },
      { id: 'gold', name: '黄金骑士', minOrders: 500, current: rider.total_orders as number, reached: (rider.total_orders as number) >= 500 },
      { id: 'platinum', name: '铂金骑士', minOrders: 1000, current: rider.total_orders as number, reached: (rider.total_orders as number) >= 1000 },
      { id: 'diamond', name: '钻石骑士', minOrders: 1500, current: rider.total_orders as number, reached: (rider.total_orders as number) >= 1500 }
    ];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        currentLevel: rider.level,
        totalOrders: rider.total_orders,
        avgRating: rider.avg_rating,
        fulfillmentRate: rider.fulfillment_rate,
        creditScore: rider.credit_score,
        levels,
        medals: medals.map(m => ({
          id: m.id,
          type: m.type,
          name: m.name,
          awardedAt: m.awarded_at
        }))
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/settings', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const rider = db.prepare(`
      SELECT r.*, u.nickname, u.avatar, u.phone, u.real_name, u.id_card
      FROM riders r JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
    `).get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const vehicles = db.prepare('SELECT * FROM vehicles WHERE rider_id = ?').all(rider.id) as Record<string, unknown>[];
    const serviceAreas = db.prepare('SELECT * FROM rider_service_areas WHERE rider_id = ?').all(rider.id) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id: rider.id,
        nickname: rider.nickname,
        avatar: rider.avatar,
        phone: rider.phone,
        realName: rider.real_name,
        idCard: rider.id_card,
        level: rider.level,
        acceptMode: rider.accept_mode,
        onlineStatus: rider.online_status,
        currentLat: rider.current_lat,
        currentLng: rider.current_lng,
        vehicles: vehicles.map(v => ({
          id: v.id,
          type: v.type,
          plateNumber: v.plate_number,
          vehicleImage: v.vehicle_image,
          insuranceExpire: v.insurance_expire
        })),
        serviceAreas: serviceAreas.map(s => ({
          id: s.id,
          name: s.name,
          polygon: s.polygon ? JSON.parse(s.polygon as string) : []
        }))
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.put('/settings', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const body = req.body as Record<string, unknown>;
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, real_name = ?, id_card = ? WHERE id = ?')
      .run(body.nickname as string || '', body.avatar as string || '', body.realName as string || '', body.idCard as string || '', userId);
    db.prepare('UPDATE riders SET accept_mode = ?, updated_at = ? WHERE user_id = ?')
      .run(body.acceptMode as string || 'grab', now, userId);
    res.json({ code: 0, message: '更新成功', data: null });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/location', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { lat, lng, speed, accuracy } = req.body as { lat: number; lng: number; speed?: number; accuracy?: number };
    if (lat === undefined || lng === undefined) {
      res.json({ code: 400, message: '经纬度不能为空', data: null });
      return;
    }
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE riders SET current_lat = ?, current_lng = ?, updated_at = ? WHERE id = ?')
      .run(lat, lng, now, rider.id);
    const activeOrder = db.prepare(`
      SELECT id FROM orders WHERE rider_id = ? AND status IN ('accepted', 'picked_up', 'delivering') LIMIT 1
    `).get(rider.id) as Record<string, unknown> | undefined;
    if (activeOrder) {
      db.prepare(`
        INSERT INTO gps_tracks (order_id, rider_id, timestamp, lat, lng, speed, accuracy)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(activeOrder.id, rider.id, now, lat, lng, speed || 0, accuracy || 5);
    }
    res.json({ code: 0, message: '位置上报成功', data: { timestamp: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/online', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { online } = req.body as { online?: boolean };
    const db = getDb();
    const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    const targetStatus = online === false ? 'offline' : 'online';
    const onlineAt = targetStatus === 'online' && rider.online_status === 'offline' ? now : rider.online_at;
    db.prepare('UPDATE riders SET online_status = ?, online_at = ?, updated_at = ? WHERE id = ?')
      .run(targetStatus, onlineAt, now, rider.id);
    res.json({ code: 0, message: 'ok', data: { onlineStatus: targetStatus } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;
