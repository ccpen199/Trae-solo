import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authenticate, requireRoles, getClientIp, getUserAgent, type AuthRequest } from '../middleware.js';
import { logAudit } from '../audit.js';
import type { UserResponse, UserRole } from '../types.js';

const router = Router();

router.get('/', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const offset = (page - 1) * pageSize;
  const role = req.query.role as string | undefined;
  const keyword = req.query.keyword as string | undefined;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (role) {
    where += ' AND u.role = ?';
    params.push(role);
  }
  if (keyword) {
    where += ' AND (u.name LIKE ? OR u.username LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM users u ${where}`).get(...params) as { count: number };
  const list = db.prepare(`
    SELECT u.id, u.username, u.role, u.name, u.phone, u.email, u.fleet_id, u.created_at, u.updated_at,
           f.name as fleet_name
    FROM users u
    LEFT JOIN fleets f ON u.fleet_id = f.id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as UserResponse[];

  res.json({ success: true, data: list, total: total.count, page, page_size: pageSize });
});

router.get('/:id', authenticate, requireRoles('admin', 'operation'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  const user = db.prepare(`
    SELECT u.id, u.username, u.role, u.name, u.phone, u.email, u.fleet_id, u.created_at, u.updated_at,
           f.name as fleet_name
    FROM users u
    LEFT JOIN fleets f ON u.fleet_id = f.id
    WHERE u.id = ?
  `).get(id) as UserResponse | undefined;

  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  res.json({ success: true, data: user });
});

router.post('/', authenticate, requireRoles('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { username, password, role, name, phone, email, fleet_id } = req.body;

    if (!username || !password || !role || !name) {
      res.status(400).json({ success: false, error: '缺少必要字段' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      res.status(400).json({ success: false, error: '用户名已存在' });
      return;
    }

    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare(`
      INSERT INTO users (username, password_hash, role, name, phone, email, fleet_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, hash, role, name, phone || null, email || null, fleet_id || null);

    const userId = Number(info.lastInsertRowid);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'create',
        resourceType: 'user',
        resourceId: userId,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `创建用户: ${username} (${role})`,
      });
    }

    const user = db.prepare(`
      SELECT u.id, u.username, u.role, u.name, u.phone, u.email, u.fleet_id, u.created_at, u.updated_at,
             f.name as fleet_name
      FROM users u
      LEFT JOIN fleets f ON u.fleet_id = f.id
      WHERE u.id = ?
    `).get(userId) as UserResponse;

    res.json({ success: true, data: user });
  } catch (e: any) {
    console.error('[User Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put('/:id', authenticate, requireRoles('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id);
    const { password, role, name, phone, email, fleet_id } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ success: false, error: '用户不存在' });
      return;
    }

    const hash = password ? bcrypt.hashSync(password, 10) : null;

    db.prepare(`
      UPDATE users
      SET password_hash = COALESCE(?, password_hash),
          role = COALESCE(?, role),
          name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          fleet_id = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(hash, role || null, name || null, phone || null, email || null, fleet_id ?? null, id);

    if (req.user) {
      logAudit({
        userId: req.user.id,
        action: 'update',
        resourceType: 'user',
        resourceId: id,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        detail: `更新用户: ${existing.username}`,
      });
    }

    const user = db.prepare(`
      SELECT u.id, u.username, u.role, u.name, u.phone, u.email, u.fleet_id, u.created_at, u.updated_at,
             f.name as fleet_name
      FROM users u
      LEFT JOIN fleets f ON u.fleet_id = f.id
      WHERE u.id = ?
    `).get(id) as UserResponse;

    res.json({ success: true, data: user });
  } catch (e: any) {
    console.error('[User Error]', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/:id', authenticate, requireRoles('admin'), (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);

  if (id === 1 || id === req.user?.id) {
    res.status(400).json({ success: false, error: '不能删除系统管理员或自身' });
    return;
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ success: false, error: '用户不存在' });
    return;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);

  if (req.user) {
    logAudit({
      userId: req.user.id,
      action: 'delete',
      resourceType: 'user',
      resourceId: id,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      detail: `删除用户: ${existing.username}`,
    });
  }

  res.json({ success: true });
});

router.get('/options/roles', authenticate, (req: AuthRequest, res: Response): void => {
  const roles: UserRole[] = ['admin', 'operation', 'maintenance', 'fleet_admin', 'owner'];
  const options = roles.map(r => ({ value: r, label: r === 'admin' ? '系统管理员' : r === 'operation' ? '运营人员' : r === 'maintenance' ? '运维人员' : r === 'fleet_admin' ? '车队管理员' : '车主' }));
  res.json({ success: true, data: options });
});

export default router;
