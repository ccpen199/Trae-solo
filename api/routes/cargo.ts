import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, startCity, endCity, page = 1, pageSize = 10 } = req.query;

  let sql = 'SELECT * FROM cargo WHERE 1=1';
  const params: any[] = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (startCity) {
    sql += ' AND start_city LIKE ?';
    params.push(`%${startCity}%`);
  }
  if (endCity) {
    sql += ' AND end_city LIKE ?';
    params.push(`%${endCity}%`);
  }

  if (req.user?.role === 'owner') {
    sql += ' AND owner_id = ?';
    params.push(req.user.id);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    orderNo: row.order_no,
    ownerId: row.owner_id,
    cargoName: row.cargo_name,
    cargoType: row.cargo_type,
    weight: row.weight,
    volume: row.volume,
    quantity: row.quantity,
    packageType: row.package_type,
    startCity: row.start_city,
    endCity: row.end_city,
    startAddress: row.start_address,
    endAddress: row.end_address,
    pickupTime: row.pickup_time,
    deliveryTime: row.delivery_time,
    temperatureReq: row.temperature_req ? JSON.parse(row.temperature_req) : null,
    insurance: row.insurance ? JSON.parse(row.insurance) : null,
    vehicleReq: JSON.parse(row.vehicle_req),
    expectedPrice: row.expected_price,
    status: row.status,
    createdAt: row.created_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const row = db.prepare('SELECT * FROM cargo WHERE id = ?').get(id) as any;

  if (!row) {
    return res.error('货源不存在', 404);
  }

  const cargo = {
    id: row.id,
    orderNo: row.order_no,
    ownerId: row.owner_id,
    cargoName: row.cargo_name,
    cargoType: row.cargo_type,
    weight: row.weight,
    volume: row.volume,
    quantity: row.quantity,
    packageType: row.package_type,
    startCity: row.start_city,
    endCity: row.end_city,
    startAddress: row.start_address,
    endAddress: row.end_address,
    pickupTime: row.pickup_time,
    deliveryTime: row.delivery_time,
    temperatureReq: row.temperature_req ? JSON.parse(row.temperature_req) : null,
    insurance: row.insurance ? JSON.parse(row.insurance) : null,
    vehicleReq: JSON.parse(row.vehicle_req),
    expectedPrice: row.expected_price,
    status: row.status,
    createdAt: row.created_at,
  };

  res.success(cargo, '获取成功');
});

router.post('/', authMiddleware, roleMiddleware(['owner', 'admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.error('未授权访问', 401);
  }

  const {
    cargoName, cargoType, weight, volume, quantity, packageType,
    startCity, endCity, startAddress, endAddress, pickupTime, deliveryTime,
    temperatureReq, insurance, vehicleReq, expectedPrice
  } = req.body;

  if (!cargoName || !startCity || !endCity || !startAddress || !endAddress || !pickupTime || !vehicleReq || !expectedPrice) {
    return res.error('请填写完整信息', 400);
  }

  const id = uuidv4();
  const orderNo = `ORD${Date.now()}`;

  const stmt = db.prepare(`
    INSERT INTO cargo (
      id, order_no, owner_id, cargo_name, cargo_type, weight, volume, quantity, package_type,
      start_city, end_city, start_address, end_address, pickup_time, delivery_time,
      temperature_req, insurance, vehicle_req, expected_price, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `);

  stmt.run(
    id, orderNo, req.user.id, cargoName, cargoType || 'FTL', weight, volume, quantity, packageType,
    startCity, endCity, startAddress, endAddress, pickupTime, deliveryTime,
    temperatureReq ? JSON.stringify(temperatureReq) : null,
    insurance ? JSON.stringify(insurance) : null,
    JSON.stringify(vehicleReq), expectedPrice
  );

  res.success({ id, orderNo }, '创建成功');
});

