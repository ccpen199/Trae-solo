import { Router } from 'express';
import { getDb } from '../db';
import { authenticate, getUserId } from './auth';

const router = Router();

function rowToOrder(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    employerId: row.employer_id as string,
    workerId: row.worker_id as string | null,
    driverId: row.driver_id as string | null,
    type: row.type as string,
    status: row.status as string,
    title: row.title as string,
    description: row.description as string,
    price: row.price as number,
    pricingMode: row.pricing_mode as string,
    isAuction: Boolean(row.is_auction),
    startAddress: row.start_address as string,
    startLat: row.start_lat as number,
    startLng: row.start_lng as number,
    endAddress: row.end_address as string,
    endLat: row.end_lat as number | null,
    endLng: row.end_lng as number | null,
    startTime: row.start_time as string,
    durationHours: row.duration_hours as number | null,
    workerCount: row.worker_count as number | null,
    skillsRequired: row.skills_required ? JSON.parse(row.skills_required as string) : [],
    cargoWeight: row.cargo_weight as number | null,
    cargoVolume: row.cargo_volume as number | null,
    cargoType: row.cargo_type as string | null,
    insuranceAmount: row.insurance_amount as number | null,
    employerNickname: row.employer_nickname as string | undefined,
    distance: row.distance as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

router.get('/orders/recommend', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const workerRow = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!workerRow) {
      res.json({ code: 404, message: '工人信息不存在', data: null });
      return;
    }
    const mySkills: string[] = workerRow.skills ? JSON.parse(workerRow.skills as string) : [];
    const myLat = workerRow.current_lat as number;
    const myLng = workerRow.current_lng as number;

    const rows = db.prepare(`
      SELECT o.*, u.nickname as employer_nickname FROM orders o
      JOIN users u ON o.employer_id = u.id
      WHERE o.type IN ('labor', 'moving') AND o.status IN ('pending', 'bidding')
      ORDER BY o.created_at DESC
    `).all() as Record<string, unknown>[];

    let orders = rows.map(r => {
      const distance = haversineDistance(myLat, myLng, r.start_lat as number, r.start_lng as number);
      return rowToOrder({ ...r, distance });
    });

    orders = orders.filter(o => {
      const dist = o.distance as number | undefined;
      if (dist && dist > (workerRow.service_radius as number)) return false;
      if (mySkills.length === 0) return true;
      const required = o.skillsRequired as string[];
      return required.length === 0 || required.some(s => mySkills.includes(s));
    });

    orders.sort((a, b) => ((a.distance as number) || 0) - ((b.distance as number) || 0));

    res.json({ code: 0, message: 'ok', data: orders });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/orders/my', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const rows = db.prepare(`
      SELECT o.*, u.nickname as employer_nickname FROM orders o
      JOIN users u ON o.employer_id = u.id
      WHERE o.worker_id = ?
      ORDER BY o.created_at DESC
    `).all(userId) as Record<string, unknown>[];
    res.json({ code: 0, message: 'ok', data: rows.map(rowToOrder) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/orders/:id', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const row = db.prepare(`
      SELECT o.*, u.nickname as employer_nickname, u.phone as employer_phone FROM orders o
      JOIN users u ON o.employer_id = u.id
      WHERE o.id = ? AND (o.worker_id = ? OR o.status IN ('pending', 'bidding'))
    `).get(id, userId) as Record<string, unknown> | undefined;
    if (!row) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const order = rowToOrder(row);

    const employerRow = db.prepare('SELECT nickname, avatar, phone FROM users WHERE id = ?').get(order.employerId) as Record<string, unknown> | undefined;
    const employerInfo = employerRow ? {
      nickname: employerRow.nickname,
      avatar: employerRow.avatar,
      phone: employerRow.phone
    } : null;

    const trackRows = db.prepare('SELECT * FROM gps_tracks WHERE order_id = ? ORDER BY timestamp').all(id) as Record<string, unknown>[];
    const gpsTracks = trackRows.map(t => ({
      id: t.id,
      orderId: t.order_id,
      userId: t.user_id,
      lat: t.lat,
      lng: t.lng,
      speed: t.speed,
      timestamp: t.timestamp
    }));

    const bidRows = db.prepare(`
      SELECT b.*, u.nickname as bidder_name FROM bids b
      JOIN users u ON b.bidder_id = u.id
      WHERE b.order_id = ?
      ORDER BY b.created_at DESC
    `).all(id) as Record<string, unknown>[];
    const bids = bidRows.map(b => ({
      id: b.id,
      orderId: b.order_id,
      bidderId: b.bidder_id,
      bidderType: b.bidder_type,
      bidderName: b.bidder_name,
      price: b.price,
      message: b.message,
      status: b.status,
      createdAt: b.created_at
    }));

    res.json({ code: 0, message: 'ok', data: { ...order, employerInfo, gpsTracks, bids } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/accept', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (!['pending', 'bidding'].includes(order.status as string)) {
      res.json({ code: 400, message: '订单状态不支持接单', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET worker_id = ?, status = ?, updated_at = ? WHERE id = ?').run(userId, 'assigned', now, id);
    res.json({ code: 0, message: 'ok', data: { success: true } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/complete', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND worker_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('in_service', now, id);
    res.json({ code: 0, message: 'ok', data: { success: true } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/stats', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const completedCount = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE worker_id = ? AND status = ?').get(userId, 'completed') as { count: number }).count;
    const totalIncome = (db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE worker_id = ? AND status = ?').get(userId, 'completed') as { total: number }).total;
    const userRow = db.prepare('SELECT credit_score FROM users WHERE id = ?').get(userId) as { credit_score: number };
    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalOrders: completedCount,
        totalIncome: totalIncome,
        creditScore: userRow.credit_score,
        monthlyIncome: totalIncome * 0.3,
        todayIncome: totalIncome * 0.05
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/skills', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const workerRow = db.prepare('SELECT skills FROM workers WHERE user_id = ?').get(userId) as { skills: string } | undefined;
    const skills = workerRow && workerRow.skills ? JSON.parse(workerRow.skills) : [];
    res.json({ code: 0, message: 'ok', data: skills });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;
