import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, scopeToOwn, type AuthRequest } from '../middleware.js';
import type { TollRecordResponse, TollTrace } from '../types.js';

const router = Router();

router.get('/records', authenticate, scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const fleetId = req.query.fleet_id as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  const vehicleId = req.query.vehicle_id as string | undefined;
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (fleetId) {
    where += ' AND v.fleet_id = ?';
    params.push(parseInt(fleetId));
  }
  if (ownerId) {
    where += ' AND v.owner_id = ?';
    params.push(parseInt(ownerId));
  }
  if (vehicleId) {
    where += ' AND t.vehicle_id = ?';
    params.push(parseInt(vehicleId));
  }
  if (startDate) {
    where += ' AND t.created_at >= ?';
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    where += ' AND t.created_at <= ?';
    params.push(`${endDate} 23:59:59`);
  }
  if (keyword) {
    where += ' AND (v.plate_number LIKE ? OR t.record_no LIKE ? OR t.toll_station LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM toll_records t
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    ${where}
  `).get(...params) as { count: number };

  const list = db.prepare(`
    SELECT t.*,
           v.plate_number,
           o.sn as obu_sn
    FROM toll_records t
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    INNER JOIN obu_devices o ON t.obu_id = o.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as TollRecordResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/records/:id', authenticate, scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const record = db.prepare(`
    SELECT t.*,
           v.plate_number,
           v.vehicle_type,
           v.vehicle_class,
           o.sn as obu_sn,
           f.name as fleet_name
    FROM toll_records t
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    INNER JOIN obu_devices o ON t.obu_id = o.id
    LEFT JOIN fleets f ON v.fleet_id = f.id
    WHERE t.id = ?
  `).get(id) as TollRecordResponse | undefined;

  if (!record) {
    res.status(404).json({ success: false, error: '通行记录不存在' });
    return;
  }

  res.json({ success: true, data: record });
});

router.get('/records/:id/traces', authenticate, (req: AuthRequest, res: Response): void => {
  const recordId = parseInt(req.params.id);

  const traces = db.prepare(`
    SELECT * FROM toll_traces
    WHERE toll_record_id = ?
    ORDER BY recorded_at ASC
  `).all(recordId) as TollTrace[];

  res.json({ success: true, data: traces });
});

router.get('/records/export', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const fleetId = req.query.fleet_id as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (fleetId) {
    where += ' AND v.fleet_id = ?';
    params.push(parseInt(fleetId));
  }
  if (ownerId) {
    where += ' AND v.owner_id = ?';
    params.push(parseInt(ownerId));
  }
  if (startDate) {
    where += ' AND t.created_at >= ?';
    params.push(`${startDate} 00:00:00`);
  }
  if (endDate) {
    where += ' AND t.created_at <= ?';
    params.push(`${endDate} 23:59:59`);
  }

  const records = db.prepare(`
    SELECT t.record_no, v.plate_number, t.toll_station, t.entry_station, t.exit_station,
           t.entry_time, t.exit_time, t.mileage, t.base_fee, t.bridge_fee, t.tunnel_fee,
           t.surcharge, t.discount, t.paid_amount, t.created_at
    FROM toll_records t
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT 5000
  `).all(...params);

  res.json({ success: true, data: records });
});

router.get('/summary', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const fleetId = req.query.fleet_id as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  const period = req.query.period as string || '30d';

  let dateFilter = "datetime('now', '-30 days')";
  if (period === '7d') dateFilter = "datetime('now', '-7 days')";
  else if (period === '90d') dateFilter = "datetime('now', '-90 days')";

  let where = 'AND t.created_at >= ' + dateFilter;
  const params: number[] = [];

  if (fleetId) {
    where += ' AND v.fleet_id = ?';
    params.push(parseInt(fleetId));
  }
  if (ownerId) {
    where += ' AND v.owner_id = ?';
    params.push(parseInt(ownerId));
  }

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_trips,
      COALESCE(SUM(t.mileage), 0) as total_mileage,
      COALESCE(SUM(t.base_fee), 0) as total_base_fee,
      COALESCE(SUM(t.bridge_fee), 0) as total_bridge_fee,
      COALESCE(SUM(t.tunnel_fee), 0) as total_tunnel_fee,
      COALESCE(SUM(t.surcharge), 0) as total_surcharge,
      COALESCE(SUM(t.discount), 0) as total_discount,
      COALESCE(SUM(t.paid_amount), 0) as total_paid
    FROM toll_records t
    INNER JOIN vehicles v ON t.vehicle_id = v.id
    WHERE 1=1 ${where}
  `).get(...params);

  res.json({ success: true, data: summary });
});

export default router;