router.post('/:id/publish', authMiddleware, roleMiddleware(['owner', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(id) as any;

  if (!cargo) {
    return res.error('货源不存在', 404);
  }

  if (req.user?.role === 'owner' && cargo.owner_id !== req.user.id) {
    return res.error('无权限操作', 403);
  }

  if (cargo.status !== 'draft') {
    return res.error('该货源状态不允许发布', 400);
  }

  db.prepare('UPDATE cargo SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('published', id);

  res.success({ id, status: 'published' }, '发布成功');
});

router.post('/:id/assign', authMiddleware, roleMiddleware(['owner', 'operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { driverId, vehicleId, actualPrice } = req.body;

  if (!driverId || !vehicleId || !actualPrice) {
    return res.error('请选择司机和车辆并填写实际运费', 400);
  }

  const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(id) as any;

  if (!cargo) {
    return res.error('货源不存在', 404);
  }

  if (!['published', 'bidding'].includes(cargo.status)) {
    return res.error('该货源状态不允许派单', 400);
  }

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId) as any;
  if (!driver || driver.auth_status !== 'approved') {
    return res.error('司机不存在或未认证', 400);
  }

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId) as any;
  if (!vehicle || vehicle.auth_status !== 'approved') {
    return res.error('车辆不存在或未认证', 400);
  }

  const waybillId = uuidv4();
  const waybillNo = `WB${Date.now()}`;

  const transaction = db.transaction(() => {
    db.prepare('UPDATE cargo SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('assigned', id);

    db.prepare(`
      INSERT INTO waybills (id, waybill_no, cargo_id, driver_id, vehicle_id, fleet_id, actual_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(waybillId, waybillNo, id, driverId, vehicleId, driver.fleet_id, actualPrice);

    const billId = uuidv4();
    const billNo = `BL${Date.now()}`;

    db.prepare(`
      INSERT INTO bills (id, bill_no, order_id, waybill_id, amount, type, status)
      VALUES (?, ?, ?, ?, ?, 'receivable', 'unpaid')
    `).run(billId, billNo, id, waybillId, actualPrice);
  });

  transaction();

  res.success({ waybillId, waybillNo, status: 'assigned' }, '派单成功');
});

router.put('/:id', authMiddleware, roleMiddleware(['owner', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(id) as any;

  if (!cargo) {
    return res.error('货源不存在', 404);
  }

  if (req.user?.role === 'owner' && cargo.owner_id !== req.user.id) {
    return res.error('无权限操作', 403);
  }

  if (cargo.status !== 'draft') {
    return res.error('只能编辑草稿状态的货源', 400);
  }

  const {
    cargoName, cargoType, weight, volume, quantity, packageType,
    startCity, endCity, startAddress, endAddress, pickupTime, deliveryTime,
    temperatureReq, insurance, vehicleReq, expectedPrice
  } = req.body;

  const stmt = db.prepare(`
    UPDATE cargo SET
      cargo_name = ?, cargo_type = ?, weight = ?, volume = ?, quantity = ?, package_type = ?,
      start_city = ?, end_city = ?, start_address = ?, end_address = ?, pickup_time = ?, delivery_time = ?,
      temperature_req = ?, insurance = ?, vehicle_req = ?, expected_price = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    cargoName || cargo.cargo_name,
    cargoType || cargo.cargo_type,
    weight ?? cargo.weight,
    volume ?? cargo.volume,
    quantity ?? cargo.quantity,
    packageType || cargo.package_type,
    startCity || cargo.start_city,
    endCity || cargo.end_city,
    startAddress || cargo.start_address,
    endAddress || cargo.end_address,
    pickupTime || cargo.pickup_time,
    deliveryTime || cargo.delivery_time,
    temperatureReq ? JSON.stringify(temperatureReq) : cargo.temperature_req,
    insurance ? JSON.stringify(insurance) : cargo.insurance,
    vehicleReq ? JSON.stringify(vehicleReq) : cargo.vehicle_req,
    expectedPrice ?? cargo.expected_price,
    id
  );

  res.success({ id }, '更新成功');
});

router.delete('/:id', authMiddleware, roleMiddleware(['owner', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const cargo = db.prepare('SELECT * FROM cargo WHERE id = ?').get(id) as any;

  if (!cargo) {
    return res.error('货源不存在', 404);
  }

  if (req.user?.role === 'owner' && cargo.owner_id !== req.user.id) {
    return res.error('无权限操作', 403);
  }

  if (cargo.status !== 'draft') {
    return res.error('只能删除草稿状态的货源', 400);
  }

  db.prepare('DELETE FROM cargo WHERE id = ?').run(id);

  res.success(null, '删除成功');
});

export default router;
