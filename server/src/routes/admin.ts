import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authMiddleware, requireRoles } from '../middleware/auth';
import { Area, Package as PackageType, User, DeviceType } from '../types';
import {
  pageResult,
  parsePage,
  serializeArea,
  serializePackage,
  toDbDeviceType,
} from '../serializers';

const router = Router();

router.get('/areas', authMiddleware, requireRoles('operator', 'property'), (req: Request, res: Response): void => {
  const { page, pageSize } = parsePage(req);
  const db = getDb();
  const areas = db.prepare(`
    SELECT a.*, u.nickname as managerName, COUNT(d.id) as deviceCount
    FROM areas a
    LEFT JOIN users u ON a.propertyManagerId = u.id
    LEFT JOIN devices d ON d.areaId = a.id
    GROUP BY a.id
    ORDER BY a.name ASC
  `).all().map(serializeArea);

  res.json(pageResult(areas, page, pageSize, areas.length));
});

router.post('/areas', authMiddleware, requireRoles('operator'), (req: Request, res: Response): void => {
  const { name, address, lat, lng, propertyManagerId, managerId } = req.body;

  if (!name && !address) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const db = getDb();
  const id = uuidv4();
  const areaName = name || address;

  db.prepare(`
    INSERT INTO areas (id, name, lat, lng, propertyManagerId)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, areaName, lat ?? 39.9042, lng ?? 116.4074, propertyManagerId || managerId || null);

  const area = db.prepare(`
    SELECT a.*, u.nickname as managerName, 0 as deviceCount
    FROM areas a
    LEFT JOIN users u ON a.propertyManagerId = u.id
    WHERE a.id = ?
  `).get(id);

  res.status(201).json(serializeArea(area));
});

router.get('/packages', authMiddleware, (req: Request, res: Response): void => {
  const { page, pageSize } = parsePage(req);
  const db = getDb();
  const deviceType = toDbDeviceType(req.query.deviceType || req.query.type);

  let sql = 'SELECT * FROM packages WHERE 1=1';
  const params: any[] = [];

  if (deviceType) {
    sql += ' AND deviceType = ?';
    params.push(deviceType);
  }

  sql += ' ORDER BY deviceType, price ASC';
  const packages = (db.prepare(sql).all(...params) as PackageType[]).map(serializePackage);

  res.json(pageResult(packages, page, pageSize, packages.length));
});

router.post('/packages', authMiddleware, requireRoles('operator'), (req: Request, res: Response): void => {
  const { name, price, description } = req.body;
  const deviceType = toDbDeviceType(req.body.deviceType || req.body.type);
  const totalMinutes = req.body.totalMinutes ?? req.body.durationMinutes;

  if (!name || !deviceType || !totalMinutes || price == null || !description) {
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

  db.prepare(`
    INSERT INTO packages (id, name, deviceType, totalMinutes, price, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, deviceType, totalMinutes, price, description);

  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(id) as PackageType;
  res.status(201).json(serializePackage(pkg));
});

function updatePackage(req: Request, res: Response): void {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as PackageType | undefined;

  if (!existing) {
    res.status(404).json({ error: '套餐不存在' });
    return;
  }

  const { name, price, description } = req.body;
  const deviceType = toDbDeviceType(req.body.deviceType || req.body.type);
  const totalMinutes = req.body.totalMinutes ?? req.body.durationMinutes;

  db.prepare(`
    UPDATE packages SET
      name = COALESCE(?, name),
      deviceType = COALESCE(?, deviceType),
      totalMinutes = COALESCE(?, totalMinutes),
      price = COALESCE(?, price),
      description = COALESCE(?, description)
    WHERE id = ?
  `).run(name, deviceType, totalMinutes, price, description, req.params.id);

  const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as PackageType;
  res.json(serializePackage(updated));
}

router.put('/packages/:id', authMiddleware, requireRoles('operator'), updatePackage);
router.patch('/packages/:id', authMiddleware, requireRoles('operator'), updatePackage);

router.get('/users', authMiddleware, requireRoles('operator', 'property'), (req: Request, res: Response): void => {
  const { page, pageSize } = parsePage(req);
  const db = getDb();
  const { role, keyword } = req.query;

  let sql = `
    SELECT u.id, u.phone, u.nickname, u.avatar, u.role, u.balance, u.createdAt,
           (SELECT COUNT(*) FROM orders o WHERE o.userId = u.id) as orderCount,
           (SELECT COALESCE(SUM(points), 0) FROM rewardRecords r WHERE r.userId = u.id) as totalPoints
    FROM users u
    WHERE 1=1
  `;
  const params: any[] = [];

  if (role) {
    sql += ' AND u.role = ?';
    params.push(role);
  }
  if (keyword) {
    sql += ' AND (u.phone LIKE ? OR u.nickname LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY u.createdAt DESC LIMIT 100';
  const users = db.prepare(sql).all(...params);

  res.json(pageResult(users, page, pageSize, users.length));
});

router.get('/workorders/summary', authMiddleware, requireRoles('operator', 'property'), (req: Request, res: Response): void => {
  const db = getDb();

  const total = db.prepare('SELECT COUNT(*) as count FROM workorders').get() as { count: number };
  const pending = db.prepare("SELECT COUNT(*) as count FROM workorders WHERE status = 'pending'").get() as { count: number };
  const assigned = db.prepare("SELECT COUNT(*) as count FROM workorders WHERE status = 'assigned'").get() as { count: number };
  const processing = db.prepare("SELECT COUNT(*) as count FROM workorders WHERE status = 'processing'").get() as { count: number };
  const resolved = db.prepare("SELECT COUNT(*) as count FROM workorders WHERE status = 'resolved' OR status = 'closed'").get() as { count: number };

  const byType = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM workorders
    GROUP BY type
  `).all();

  const byPriorityRows = db.prepare(`
    SELECT priority, COUNT(*) as count
    FROM workorders
    GROUP BY priority
  `).all();

  const recent = db.prepare(`
    SELECT w.*, d.name as deviceName, u.nickname as reporterName
    FROM workorders w
    LEFT JOIN devices d ON w.deviceId = d.id
    LEFT JOIN users u ON w.reporterId = u.id
    ORDER BY w.createdAt DESC
    LIMIT 10
  `).all();

  const byPriority = (byPriorityRows as { priority: string; count: number }[]).reduce<Record<string, number>>((acc, row) => {
    acc[row.priority] = row.count;
    return acc;
  }, {});

  res.json({
    total: total.count,
    open: pending.count + assigned.count,
    inProgress: processing.count,
    resolved: resolved.count,
    pending: pending.count,
    assigned: assigned.count,
    processing: processing.count,
    byType,
    byPriority,
    recent,
  });
});

export default router;
