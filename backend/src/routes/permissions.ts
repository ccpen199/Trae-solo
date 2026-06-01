import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/devices/:deviceId', (req: AuthRequest, res) => {
  const deviceId = req.params.deviceId;

  const permissions = db.prepare(`
    SELECT dp.*, u.username
    FROM device_permissions dp
    JOIN users u ON dp.user_id = u.id
    WHERE dp.device_id = ?
  `).all(deviceId);

  res.json(permissions);
});

router.post('/devices/:deviceId/share', (req: AuthRequest, res) => {
  const deviceId = req.params.deviceId;
  const { username, access_level, expires_at } = req.body;

  if (!username || !access_level) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const permissionId = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  try {
    db.prepare(`
      INSERT INTO device_permissions (id, user_id, device_id, access_level, shared_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      permissionId,
      user.id,
      deviceId,
      access_level,
      now,
      expires_at || null
    );
  } catch (e) {
    return res.status(409).json({ error: 'Permission already exists' });
  }

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'permissions',
    'share',
    JSON.stringify({ deviceId, username, access_level })
  );

  res.status(201).json({ success: true, id: permissionId });
});

router.delete('/devices/:deviceId/users/:userId', (req: AuthRequest, res) => {
  const { deviceId, userId } = req.params;

  const result = db.prepare(`
    DELETE FROM device_permissions
    WHERE device_id = ? AND user_id = ?
  `).run(deviceId, userId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Permission not found' });
  }

  res.json({ success: true });
});

router.post('/temporary', (req: AuthRequest, res) => {
  const { device_id, expires_in_minutes } = req.body;

  if (!device_id) {
    return res.status(400).json({ error: 'Device ID required' });
  }

  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const accessId = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (expires_in_minutes || 60) * 60;

  db.prepare(`
    INSERT INTO temporary_access (id, code, device_id, created_by, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    accessId,
    code,
    device_id,
    req.user!.id,
    expiresAt
  );

  db.prepare('INSERT INTO operation_logs (id, user_id, module, action, details) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(),
    req.user!.id,
    'permissions',
    'temporary',
    JSON.stringify({ device_id, code })
  );

  res.status(201).json({
    id: accessId,
    code,
    device_id,
    expires_at: expiresAt
  });
});

router.post('/temporary/:code/redeem', (req: AuthRequest, res) => {
  const code = req.params.code;
  const now = Math.floor(Date.now() / 1000);

  const access = db.prepare(`
    SELECT * FROM temporary_access
    WHERE code = ? AND used_at IS NULL AND expires_at > ?
  `).get(code, now);

  if (!access) {
    return res.status(404).json({ error: 'Invalid or expired code' });
  }

  db.prepare(`
    UPDATE temporary_access SET used_at = ? WHERE id = ?
  `).run(now, access.id);

  const permissionId = uuidv4();
  db.prepare(`
    INSERT INTO device_permissions (id, user_id, device_id, access_level, shared_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    permissionId,
    req.user!.id,
    access.device_id,
    'viewer',
    now,
    access.expires_at
  );

  res.json({ success: true, device_id: access.device_id });
});

router.get('/users', requireAdmin, (req: AuthRequest, res) => {
  const users = db.prepare(`
    SELECT id, username, role, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json(users);
});

router.get('/me', (req: AuthRequest, res) => {
  res.json(req.user);
});

export default router;
