import { Router, type Response } from 'express';
import db from '../db.js';
import { requireAuth, getClientIp, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { Alert, AlertRule } from '../types.js';

const router = Router();

router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const level = req.query.level as string;
  const type = req.query.type as string;
  const deviceId = req.query.deviceId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (level && level !== 'all') {
    where += ' AND a.level = ?';
    params.push(level);
  }
  if (type && type !== 'all') {
    where += ' AND a.type = ?';
    params.push(type);
  }
  if (deviceId && deviceId !== 'all') {
    where += ' AND a.device_id = ?';
    params.push(parseInt(deviceId));
  }
  if (startDate) {
    where += ' AND a.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    where += ' AND a.created_at <= ?';
    params.push(endDate);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM alerts a ${where}`).get(...params) as { count: number };
  const offset = (page - 1) * pageSize;
  const list = db.prepare(`
    SELECT a.*, d.name as device_name
    FROM alerts a
    LEFT JOIN devices d ON a.device_id = d.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as Alert[];

  res.json({ success: true, list, total: total.count });
});

router.put('/:id/acknowledge', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ success: false, error: '告警不存在' });
    return;
  }
  db.prepare(`
    UPDATE alerts SET status = 'acknowledged', acked_by = ?, acked_at = datetime('now')
    WHERE id = ?
  `).run(req.user?.id || null, id);

  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'acknowledge',
      resourceType: 'alert',
      resourceId: id,
      ipAddress: getClientIp(req),
      detail: '确认告警',
    });
  }
  res.json({ success: true, alert: db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) });
});

router.get('/rules', requireAuth, (req: AuthRequest, res: Response): void => {
  const rules = db.prepare('SELECT * FROM alert_rules ORDER BY created_at DESC').all() as AlertRule[];
  res.json({ success: true, rules });
});

router.post('/rules', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { name, deviceId, type, sensitivity, schedule, notification } = req.body;
    if (!name || !type) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }
    const info = db.prepare(`
      INSERT INTO alert_rules (name, device_id, type, sensitivity, schedule, notification)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, deviceId || null, type, sensitivity || 50, JSON.stringify(schedule || {}), JSON.stringify(notification || {}));

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'alert_rule',
        resourceId: info.lastInsertRowid as number,
        ipAddress: getClientIp(req),
        detail: `创建告警规则: ${name}`,
      });
    }
    res.json({ success: true, rule: db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(info.lastInsertRowid) });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/rules/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { name, type, sensitivity, schedule, notification, enabled } = req.body;
    const existing = db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '规则不存在' });
      return;
    }
    db.prepare(`
      UPDATE alert_rules
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          sensitivity = COALESCE(?, sensitivity),
          schedule = COALESCE(?, schedule),
          notification = COALESCE(?, notification),
          enabled = COALESCE(?, enabled),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || null,
      type || null,
      sensitivity || null,
      schedule ? JSON.stringify(schedule) : null,
      notification ? JSON.stringify(notification) : null,
      enabled ?? null,
      id
    );

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'alert_rule',
        resourceId: id,
        ipAddress: getClientIp(req),
        detail: `更新告警规则: ${name || existing.name}`,
      });
    }
    res.json({ success: true, rule: db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(id) });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/rules/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: '规则不存在' });
    return;
  }
  db.prepare('DELETE FROM alert_rules WHERE id = ?').run(id);
  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'alert_rule',
      resourceId: id,
      ipAddress: getClientIp(req),
      detail: `删除告警规则: ${existing.name}`,
    });
  }
  res.json({ success: true });
});

router.get('/stats/overview', requireAuth, (req: AuthRequest, res: Response): void => {
  const onlineCount = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online'").get() as { count: number };
  const offlineCount = db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'offline'").get() as { count: number };
  const pendingAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'pending'").get() as { count: number };
  const todayAlerts = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE date(created_at) = date('now')").get() as { count: number };

  const days = [];
  for (let i = 6; i >= 0; i--) {
    days.push(`date('now', '-${i} days')`);
  }
  const alertTrend = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM alerts
    WHERE created_at >= date('now', '-6 days')
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `).all() as { date: string; count: number }[];

  const fullTrend = days.map((dExpr, i) => {
    const date = db.prepare(`SELECT ${dExpr} as d`).get() as { d: string };
    const found = alertTrend.find(a => a.date === date.d);
    return { date: date.d, count: found?.count || 0 };
  });

  res.json({
    success: true,
    onlineCount: onlineCount.count,
    offlineCount: offlineCount.count,
    pendingAlerts: pendingAlerts.count,
    todayAlerts: todayAlerts.count,
    alertTrend: fullTrend,
    storageUsage: 62.8,
  });
});

export default router;
