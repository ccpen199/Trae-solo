import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, requireRoles, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { Fleet } from '../types.js';

const router = Router();

router.get('/', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: string[] = [];

  if (req.user?.role === 'fleet_admin' && req.user.fleet_id) {
    where += ' AND f.id = ?';
    params.push(String(req.user.fleet_id));
  }

  if (keyword) {
    where += ' AND (f.name LIKE ? OR f.code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM fleets f ${where}`).get(...params) as { count: number };
  const list = db.prepare(`
    SELECT f.*,
           (SELECT COUNT(*) FROM vehicles WHERE fleet_id = f.id) as vehicle_count
    FROM fleets f
    ${where}
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as Fleet[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/all', authenticate, (req: AuthRequest, res: Response): void => {
  let where = 'WHERE 1=1';
  const params: string[] = [];

  if (req.user?.role === 'fleet_admin' && req.user.fleet_id) {
    where += ' AND f.id = ?';
    params.push(String(req.user.fleet_id));
  }

  const list = db.prepare(`
    SELECT f.id, f.name, f.code
    FROM fleets f
    ${where}
    ORDER BY f.name
  `).all(...params) as Array<{ id: number; name: string; code: string }>;

  res.json({ success: true, data: list });
});

router.get('/:id', authenticate, requireRoles('admin', 'operation', 'fleet_admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  if (req.user?.role === 'fleet_admin' && req.user.fleet_id !== id) {
    res.status(403).json({ success: false, error: '无权限访问该车行' });
    return;
  }

  const fleet = db.prepare(`
    SELECT f.*,
           (SELECT COUNT(*) FROM vehicles WHERE fleet_id = f.id) as vehicle_count
    FROM fleets f
    WHERE f.id = ?
  `).get(id) as Fleet | undefined;

  if (!fleet) {
    res.status(404).json({ success: false, error: '车队不存在' });
    return;
  }

  res.json({ success: true, data: fleet });
});

router.post('/', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const { name, code, contact_person, contact_phone, address } = req.body;

    if (!name || !code) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }

    const existing = db.prepare('SELECT id FROM fleets WHERE code = ?').get(code);
    if (existing) {
      res.status(400).json({ success: false, error: '车队编号已存在' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO fleets (name, code, contact_person, contact_phone, address, vehicle_count)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(name, code, contact_person || null, contact_phone || null, address || null);

    const fleetId = Number(info.lastInsertRowid);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'fleet',
        resourceId: fleetId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `创建车队: ${name} (${code})`,
      });
    }

    const fleet = db.prepare('SELECT * FROM fleets WHERE id = ?').get(fleetId) as Fleet;
    res.json({ success: true, data: fleet });
  } catch (e: any) {
    console.error('[Fleet Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, contact_person, contact_phone, address } = req.body;

    const existing = db.prepare('SELECT * FROM fleets WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '车队不存在' });
      return;
    }

    db.prepare(`
      UPDATE fleets
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          contact_person = COALESCE(?, contact_person),
          contact_phone = COALESCE(?, contact_phone),
          address = COALESCE(?, address),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name || null, code || null, contact_person || null, contact_phone || null, address || null, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'fleet',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `更新车队: ${name || existing.name}`,
      });
    }

    const fleet = db.prepare('SELECT * FROM fleets WHERE id = ?').get(id) as Fleet;
    res.json({ success: true, data: fleet });
  } catch (e: any) {
    console.error('[Fleet Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/:id', authenticate, requireRoles('admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  const existing = db.prepare('SELECT * FROM fleets WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: '车队不存在' });
    return;
  }

  const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE fleet_id = ?').get(id) as { count: number };
  if (vehicleCount.count > 0) {
    res.status(400).json({ success: false, error: '该车行下还有车辆，无法删除' });
    return;
  }

  db.prepare('DELETE FROM fleets WHERE id = ?').run(id);

  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'fleet',
      resourceId: id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `删除车队: ${existing.name}`,
    });
  }

  res.json({ success: true });
});

export default router;
