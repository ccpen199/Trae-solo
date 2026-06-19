import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { authMiddleware, requireRoles } from '../middleware/auth';

const router = Router();

router.get('/usage', authMiddleware, requireRoles('operator', 'property'), (req: Request, res: Response): void => {
  const db = getDb();
  const { type, days } = req.query;
  const limitDays = parseInt(days as string) || 30;

  let typeCondition = '';
  const params: any[] = [limitDays];
  if (type) {
    typeCondition = 'AND o.type = ?';
    params.push(type);
  }

  const usageData = db.prepare(`
    SELECT
      d.id,
      d.name,
      d.type,
      a.name as areaName,
      COUNT(o.id) as useCount,
      COALESCE(SUM(o.duration), 0) as totalDuration,
      COALESCE(SUM(o.amount), 0) as totalRevenue
    FROM devices d
    LEFT JOIN areas a ON d.areaId = a.id
    LEFT JOIN orders o ON d.id = o.deviceId
      AND o.status = 'completed'
      AND o.startTime >= datetime('now', ? || ' days')
      ${typeCondition}
    GROUP BY d.id
    ORDER BY useCount DESC
  `).all(...params);

  res.json(usageData);
});

router.get('/funnel', authMiddleware, requireRoles('operator'), (req: Request, res: Response): void => {
  const db = getDb();
  const days = parseInt(req.query.days as string) || 30;

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

  const activeUsers = db.prepare(`
    SELECT COUNT(DISTINCT userId) as count
    FROM orders
    WHERE startTime >= datetime('now', ? || ' days')
  `).get(days) as { count: number };

  const orderUsers = db.prepare(`
    SELECT COUNT(DISTINCT userId) as count
    FROM orders
    WHERE status = 'completed'
      AND startTime >= datetime('now', ? || ' days')
  `).get(days) as { count: number };

  const repeatUsers = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT userId
      FROM orders
      WHERE status = 'completed'
        AND startTime >= datetime('now', ? || ' days')
      GROUP BY userId
      HAVING COUNT(*) >= 2
    )
  `).get(days) as { count: number };

  const totalOrders = db.prepare(`
    SELECT COUNT(*) as count
    FROM orders
    WHERE startTime >= datetime('now', ? || ' days')
  `).get(days) as { count: number };

  const completedOrders = db.prepare(`
    SELECT COUNT(*) as count
    FROM orders
    WHERE status = 'completed'
      AND startTime >= datetime('now', ? || ' days')
  `).get(days) as { count: number };

  const funnel = [
    { step: '注册用户', value: totalUsers.count, description: '平台累计注册用户数' },
    { step: '活跃用户', value: activeUsers.count, description: `${days}天内有下单行为的用户`, rate: totalUsers.count > 0 ? (activeUsers.count / totalUsers.count) * 100 : 0 },
    { step: '完成订单用户', value: orderUsers.count, description: `${days}天内完成订单的用户`, rate: activeUsers.count > 0 ? (orderUsers.count / activeUsers.count) * 100 : 0 },
    { step: '复购用户', value: repeatUsers.count, description: `${days}天内完成2单及以上的用户`, rate: orderUsers.count > 0 ? (repeatUsers.count / orderUsers.count) * 100 : 0 },
    { step: '创建订单', value: totalOrders.count, description: `${days}天内创建的订单总数` },
    { step: '完成订单', value: completedOrders.count, description: `${days}天内完成的订单数`, rate: totalOrders.count > 0 ? (completedOrders.count / totalOrders.count) * 100 : 0 },
  ];

  res.json(funnel);
});

router.get('/devices/heatmap', authMiddleware, (req: Request, res: Response): void => {
  const db = getDb();
  const days = parseInt(req.query.days as string) || 30;

  const heatmapData = db.prepare(`
    SELECT
      d.id,
      d.name,
      d.type,
      d.lat,
      d.lng,
      a.name as areaName,
      COUNT(o.id) as useCount,
      COALESCE(SUM(o.duration), 0) as totalDuration,
      d.status
    FROM devices d
    LEFT JOIN areas a ON d.areaId = a.id
    LEFT JOIN orders o ON d.id = o.deviceId
      AND o.status = 'completed'
      AND o.startTime >= datetime('now', ? || ' days')
    GROUP BY d.id
  `).all(days);

  res.json(heatmapData);
});

router.get('/revenue', authMiddleware, requireRoles('operator'), (req: Request, res: Response): void => {
  const db = getDb();
  const days = parseInt(req.query.days as string) || 30;

  const dailyRevenue = db.prepare(`
    SELECT
      date(startTime) as date,
      type,
      COUNT(*) as orderCount,
      COALESCE(SUM(amount), 0) as revenue,
      COALESCE(SUM(duration), 0) as totalDuration
    FROM orders
    WHERE status = 'completed'
      AND startTime >= datetime('now', ? || ' days')
    GROUP BY date(startTime), type
    ORDER BY date DESC
  `).all(days);

  const summary = db.prepare(`
    SELECT
      COUNT(*) as totalOrders,
      COALESCE(SUM(amount), 0) as totalRevenue,
      COALESCE(SUM(duration), 0) as totalDuration,
      COALESCE(SUM(CASE WHEN type = 'washer' THEN amount ELSE 0 END), 0) as washerRevenue,
      COALESCE(SUM(CASE WHEN type = 'water_dispenser' THEN amount ELSE 0 END), 0) as waterRevenue,
      COALESCE(SUM(CASE WHEN type = 'shower' THEN amount ELSE 0 END), 0) as showerRevenue
    FROM orders
    WHERE status = 'completed'
      AND startTime >= datetime('now', ? || ' days')
  `).get(days);

  res.json({
    summary,
    daily: dailyRevenue,
  });
});

export default router;
