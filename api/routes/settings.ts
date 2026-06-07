import { Router, type Response } from 'express';
import db from '../db.js';
import { requireAuth, requireRole, getClientIp, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { DeviceHealth, FirmwareTask, AuditLog } from '../types.js';

const router = Router();

router.get('/health', requireAuth, (req: AuthRequest, res: Response): void => {
  const devices = db.prepare(`
    SELECT dh.id, dh.device_id, dh.cpu_usage, dh.temperature, dh.network_latency, dh.recorded_at,
           d.name as device_name, d.status
    FROM device_health dh
    JOIN devices d ON dh.device_id = d.id
    WHERE (dh.device_id, dh.recorded_at) IN (
      SELECT device_id, MAX(recorded_at) FROM device_health GROUP BY device_id
    )
    ORDER BY dh.recorded_at DESC
  `).all() as (DeviceHealth & { device_name: string; status: string })[];

  const withRand = devices.map(h => ({
    ...h,
    cpu_usage: Math.min(100, Math.max(0, h.cpu_usage + (Math.random() - 0.5) * 15)),
    temperature: Math.min(85, Math.max(20, h.temperature + (Math.random() - 0.5) * 6)),
    network_latency: Math.max(1, h.network_latency + Math.floor((Math.random() - 0.5) * 30)),
  }));

  res.json({ success: true, devices: withRand });
});

router.get('/firmware/tasks', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const tasks = db.prepare(`
    SELECT ft.*, u.name as created_by_name
    FROM firmware_tasks ft
    LEFT JOIN users u ON ft.created_by = u.id
    ORDER BY ft.created_at DESC
  `).all() as (FirmwareTask & { created_by_name: string })[];
  res.json({ success: true, tasks });
});

router.post('/firmware/tasks', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { deviceIds, version, fileUrl } = req.body;
    if (!deviceIds || !deviceIds.length || !version || !fileUrl) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }
    const info = db.prepare(`
      INSERT INTO firmware_tasks (version, file_url, status, total_devices, created_by)
      VALUES (?, ?, 'running', ?, ?)
    `).run(version, fileUrl, deviceIds.length, req.user?.id || 1);

    const taskId = info.lastInsertRowid as number;
    const insertDevice = db.prepare(`
      INSERT INTO firmware_task_devices (task_id, device_id, status)
      VALUES (?, ?, 'pending')
    `);
    for (const did of deviceIds) {
      insertDevice.run(taskId, did);
    }

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create_firmware_task',
        resourceType: 'firmware',
        resourceId: taskId,
        ipAddress: getClientIp(req),
        detail: `创建固件升级任务 v${version}，共 ${deviceIds.length} 台设备`,
      });
    }

    setTimeout(() => {
      db.prepare("UPDATE firmware_tasks SET status = 'completed', completed_devices = ?, updated_at = datetime('now') WHERE id = ?")
        .run(Math.max(1, deviceIds.length - Math.floor(Math.random() * 2)), taskId);
    }, 3000);

    res.json({ success: true, task: db.prepare('SELECT * FROM firmware_tasks WHERE id = ?').get(taskId) });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/audit', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const action = req.query.action as string;
  const userId = req.query.userId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];
  if (action && action !== 'all') {
    where += ' AND al.action = ?';
    params.push(action);
  }
  if (userId && userId !== 'all') {
    where += ' AND al.user_id = ?';
    params.push(parseInt(userId));
  }
  if (startDate) {
    where += ' AND al.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    where += ' AND al.created_at <= ?';
    params.push(endDate);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs al ${where}`).get(...params) as { count: number };
  const offset = (page - 1) * pageSize;
  const list = db.prepare(`
    SELECT al.*, u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as AuditLog[];

  res.json({ success: true, list, total: total.count });
});

export default router;
