import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
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
    minBid: row.min_bid as number | undefined,
    bidCount: row.bid_count as number | undefined,
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

router.get('/orders', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const driverRow = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!driverRow) {
      res.json({ code: 404, message: '司机信息不存在', data: null });
      return;
    }
    const myLat = driverRow.current_lat as number;
    const myLng = driverRow.current_lng as number;

    const rows = db.prepare(`
      SELECT o.*, u.nickname as employer_nickname FROM orders o
      JOIN users u ON o.employer_id = u.id
      WHERE o.type IN ('vehicle', 'moving') AND o.status IN ('pending', 'bidding')
      ORDER BY o.created_at DESC
    `).all() as Record<string, unknown>[];

    const orders = rows.map(r => {
      const distance = haversineDistance(myLat, myLng, r.start_lat as number, r.start_lng as number);
      return rowToOrder({ ...r, distance });
    }).sort((a, b) => ((a.distance as number) || 0) - ((b.distance as number) || 0));

    res.json({ code: 0, message: 'ok', data: orders });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/bidding', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const driverRow = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!driverRow) {
      res.json({ code: 404, message: '司机信息不存在', data: null });
      return;
    }
    const myLat = driverRow.current_lat as number;
    const myLng = driverRow.current_lng as number;

    const rows = db.prepare(`
      SELECT o.*, u.nickname as employer_nickname,
        (SELECT MIN(price) FROM bids WHERE order_id = o.id) as min_bid,
        (SELECT COUNT(*) FROM bids WHERE order_id = o.id) as bid_count
      FROM orders o
      JOIN users u ON o.employer_id = u.id
      WHERE o.type IN ('vehicle', 'moving') AND o.status = 'bidding' AND o.is_auction = 1
      ORDER BY o.created_at DESC
    `).all() as Record<string, unknown>[];

    const orders = rows.map(r => {
      const distance = haversineDistance(myLat, myLng, r.start_lat as number, r.start_lng as number);
      return rowToOrder({ ...r, distance });
    }).sort((a, b) => ((a.distance as number) || 0) - ((b.distance as number) || 0));

    res.json({ code: 0, message: 'ok', data: orders });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/bidding/:orderId', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { orderId } = req.params;
    const { price, message } = req.body as { price: number; message?: string };
    if (!price) {
      res.json({ code: 400, message: '出价不能为空', data: null });
      return;
    }
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO bids (id, order_id, bidder_id, bidder_type, price, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), orderId, userId, 'driver', price, message || '', 'pending', now);

    res.json({ code: 0, message: 'ok', data: { success: true } });
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
      WHERE o.driver_id = ?
      ORDER BY o.created_at DESC
    `).all(userId) as Record<string, unknown>[];
    res.json({ code: 0, message: 'ok', data: rows.map(rowToOrder) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/waybill/:id', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const orderRow = db.prepare(`
      SELECT o.*, u.nickname as employer_nickname, u.phone as employer_phone FROM orders o
      JOIN users u ON o.employer_id = u.id
      WHERE o.id = ? AND o.driver_id = ?
    `).get(id, userId) as Record<string, unknown> | undefined;
    if (!orderRow) {
      res.json({ code: 404, message: '运单不存在', data: null });
      return;
    }
    const order = rowToOrder(orderRow);

    const driverInfo = db.prepare(`
      SELECT d.*, v.plate_no, v.vehicle_type, v.load_capacity, v.volume_capacity,
        u.nickname as driver_name, u.phone as driver_phone
      FROM drivers d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = ?
    `).get(userId) as Record<string, unknown> | undefined;

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

    res.json({
      code: 0,
      message: 'ok',
      data: {
        ...order,
        employerName: order.employerNickname,
        driverInfo: driverInfo ? {
          name: driverInfo.driver_name,
          phone: driverInfo.driver_phone,
          plateNo: driverInfo.plate_no,
          vehicleType: driverInfo.vehicle_type,
          loadCapacity: driverInfo.load_capacity,
          volumeCapacity: driverInfo.volume_capacity
        } : null,
        gpsTracks,
        signed: Boolean(orderRow.driver_signed),
        signedAt: orderRow.driver_signed_at
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/waybill/:id/sign', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND driver_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '运单不存在', data: null });
      return;
    }
    res.json({ code: 0, message: 'ok', data: { success: true, signedAt: new Date().toISOString() } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/vehicles', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const driverRow = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!driverRow) {
      res.json({ code: 404, message: '司机信息不存在', data: null });
      return;
    }
    const vehicles = db.prepare(`
      SELECT v.* FROM vehicles v
      JOIN drivers d ON v.driver_id = d.id
      WHERE d.user_id = ?
    `).all(userId) as Record<string, unknown>[];

    const result = vehicles.map(v => ({
      id: v.id,
      plateNo: v.plate_no,
      vehicleType: v.vehicle_type,
      loadCapacity: v.load_capacity,
      volumeCapacity: v.volume_capacity,
      insuranceNo: v.insurance_no,
      insuranceExpiry: v.insurance_expiry,
      isVerified: Boolean(v.is_verified)
    }));

    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/stats', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const completedCount = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE driver_id = ? AND status = ?').get(userId, 'completed') as { count: number }).count;
    const totalIncome = (db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE driver_id = ? AND status = ?').get(userId, 'completed') as { total: number }).total;
    const userRow = db.prepare('SELECT credit_score FROM users WHERE id = ?').get(userId) as { credit_score: number };
    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalOrders: completedCount,
        totalIncome: totalIncome,
        creditScore: userRow.credit_score,
        monthlyIncome: totalIncome * 0.3,
        todayIncome: totalIncome * 0.05,
        totalMileage: completedCount * 25
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;
