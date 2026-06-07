import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, scopeToOwn, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { ObuDeviceResponse, ObuStatus } from '../types.js';

const router = Router();

router.get('/', authenticate, scopeToOwn('fleet_id', 'owner_id'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const status = req.query.status as string | undefined;
  const keyword = req.query.keyword as string | undefined;
  const fleetId = req.query.fleet_id as string | undefined;
  const ownerId = req.query.owner_id as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (status) {
    where += ' AND o.status = ?';
    params.push(status);
  }
  if (keyword) {
    where += ' AND (o.sn LIKE ? OR v.plate_number LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (fleetId) {
    where += ' AND v.fleet_id = ?';
    params.push(parseInt(fleetId));
  }
  if (ownerId) {
    where += ' AND v.owner_id = ?';
    params.push(parseInt(ownerId));
  }

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM obu_devices o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    ${where}
  `).get(...params) as { count: number };

  const list = db.prepare(`
    SELECT o.*,
           v.plate_number,
           v.vehicle_type
    FROM obu_devices o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as ObuDeviceResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/available', authenticate, (req: AuthRequest, res: Response): void => {
  const list = db.prepare(`
    SELECT o.id, o.sn
    FROM obu_devices o
    WHERE o.status = 'inventory' AND o.vehicle_id IS NULL
    ORDER BY o.sn
  `).all() as Array<{ id: number; sn: string }>;

  res.json({ success: true, data: list });
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const device = db.prepare(`
    SELECT o.*,
           v.plate_number,
           v.vehicle_type,
           v.vehicle_class,
           f.name as fleet_name
    FROM obu_devices o
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    LEFT JOIN fleets f ON v.fleet_id = f.id
    WHERE o.id = ?
  `).get(id) as (ObuDeviceResponse & { fleet_name?: string }) | undefined;

  if (!device) {
    res.status(404).json({ success: false, error: 'OBU设备不存在' });
    return;
  }

  res.json({ success: true, data: device });
});

router.post('/', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  try {
    const { sn, manufacturer, model, firmware_version } = req.body;

    if (!sn) {
      res.status(400).json({ success: false, error: '缺少设备序列号' });
      return;
    }

    const existing = db.prepare('SELECT id FROM obu_devices WHERE sn = ?').get(sn);
    if (existing) {
      res.status(400).json({ success: false, error: '设备序列号已存在' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO obu_devices (sn, manufacturer, model, firmware_version, status)
      VALUES (?, ?, ?, ?, 'inventory')
    `).run(sn, manufacturer || null, model || null, firmware_version || null);

    const deviceId = Number(info.lastInsertRowid);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'obu_device',
        resourceId: deviceId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `创建OBU设备: ${sn}`,
      });
    }

    const device = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(deviceId) as ObuDeviceResponse;
    res.json({ success: true, data: device });
  } catch (e: any) {
    console.error('[OBU Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id', authenticate, requireRoles('admin', 'operation', 'maintenance'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { sn, manufacturer, model, firmware_version, status, vehicle_id } = req.body;

    const existing = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'OBU设备不存在' });
      return;
    }

    let activatedAt = existing.activated_at;
    let deactivatedAt = existing.deactivated_at;

    if (status === 'activated' && existing.status !== 'activated') {
      activatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      deactivatedAt = null;
    } else if (status === 'deactivated' && existing.status === 'activated') {
      deactivatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    db.prepare(`
      UPDATE obu_devices
      SET sn = COALESCE(?, sn),
          manufacturer = COALESCE(?, manufacturer),
          model = COALESCE(?, model),
          firmware_version = COALESCE(?, firmware_version),
          status = COALESCE(?, status),
          vehicle_id = ?,
          activated_at = ?,
          deactivated_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(sn || null, manufacturer || null, model || null, firmware_version || null, status || null, vehicle_id ?? null, activatedAt, deactivatedAt, id);

    if (vehicle_id) {
      db.prepare('UPDATE vehicles SET obu_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(id, vehicle_id);
    } else if (existing.vehicle_id) {
      db.prepare('UPDATE vehicles SET obu_id = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(existing.vehicle_id);
    }

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: status === 'activated' ? 'activate' : status === 'deactivated' ? 'deactivate' : 'update',
        resourceType: 'obu_device',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `更新OBU设备: ${sn || existing.sn}, 状态: ${status || existing.status}`,
      });
    }

    const device = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(id) as ObuDeviceResponse;
    res.json({ success: true, data: device });
  } catch (e: any) {
    console.error('[OBU Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/:id', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const existing = db.prepare('SELECT * FROM obu_devices WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: 'OBU设备不存在' });
    return;
  }

  if (existing.status === 'activated' && existing.vehicle_id) {
    res.status(400).json({ success: false, error: '已激活的设备无法删除，请先停用' });
    return;
  }

  db.prepare('DELETE FROM obu_devices WHERE id = ?').run(id);

  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'obu_device',
      resourceId: id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `删除OBU设备: ${existing.sn}`,
    });
  }

  res.json({ success: true });
});

router.get('/options/statuses', authenticate, (req: AuthRequest, res: Response): void => {
  const statuses: ObuStatus[] = ['inventory', 'activated', 'deactivated', 'scrapped'];
  const options = statuses.map(s => ({
    value: s,
    label: s === 'inventory' ? '库存' : s === 'activated' ? '已激活' : s === 'deactivated' ? '已停用' : '已报废'
  }));
  res.json({ success: true, data: options });
});

export default router;
