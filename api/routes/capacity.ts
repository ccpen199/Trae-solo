import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';

const router = Router();

router.get('/carriers', authMiddleware, (req: AuthRequest, res: Response) => {
  const { whitelist, authStatus, page = 1, pageSize = 10 } = req.query;

  let sql = 'SELECT * FROM carriers WHERE 1=1';
  const params: any[] = [];

  if (whitelist !== undefined) {
    sql += ' AND whitelist = ?';
    params.push(whitelist === 'true' ? 1 : 0);
  }
  if (authStatus) {
    sql += ' AND auth_status = ?';
    params.push(authStatus);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    companyName: row.company_name,
    businessLicense: row.business_license,
    roadTransportPermit: row.road_transport_permit,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    rating: row.rating,
    whitelist: !!row.whitelist,
    authStatus: row.auth_status,
    createdAt: row.created_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.post('/carriers', authMiddleware, roleMiddleware(['operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { companyName, businessLicense, roadTransportPermit, contactName, contactPhone } = req.body;

  if (!companyName || !businessLicense || !contactName || !contactPhone) {
    return res.error('请填写完整信息', 400);
  }

  const existing = db.prepare('SELECT * FROM carriers WHERE business_license = ?').get(businessLicense) as any;
  if (existing) {
    return res.error('该营业执照已存在', 400);
  }

  const id = uuidv4();

  db.prepare(`
    INSERT INTO carriers (
      id, company_name, business_license, road_transport_permit, contact_name, contact_phone
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, companyName, businessLicense, roadTransportPermit || null, contactName, contactPhone);

  res.success({ id }, '创建成功');
});

router.put('/carriers/:id', authMiddleware, roleMiddleware(['operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { companyName, businessLicense, roadTransportPermit, contactName, contactPhone, authStatus, whitelist } = req.body;

  const carrier = db.prepare('SELECT * FROM carriers WHERE id = ?').get(id) as any;
  if (!carrier) {
    return res.error('承运商不存在', 404);
  }

  db.prepare(`
    UPDATE carriers SET
      company_name = ?, business_license = ?, road_transport_permit = ?,
      contact_name = ?, contact_phone = ?, auth_status = ?, whitelist = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    companyName || carrier.company_name,
    businessLicense || carrier.business_license,
    roadTransportPermit || carrier.road_transport_permit,
    contactName || carrier.contact_name,
    contactPhone || carrier.contact_phone,
    authStatus || carrier.auth_status,
    whitelist !== undefined ? (whitelist ? 1 : 0) : carrier.whitelist,
    id
  );

  res.success({ id }, '更新成功');
});

router.get('/drivers', authMiddleware, (req: AuthRequest, res: Response) => {
  const { fleetId, authStatus, page = 1, pageSize = 10 } = req.query;

  let sql = 'SELECT * FROM drivers WHERE 1=1';
  const params: any[] = [];

  if (fleetId) {
    sql += ' AND fleet_id = ?';
    params.push(fleetId);
  }
  if (authStatus) {
    sql += ' AND auth_status = ?';
    params.push(authStatus);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    idCard: row.id_card,
    driverLicense: row.driver_license,
    driverLicenseType: row.driver_license_type,
    qualificationCertificate: row.qualification_certificate,
    avatar: row.avatar,
    authStatus: row.auth_status,
    rating: row.rating,
    totalOrders: row.total_orders,
    fleetId: row.fleet_id,
    createdAt: row.created_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.put('/drivers/:id', authMiddleware, roleMiddleware(['operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { authStatus, fleetId } = req.body;

  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id) as any;
  if (!driver) {
    return res.error('司机不存在', 404);
  }

  db.prepare(`
    UPDATE drivers SET
      auth_status = ?, fleet_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(authStatus || driver.auth_status, fleetId || driver.fleet_id, id);

  res.success({ id }, '更新成功');
});

router.get('/vehicles', authMiddleware, (req: AuthRequest, res: Response) => {
  const { fleetId, authStatus, page = 1, pageSize = 10 } = req.query;

  let sql = 'SELECT * FROM vehicles WHERE 1=1';
  const params: any[] = [];

  if (fleetId) {
    sql += ' AND fleet_id = ?';
    params.push(fleetId);
  }
  if (authStatus) {
    sql += ' AND auth_status = ?';
    params.push(authStatus);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    plateNo: row.plate_no,
    vehicleType: row.vehicle_type,
    vehicleLength: row.vehicle_length,
    maxLoad: row.max_load,
    maxVolume: row.max_volume,
    color: row.color,
    drivingLicense: row.driving_license,
    roadTransportPermit: row.road_transport_permit,
    insuranceExpireDate: row.insurance_expire_date,
    annualInspectionDate: row.annual_inspection_date,
    authStatus: row.auth_status,
    fleetId: row.fleet_id,
    currentDriverId: row.current_driver_id,
    createdAt: row.created_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.put('/vehicles/:id', authMiddleware, roleMiddleware(['operator', 'admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { authStatus, fleetId, currentDriverId } = req.body;

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as any;
  if (!vehicle) {
    return res.error('车辆不存在', 404);
  }

  db.prepare(`
    UPDATE vehicles SET
      auth_status = ?, fleet_id = ?, current_driver_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    authStatus || vehicle.auth_status,
    fleetId || vehicle.fleet_id,
    currentDriverId || vehicle.current_driver_id,
    id
  );

  res.success({ id }, '更新成功');
});

export default router;
