import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { Device, DeviceCommand, DeviceStatus, DeviceType, CommandStatus } from '../types';
import {
  pageResult,
  parsePage,
  serializeDevice,
  serializeDeviceStatus,
  toDbDeviceStatus,
  toDbDeviceType,
} from '../serializers';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const { type, area, areaId, status } = req.query;
  const { page, pageSize } = parsePage(req);
  const db = getDb();

  let sql = 'SELECT * FROM devices WHERE 1=1';
  const params: any[] = [];
  const dbType = toDbDeviceType(type);
  const dbStatus = toDbDeviceStatus(status);

  if (dbType) {
    sql += ' AND type = ?';
    params.push(dbType);
  }
  if (area || areaId) {
    sql += ' AND areaId = ?';
    params.push(area || areaId);
  }
  if (dbStatus) {
    sql += ' AND status = ?';
    params.push(dbStatus);
  }

  sql += ' ORDER BY name ASC';
  const devices = (db.prepare(sql).all(...params) as Device[]).map(serializeDevice);

  res.json(pageResult(devices, page, pageSize, devices.length));
});

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const db = getDb();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device | undefined;

  if (!device) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  res.json(serializeDevice(device));
});

router.get('/:id/status', authMiddleware, (req: Request, res: Response): void => {
  const db = getDb();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device | undefined;

  if (!device) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  res.json(serializeDeviceStatus(device));
});

router.post('/', authMiddleware, requireRoles('operator'), (req: Request, res: Response): void => {
  const { name, type, location, lat, lng, areaId, pricing } = req.body;
  const deviceType = toDbDeviceType(type);

  if (!name || !deviceType || !location || lat == null || lng == null || !areaId || pricing == null) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const validTypes: DeviceType[] = ['washer', 'water_dispenser', 'shower'];
  if (!validTypes.includes(deviceType as DeviceType)) {
    res.status(400).json({ error: '无效的设备类型' });
    return;
  }

  const db = getDb();
  const id = uuidv4();
  const status: DeviceStatus = 'idle';
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO devices (id, name, type, status, location, lat, lng, areaId, pricing, lastHeartbeat, isOnline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, name, deviceType, status, location, lat, lng, areaId, pricing, now);

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as Device;
  res.status(201).json(serializeDevice(device));
});

router.put('/:id', authMiddleware, requireRoles('operator', 'property'), (req: Request, res: Response): void => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device | undefined;

  if (!existing) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  const { name, type, location, lat, lng, areaId, pricing, status } = req.body;
  const deviceType = toDbDeviceType(type);
  const deviceStatus = toDbDeviceStatus(status);

  db.prepare(`
    UPDATE devices SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      location = COALESCE(?, location),
      lat = COALESCE(?, lat),
      lng = COALESCE(?, lng),
      areaId = COALESCE(?, areaId),
      pricing = COALESCE(?, pricing),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(name, deviceType, location, lat, lng, areaId, pricing, deviceStatus, req.params.id);

  const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device;
  res.json(serializeDevice(updated));
});

router.put('/:id/status', authMiddleware, (req: Request, res: Response): void => {
  const status = toDbDeviceStatus(req.body.status);

  if (!status) {
    res.status(400).json({ error: '状态不能为空' });
    return;
  }

  const validStatuses: DeviceStatus[] = ['idle', 'running', 'fault', 'offline', 'reserved'];
  if (!validStatuses.includes(status as DeviceStatus)) {
    res.status(400).json({ error: '无效的设备状态' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device | undefined;

  if (!existing) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  db.prepare('UPDATE devices SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device;
  res.json(serializeDevice(updated));
});

router.post('/:id/command', authMiddleware, (req: Request, res: Response): void => {
  const { command, params } = req.body;

  if (!command) {
    res.status(400).json({ error: '指令不能为空' });
    return;
  }

  const db = getDb();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device | undefined;

  if (!device) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  const status: CommandStatus = 'pending';
  const paramsStr = typeof params === 'string' ? params : JSON.stringify(params || {});

  db.prepare(`
    INSERT INTO deviceCommands (id, deviceId, command, params, status, createdAt, syncedAt)
    VALUES (?, ?, ?, ?, ?, ?, NULL)
  `).run(id, req.params.id, command, paramsStr, status, now);

  const cmd = db.prepare('SELECT * FROM deviceCommands WHERE id = ?').get(id) as DeviceCommand;
  res.status(201).json(cmd);
});

router.get('/:id/commands', authMiddleware, (req: Request, res: Response): void => {
  const db = getDb();
  const commands = db.prepare(`
    SELECT * FROM deviceCommands
    WHERE deviceId = ?
    ORDER BY createdAt DESC
    LIMIT 50
  `).all(req.params.id) as DeviceCommand[];

  res.json(commands);
});

router.put('/commands/:id/sync', authMiddleware, (req: Request, res: Response): void => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM deviceCommands WHERE id = ?').get(req.params.id) as DeviceCommand | undefined;

  if (!existing) {
    res.status(404).json({ error: '指令不存在' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE deviceCommands SET status = 'synced', syncedAt = ? WHERE id = ?
  `).run(now, req.params.id);

  const updated = db.prepare('SELECT * FROM deviceCommands WHERE id = ?').get(req.params.id) as DeviceCommand;
  res.json(updated);
});

router.post('/:id/heartbeat', (req: Request, res: Response): void => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id) as Device | undefined;

  if (!existing) {
    res.status(404).json({ error: '设备不存在' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE devices SET lastHeartbeat = ?, isOnline = 1 WHERE id = ?
  `).run(now, req.params.id);

  res.json({ success: true, timestamp: now });
});

export default router;
