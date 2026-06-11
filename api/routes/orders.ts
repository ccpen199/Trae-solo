import { Router, type Response } from 'express';
import db from '../db/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, page = 1, pageSize = 10 } = req.query;

  let sql = `
    SELECT
      c.*,
      u.username as owner_name,
      u.company_name as owner_company
    FROM cargo c
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }

  if (req.user?.role === 'owner') {
    sql += ' AND c.owner_id = ?';
    params.push(req.user.id);
  }

  const countSql = sql.replace('SELECT c.*, u.username as owner_name, u.company_name as owner_company', 'SELECT COUNT(*) as count');
  const total = (db.prepare(countSql).get(...params) as { count: number }).count;

  sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const rows = db.prepare(sql).all(...params) as any[];

  const list = rows.map(row => ({
    id: row.id,
    orderNo: row.order_no,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerCompany: row.owner_company,
    cargoName: row.cargo_name,
    cargoType: row.cargo_type,
    weight: row.weight,
    volume: row.volume,
    startCity: row.start_city,
    endCity: row.end_city,
    expectedPrice: row.expected_price,
    status: row.status,
    createdAt: row.created_at,
  }));

  res.page(list, total, Number(page), Number(pageSize), '获取成功');
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const cargoRow = db.prepare(`
    SELECT
      c.*,
      u.username as owner_name,
      u.company_name as owner_company,
      u.phone as owner_phone
    FROM cargo c
    LEFT JOIN users u ON c.owner_id = u.id
    WHERE c.id = ?
  `).get(id) as any;

  if (!cargoRow) {
    return res.error('订单不存在', 404);
  }

  const waybillRow = db.prepare(`
    SELECT
      w.*,
      d.name as driver_name,
      d.phone as driver_phone,
      v.plate_no,
      v.vehicle_type
    FROM waybills w
    LEFT JOIN drivers d ON w.driver_id = d.id
    LEFT JOIN vehicles v ON w.vehicle_id = v.id
    WHERE w.cargo_id = ?
    LIMIT 1
  `).get(id) as any;

  const order = {
    id: cargoRow.id,
    orderNo: cargoRow.order_no,
    owner: {
      id: cargoRow.owner_id,
      name: cargoRow.owner_name,
      company: cargoRow.owner_company,
      phone: cargoRow.owner_phone,
    },
    cargo: {
      name: cargoRow.cargo_name,
      type: cargoRow.cargo_type,
      weight: cargoRow.weight,
      volume: cargoRow.volume,
      quantity: cargoRow.quantity,
      packageType: cargoRow.package_type,
    },
    route: {
      startCity: cargoRow.start_city,
      endCity: cargoRow.end_city,
      startAddress: cargoRow.start_address,
      endAddress: cargoRow.end_address,
      pickupTime: cargoRow.pickup_time,
      deliveryTime: cargoRow.delivery_time,
    },
    requirements: {
      vehicle: cargoRow.vehicle_req ? JSON.parse(cargoRow.vehicle_req) : null,
      temperature: cargoRow.temperature_req ? JSON.parse(cargoRow.temperature_req) : null,
      insurance: cargoRow.insurance ? JSON.parse(cargoRow.insurance) : null,
    },
    expectedPrice: cargoRow.expected_price,
    status: cargoRow.status,
    waybill: waybillRow ? {
      id: waybillRow.id,
      waybillNo: waybillRow.waybill_no,
      actualPrice: waybillRow.actual_price,
      status: waybillRow.status,
      startTime: waybillRow.start_time,
      endTime: waybillRow.end_time,
      driver: {
        name: waybillRow.driver_name,
        phone: waybillRow.driver_phone,
      },
      vehicle: {
        plateNo: waybillRow.plate_no,
        type: waybillRow.vehicle_type,
      },
    } : null,
    createdAt: cargoRow.created_at,
  };

  res.success(order, '获取成功');
});

export default router;
