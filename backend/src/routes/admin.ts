import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/stats', (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  let totalDevices: number;
  let onlineDevices: number;

  if (userRole === 'admin') {
    totalDevices = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
    onlineDevices = db.prepare('SELECT COUNT(*) as count FROM devices WHERE online = 1').get().count;
  } else {
    totalDevices = db.prepare(`
      SELECT COUNT(DISTINCT d.id) as count FROM devices d
      LEFT JOIN device_permissions dp ON d.id = dp.device_id AND dp.user_id = ?
      WHERE dp.id IS NOT NULL OR 1=1
    `).get(userId).count;
    onlineDevices = db.prepare('SELECT COUNT(*) as count FROM devices WHERE online = 1').get().count;
  }

  const stats = {
    total_devices: db.prepare('SELECT COUNT(*) as count FROM devices').get().count,
    online_devices: db.prepare('SELECT COUNT(*) as count FROM devices WHERE online = 1').get().count,
    total_users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    total_scenes: db.prepare('SELECT COUNT(*) as count FROM scenes').get().count,
    active_alerts: db.prepare('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0').get().count,
    operations_24h: db.prepare('SELECT COUNT(*) as count FROM operation_logs WHERE created_at > ?').get(
      Math.floor(Date.now() / 1000) - 86400
    ).count,
    pending_devices: db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'pending'").get().count,
    offline_devices: db.prepare("SELECT COUNT(*) as count FROM devices WHERE online = 0 AND status != 'pending'").get().count,
    shared_devices: db.prepare('SELECT COUNT(DISTINCT device_id) as count FROM device_permissions').get().count,
    active_temp_codes: db.prepare('SELECT COUNT(*) as count FROM temporary_access WHERE used_at IS NULL AND expires_at > ?').get(
      Math.floor(Date.now() / 1000)
    ).count
  };

  res.json(stats);
});

router.get('/alerts', requireAdmin, (req: AuthRequest, res) => {
  const resolved = req.query.resolved === 'true';
  const limit = parseInt(req.query.limit as string) || 50;

  const alerts = db.prepare(`
    SELECT a.*, d.name as device_name
    FROM alerts a
    LEFT JOIN devices d ON a.device_id = d.id
    WHERE a.resolved = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(resolved ? 1 : 0, limit);

  res.json(alerts);
});

router.post('/alerts/:id/resolve', (req: AuthRequest, res) => {
  const alertId = req.params.id;
  const now = Math.floor(Date.now() / 1000);

  const result = db.prepare(`
    UPDATE alerts SET resolved = 1, resolved_at = ? WHERE id = ?
  `).run(now, alertId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  res.json({ success: true });
});

router.get('/logs/operations', (req: AuthRequest, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const module = req.query.module as string;

  let query = `
    SELECT ol.*, u.username
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
  `;
  const params: any[] = [];

  if (module) {
    query += ' WHERE ol.module = ?';
    params.push(module);
  }

  query += ' ORDER BY ol.created_at DESC LIMIT ?';
  params.push(limit);

  const logs = db.prepare(query).all(...params);

  res.json(logs);
});

router.get('/firmware', (req: AuthRequest, res) => {
  const firmwares = [
    {
      id: 'fw-001',
      device_type: 'light',
      version: '2.1.0',
      min_version: '1.0.0',
      size: 1024000,
      release_date: '2024-01-15',
      changelog: 'Bug fixes and performance improvements'
    },
    {
      id: 'fw-002',
      device_type: 'ac',
      version: '1.5.2',
      min_version: '1.0.0',
      size: 2048000,
      release_date: '2024-01-20',
      changelog: 'Added energy saving mode'
    }
  ];

  res.json(firmwares);
});

router.post('/firmware/:deviceId/upgrade', (req: AuthRequest, res) => {
  const { deviceId } = req.params;
  const { firmware_id } = req.body;

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'firmware',
    'upgrade',
    JSON.stringify({ deviceId, firmware_id })
  );

  res.json({ success: true, message: 'Firmware upgrade initiated' });
});

export default router;
