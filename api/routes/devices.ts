import { Router, type Response } from 'express';
import db from '../db.js';
import { requireAuth, getClientIp, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { Device } from '../types.js';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const keyword = req.query.keyword as string;
  const orgId = req.query.orgId as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (status && status !== 'all') {
    where += ' AND d.status = ?';
    params.push(status);
  }
  if (keyword) {
    where += ' AND (d.name LIKE ? OR d.device_id LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (orgId && orgId !== 'all') {
    where += ' AND d.org_id = ?';
    params.push(parseInt(orgId));
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM devices d ${where}`).get(...params) as { count: number };
  const offset = (page - 1) * pageSize;
  const list = db.prepare(`
    SELECT d.*, o.name as org_name
    FROM devices d
    LEFT JOIN organizations o ON d.org_id = o.id
    ${where}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as Device[];

  res.json({ success: true, list, total: total.count });
});

router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const device = db.prepare(`
    SELECT d.*, o.name as org_name
    FROM devices d
    LEFT JOIN organizations o ON d.org_id = o.id
    WHERE d.id = ?
  `).get(id) as Device;
  if (!device) {
    res.status(404).json({ success: false, error: '设备不存在' });
    return;
  }
  res.json({ success: true, device });
});

router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { name, deviceId, secret, protocol, orgId, ip, port } = req.body;
    if (!name || !deviceId || !secret || !protocol) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }
    const existing = db.prepare('SELECT id FROM devices WHERE device_id = ?').get(deviceId);
    if (existing) {
      res.status(400).json({ success: false, error: '设备ID已存在' });
      return;
    }
    const info = db.prepare(`
      INSERT INTO devices (device_id, name, protocol, ip, port, status, p2p_status, org_id, secret, firmware_version)
      VALUES (?, ?, ?, ?, ?, 'online', 'connected', ?, ?, 'v2.5.8')
    `).run(deviceId, name, protocol, ip || null, port || null, orgId || null, secret);

    db.prepare(`
      INSERT INTO device_health (device_id, cpu_usage, temperature, network_latency)
      VALUES (?, 25.5, 42.3, 12)
    `).run(info.lastInsertRowid);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'device',
        resourceId: info.lastInsertRowid as number,
        ipAddress: getClientIp(req),
        detail: `添加设备: ${name} (${deviceId})`,
      });
    }
    res.json({ success: true, device: db.prepare('SELECT * FROM devices WHERE id = ?').get(info.lastInsertRowid) });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { name, orgId, status } = req.body;
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '设备不存在' });
      return;
    }
    db.prepare(`
      UPDATE devices SET name = COALESCE(?, name), org_id = ?, status = COALESCE(?, status), updated_at = datetime('now')
      WHERE id = ?
    `).run(name || null, orgId || null, status || null, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'device',
        resourceId: id,
        ipAddress: getClientIp(req),
        detail: `更新设备: ${name || existing.name}`,
      });
    }
    res.json({ success: true, device: db.prepare('SELECT * FROM devices WHERE id = ?').get(id) });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: '设备不存在' });
    return;
  }
  db.prepare('DELETE FROM devices WHERE id = ?').run(id);
  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'device',
      resourceId: id,
      ipAddress: getClientIp(req),
      detail: `删除设备: ${existing.name} (${existing.device_id})`,
    });
  }
  res.json({ success: true });
});

router.get('/:id/health', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const health = db.prepare('SELECT * FROM device_health WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1').get(id) as any;
  if (!health) {
    res.json({ success: true, cpu: 0, temperature: 0, networkLatency: 0, uptime: 0 });
    return;
  }
  res.json({
    success: true,
    cpu: health.cpu_usage + Math.random() * 10,
    temperature: health.temperature + Math.random() * 5,
    networkLatency: health.network_latency + Math.floor(Math.random() * 20),
    uptime: 3600 * 24 * 5,
  });
});

router.post('/:id/ptz', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const { action, speed } = req.body;
  if (!action) {
    res.status(400).json({ success: false, error: '缺少操作参数' });
    return;
  }
  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'ptz_control',
      resourceType: 'device',
      resourceId: id,
      ipAddress: getClientIp(req),
      detail: `云台控制: ${action}, 速度: ${speed || 50}`,
    });
  }
  res.json({ success: true, action, speed: speed || 50 });
});

export default router;
