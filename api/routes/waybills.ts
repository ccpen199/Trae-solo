import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, page = 1, pageSize = 10 } = req.query;

  let sql = 'SELECT w.*, c.cargo_name, c.start_city, c.end_city, d.name as driver_name, d.phone as driver_phone, v.plate_no FROM waybills w LEFT JOIN cargo c ON w.cargo_id = c.id LEFT JOIN drivers d ON w.driver_id = d.id LEFT JOIN vehicles v ON w.vehicle_id = v.id WHERE 1=1';
  const params: any[] = [];

  if (status) {
    sql += ' AND w.status = ?';
    params.push(status);
  }

  if (req.user?.role === 'driver') {
    sql += ' AND w.driver_id IN (SELECT id FROM drivers WHERE user_id = ?)';
    params.push(req.user.id);
  } else if (req.user?.role === 'fleet') {
    sql += ' AND w.fleet_id = ?';
    params.push(req.user.id);
  }

  const countSql = sql.replace('SELECT w.*, c.cargo_name, c.start_city, c.end_city, d.name as driver_name, d.phone as driver_phone, v.plate_no', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY w.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    waybillNo: row.waybill_no,
    cargoId: row.cargo_id,
    cargoName: row.cargo_name,
    startCity: row.start_city,
    endCity: row.end_city,
    driverId: row.driver_id,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    vehicleId: row.vehicle_id,
    plateNo: row.plate_no,
    actualPrice: row.actual_price,
    status: row.status,
    startTime: row.start_time,
    endTime: row.end_time,
    currentLocation: row.current_location ? JSON.parse(row.current_location) : null,
    createdAt: row.created_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const row = db.prepare(`
    SELECT w.*, c.*, d.name as driver_name, d.phone as driver_phone, v.plate_no
    FROM waybills w
    LEFT JOIN cargo c ON w.cargo_id = c.id
    LEFT JOIN drivers d ON w.driver_id = d.id
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    WHERE w.id = ?
  `).get(id) as any;

  if (!row) {
    return res.error('运单不存在', 404);
  }

  const waybill = {
    id: row.id,
    waybillNo: row.waybill_no,
    cargoId: row.cargo_id,
    cargo: {
      cargoName: row.cargo_name,
      cargoType: row.cargo_type,
      weight: row.weight,
      volume: row.volume,
      startCity: row.start_city,
      endCity: row.end_city,
      startAddress: row.start_address,
      endAddress: row.end_address,
      pickupTime: row.pickup_time,
    },
    driverId: row.driver_id,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    vehicleId: row.vehicle_id,
    plateNo: row.plate_no,
    actualPrice: row.actual_price,
    status: row.status,
    startTime: row.start_time,
    endTime: row.end_time,
    currentLocation: row.current_location ? JSON.parse(row.current_location) : null,
    createdAt: row.created_at,
  };

  res.success(waybill, '获取成功');
});

router.post('/:id/gps', authMiddleware, roleMiddleware(['driver', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { lat, lng, speed, direction, ignition } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.error('经纬度不能为空', 400);
  }

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id) as any;
  if (!waybill) {
    return res.error('运单不存在', 404);
  }

  if (req.user?.role === 'driver') {
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(req.user.id) as any;
    if (!driver || driver.id !== waybill.driver_id) {
      return res.error('无权限上报该运单GPS', 403);
    }
  }

  const gpsId = uuidv4();
  const timestamp = new Date().toISOString();

  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO gps_points (id, waybill_id, lat, lng, speed, direction, ignition, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(gpsId, id, lat, lng, speed || 0, direction || 0, ignition ? 1 : 0, timestamp);

    db.prepare(`
      UPDATE waybills SET current_location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(JSON.stringify({ lat, lng, timestamp }), id);
  });

  transaction();

  res.success({ id: gpsId, timestamp }, 'GPS上报成功');
});

router.get('/:id/track', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { startTime, endTime } = req.query;

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id) as any;
  if (!waybill) {
    return res.error('运单不存在', 404);
  }

  let sql = 'SELECT * FROM gps_points WHERE waybill_id = ?';
  const params: any[] = [id];

  if (startTime) {
    sql += ' AND timestamp >= ?';
    params.push(startTime);
  }
  if (endTime) {
    sql += ' AND timestamp <= ?';
    params.push(endTime);
  }

  sql += ' ORDER BY timestamp ASC';

  const rows = db.prepare(sql).all(...params) as any[];

  const track = rows.map(row => ({
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    speed: row.speed,
    direction: row.direction,
    ignition: !!row.ignition,
    timestamp: row.timestamp,
  }));

  res.success({ waybillId: id, track }, '获取轨迹成功');
});

router.put('/:id/status', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.error('状态不能为空', 400);
  }

  const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(id) as any;
  if (!waybill) {
    return res.error('运单不存在', 404);
  }

  const validStatuses = ['pending', 'loading', 'in_transit', 'unloading', 'completed', 'exception'];
  if (!validStatuses.includes(status)) {
    return res.error('无效的状态', 400);
  }

  const updateData: any = { status };
  if (status === 'loading' && !waybill.start_time) {
    updateData.start_time = new Date().toISOString();
  }
  if (status === 'completed') {
    updateData.end_time = new Date().toISOString();
  }

  let sql = 'UPDATE waybills SET status = ?, updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [status];

  if (updateData.start_time) {
    sql += ', start_time = ?';
    params.push(updateData.start_time);
  }
  if (updateData.end_time) {
    sql += ', end_time = ?';
    params.push(updateData.end_time);
  }

  sql += ' WHERE id = ?';
  params.push(id);

  db.prepare(sql).run(...params);

  if (status === 'completed') {
    db.prepare('UPDATE cargo SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', waybill.cargo_id);
  }

  res.success({ id, status }, '状态更新成功');
});

export default router;
