import { Router, Request } from 'express';
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
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

function rowToWorker(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    nickname: row.nickname as string,
    avatar: row.avatar as string,
    skills: row.skills ? JSON.parse(row.skills as string) : [],
    serviceRadius: row.service_radius as number,
    hourlyRate: row.hourly_rate as number,
    isOnline: Boolean(row.is_online),
    currentLat: row.current_lat as number,
    currentLng: row.current_lng as number,
    distance: row.distance as number
  };
}

function rowToDriver(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    nickname: row.nickname as string,
    avatar: row.avatar as string,
    licenseNo: row.license_no as string,
    licenseVerified: Boolean(row.license_verified),
    vehicleId: row.vehicle_id as string | null,
    vehicleType: row.vehicle_type as string | null,
    plateNo: row.plate_no as string | null,
    isOnline: Boolean(row.is_online),
    currentLat: row.current_lat as number,
    currentLng: row.current_lng as number,
    distance: row.distance as number
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
    const { status, type } = req.query as { status?: string; type?: string };
    const db = getDb();
    let sql = 'SELECT * FROM orders WHERE employer_id = ?';
    const params: unknown[] = [userId];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
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
    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ? AND employer_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!orderRow) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const order = rowToOrder(orderRow);

    let workerInfo = null;
    if (order.workerId) {
      const wRow = db.prepare(`
        SELECT w.*, u.nickname, u.avatar FROM workers w
        JOIN users u ON w.user_id = u.id
        WHERE w.user_id = ?
      `).get(order.workerId) as Record<string, unknown> | undefined;
      if (wRow) workerInfo = rowToWorker(wRow);
    }

    let driverInfo = null;
    if (order.driverId) {
      const dRow = db.prepare(`
        SELECT d.*, v.vehicle_type, v.plate_no, u.nickname, u.avatar FROM drivers d
        LEFT JOIN vehicles v ON d.vehicle_id = v.id
        JOIN users u ON d.user_id = u.id
        WHERE d.user_id = ?
      `).get(order.driverId) as Record<string, unknown> | undefined;
      if (dRow) driverInfo = rowToDriver(dRow);
    }

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

    res.json({ code: 0, message: 'ok', data: { ...order, workerInfo, driverInfo, gpsTracks, bids } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

function createOrder(req: Request, type: string): Record<string, unknown> {
  const userId = getUserId(req);
  const body = req.body as Record<string, unknown>;
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO orders (
      id, employer_id, worker_id, driver_id, type, status, title, description,
      price, pricing_mode, is_auction, start_address, start_lat, start_lng,
      end_address, end_lat, end_lng, start_time, duration_hours, worker_count,
      skills_required, cargo_weight, cargo_volume, cargo_type, insurance_amount,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, null, null, type, body.isAuction ? 'bidding' : 'pending',
    body.title, body.description, body.price, body.pricingMode || 'fixed',
    body.isAuction ? 1 : 0,
    body.startAddress, body.startLat, body.startLng,
    body.endAddress || '', body.endLat || null, body.endLng || null,
    body.startTime || now, body.durationHours || null, body.workerCount || 1,
    body.skillsRequired ? JSON.stringify(body.skillsRequired) : null,
    body.cargoWeight || null, body.cargoVolume || null, body.cargoType || null,
    body.insuranceAmount || null, now, now
  );
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
  return rowToOrder(row);
}

router.post('/orders/labor', authenticate, (req, res) => {
  try {
    const order = createOrder(req, 'labor');
    res.json({ code: 0, message: 'ok', data: order });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/vehicle', authenticate, (req, res) => {
  try {
    const order = createOrder(req, 'vehicle');
    res.json({ code: 0, message: 'ok', data: order });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/moving', authenticate, (req, res) => {
  try {
    const order = createOrder(req, 'moving');
    res.json({ code: 0, message: 'ok', data: order });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/workers/nearby', authenticate, (req, res) => {
  try {
    const { lat, lng, skill } = req.query as { lat?: string; lng?: string; skill?: string };
    if (!lat || !lng) {
      res.json({ code: 400, message: '经纬度不能为空', data: null });
      return;
    }
    const db = getDb();
    const rows = db.prepare(`
      SELECT w.*, u.nickname, u.avatar FROM workers w
      JOIN users u ON w.user_id = u.id
      WHERE w.is_online = 1
    `).all() as Record<string, unknown>[];

    let workers = rows.map(r => {
      const distance = haversineDistance(parseFloat(lat), parseFloat(lng), r.current_lat as number, r.current_lng as number);
      return rowToWorker({ ...r, distance });
    }).sort((a, b) => (a.distance as number) - (b.distance as number));

    if (skill) {
      workers = workers.filter(w => {
        const skills = w.skills as string[];
        return skills.includes(skill);
      });
    }

    res.json({ code: 0, message: 'ok', data: workers });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/drivers/nearby', authenticate, (req, res) => {
  try {
    const { lat, lng, vehicleType } = req.query as { lat?: string; lng?: string; vehicleType?: string };
    if (!lat || !lng) {
      res.json({ code: 400, message: '经纬度不能为空', data: null });
      return;
    }
    const db = getDb();
    let sql = `
      SELECT d.*, v.vehicle_type, v.plate_no, u.nickname, u.avatar FROM drivers d
      LEFT JOIN vehicles v ON d.vehicle_id = v.id
      JOIN users u ON d.user_id = u.id
      WHERE d.is_online = 1
    `;
    if (vehicleType) {
      sql += ` AND v.vehicle_type = '${vehicleType}'`;
    }
    const rows = db.prepare(sql).all() as Record<string, unknown>[];

    const drivers = rows.map(r => {
      const distance = haversineDistance(parseFloat(lat), parseFloat(lng), r.current_lat as number, r.current_lng as number);
      return rowToDriver({ ...r, distance });
    }).sort((a, b) => (a.distance as number) - (b.distance as number));

    res.json({ code: 0, message: 'ok', data: drivers });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/confirm', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND employer_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('completed', now, id);
    res.json({ code: 0, message: 'ok', data: { success: true } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/review', authenticate, (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { rating, comment, tags, revieweeId } = req.body as Record<string, unknown>;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND employer_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO reviews (id, order_id, reviewer_id, reviewee_id, rating, comment, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), id, userId, revieweeId, rating, comment || '', tags ? JSON.stringify(tags) : null, now);
    res.json({ code: 0, message: 'ok', data: { success: true } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;
