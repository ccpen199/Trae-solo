import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, scopeToOwn, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { VehicleResponse, VehicleType, VehicleClass } from '../types.js';

const router = Router();

router.get('/', authenticate, scopeToOwn(), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const fleetId = req.query.fleet_id as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;
  const vehicleType = req.query.vehicle_type as string | undefined;
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
  if (vehicleType) {
    where += ' AND v.vehicle_type = ?';
    params.push(vehicleType);
  }
  if (keyword) {
    where += ' AND v.plate_number LIKE ?';
    params.push(`%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM vehicles v ${where}`).get(...params) as { count: number };
  const list = db.prepare(`
    SELECT v.*,
           f.name as fleet_name,
           u.name as owner_name,
           o.sn as obu_sn
    FROM vehicles v
    LEFT JOIN fleets f ON v.fleet_id = f.id
    LEFT JOIN users u ON v.owner_id = u.id
    LEFT JOIN obu_devices o ON v.obu_id = o.id
    ${where}
    ORDER BY v.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as VehicleResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/:id', authenticate, scopeToOwn(), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const vehicle = db.prepare(`
    SELECT v.*,
           f.name as fleet_name,
           u.name as owner_name,
           o.sn as obu_sn,
           o.status as obu_status
    FROM vehicles v
    LEFT JOIN fleets f ON v.fleet_id = f.id
    LEFT JOIN users u ON v.owner_id = u.id
    LEFT JOIN obu_devices o ON v.obu_id = o.id
    WHERE v.id = ?
  `).get(id) as (VehicleResponse & { obu_status?: string }) | undefined;

  if (!vehicle) {
    res.status(404).json({ success: false, error: '车辆不存在' });
    return;
  }

  res.json({ success: true, data: vehicle });
});

router.post('/', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { plate_number, vehicle_type, vehicle_class, brand, model, color, register_date, fleet_id, owner_id } = req.body;

    if (!plate_number || !vehicle_type || !vehicle_class) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }

    const existing = db.prepare('SELECT id FROM vehicles WHERE plate_number = ?').get(plate_number);
    if (existing) {
      res.status(400).json({ success: false, error: '车牌号已存在' });
      return;
    }

    let actualFleetId = fleet_id;
    if (req.user?.role === 'fleet_admin' && req.user.fleet_id) {
      actualFleetId = req.user.fleet_id;
    }

    const info = db.prepare(`
      INSERT INTO vehicles (plate_number, vehicle_type, vehicle_class, brand, model, color, register_date, fleet_id, owner_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(plate_number, vehicle_type, vehicle_class, brand || null, model || null, color || null, register_date || null, actualFleetId || null, owner_id || null);

    const vehicleId = Number(info.lastInsertRowid);

    db.prepare('UPDATE fleets SET vehicle_count = (SELECT COUNT(*) FROM vehicles WHERE fleet_id = fleets.id), updated_at = datetime(\'now\') WHERE id = ? OR id = ?').run(actualFleetId || 0, fleet_id || 0);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'vehicle',
        resourceId: vehicleId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `创建车辆: ${plate_number}`,
      });
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId) as VehicleResponse;
    res.json({ success: true, data: vehicle });
  } catch (e: any) {
    console.error('[Vehicle Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { plate_number, vehicle_type, vehicle_class, brand, model, color, register_date, fleet_id, owner_id, obu_id } = req.body;

    const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '车辆不存在' });
      return;
    }

    let actualFleetId = fleet_id;
    if (req.user?.role === 'fleet_admin' && req.user.fleet_id) {
      actualFleetId = req.user.fleet_id;
    }

    db.prepare(`
      UPDATE vehicles
      SET plate_number = COALESCE(?, plate_number),
          vehicle_type = COALESCE(?, vehicle_type),
          vehicle_class = COALESCE(?, vehicle_class),
          brand = COALESCE(?, brand),
          model = COALESCE(?, model),
          color = COALESCE(?, color),
          register_date = COALESCE(?, register_date),
          fleet_id = ?,
          owner_id = ?,
          obu_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(plate_number || null, vehicle_type || null, vehicle_class || null, brand || null, model || null, color || null, register_date || null, actualFleetId ?? null, owner_id ?? null, obu_id ?? null, id);

    db.prepare('UPDATE fleets SET vehicle_count = (SELECT COUNT(*) FROM vehicles WHERE fleet_id = fleets.id), updated_at = datetime(\'now\') WHERE id IN (?, ?)').run(existing.fleet_id || 0, actualFleetId || 0);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'vehicle',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `更新车辆: ${plate_number || existing.plate_number}`,
      });
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as VehicleResponse;
    res.json({ success: true, data: vehicle });
  } catch (e: any) {
    console.error('[Vehicle Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/:id', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const existing = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: '车辆不存在' });
    return;
  }

  db.prepare('UPDATE obu_devices SET vehicle_id = NULL, status = \'inventory\', deactivated_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE vehicle_id = ?').run(id);
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
  db.prepare('UPDATE fleets SET vehicle_count = (SELECT COUNT(*) FROM vehicles WHERE fleet_id = fleets.id), updated_at = datetime(\'now\') WHERE id = ?').run(existing.fleet_id || 0);

  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'vehicle',
      resourceId: id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `删除车辆: ${existing.plate_number}`,
    });
  }

  res.json({ success: true });
});

router.get('/options/types', authenticate, (req: AuthRequest, res: Response): void => {
  const types: VehicleType[] = ['passenger', 'truck'];
  const options = types.map(t => ({ value: t, label: t === 'passenger' ? '客车' : '货车' }));
  res.json({ success: true, data: options });
});

router.get('/options/classes', authenticate, (req: AuthRequest, res: Response): void => {
  const classes: VehicleClass[] = ['1', '2', '3', '4', '5', '6'];
  const options = classes.map(c => ({ value: c, label: `${c}类车` }));
  res.json({ success: true, data: options });
});

export default router;
