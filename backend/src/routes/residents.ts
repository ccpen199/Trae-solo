import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../database';
import { verifyToken, requireCommunity } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

router.get('/', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const communityId = authReq.community!.id;

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM residents WHERE community_id = ?').get(communityId) as any).cnt;
  const residents = db.prepare(
    'SELECT id, community_id, real_name, phone, access_card_id, unit_building, unit_number, role, status, created_at FROM residents WHERE community_id = ? ORDER BY id DESC LIMIT ? OFFSET ?'
  ).all(communityId, limit, offset);

  res.json({
    success: true,
    data: { items: residents, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.post('/', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { real_name, phone, id_card, access_card_id, unit_building, unit_number, role } = req.body;

  if (!real_name || !phone) {
    res.status(400).json({ success: false, error: '姓名和手机号不能为空' });
    return;
  }

  const communityId = authReq.community!.id;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM residents WHERE phone = ?').get(phone);
  if (existing) {
    res.status(409).json({ success: false, error: '该手机号已注册' });
    return;
  }

  const idCardHash = id_card ? crypto.createHash('sha256').update(id_card).digest('hex') : null;

  const result = db.prepare(
    `INSERT INTO residents (community_id, real_name, phone, id_card_hash, access_card_id, unit_building, unit_number, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(communityId, real_name, phone, idCardHash, access_card_id || null, unit_building || null, unit_number || null, role || 'resident', 'active');

  db.prepare('INSERT INTO wallets (resident_id, balance, total_earned) VALUES (?, 0, 0)').run(result.lastInsertRowid);

  const resident = db.prepare('SELECT id, community_id, real_name, phone, access_card_id, unit_building, unit_number, role, status, created_at FROM residents WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ success: true, data: resident });
});

router.get('/:id', verifyToken, (req, res) => {
  const db = getDb();
  const resident = db.prepare('SELECT id, community_id, real_name, phone, access_card_id, unit_building, unit_number, role, status, created_at FROM residents WHERE id = ?').get(req.params.id);

  if (!resident) {
    res.status(404).json({ success: false, error: '居民不存在' });
    return;
  }

  res.json({ success: true, data: resident });
});

router.put('/:id', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { real_name, access_card_id, unit_building, unit_number, id_card, status } = req.body;
  const residentId = parseInt(req.params.id as string);

  const db = getDb();
  const resident = db.prepare('SELECT * FROM residents WHERE id = ?').get(residentId);
  if (!resident) {
    res.status(404).json({ success: false, error: '居民不存在' });
    return;
  }

  if (authReq.user!.role !== 'platform_admin' && authReq.user!.role !== 'property_admin' && authReq.user!.id !== residentId) {
    res.status(403).json({ success: false, error: '无权修改该居民信息' });
    return;
  }

  const idCardHash = id_card ? crypto.createHash('sha256').update(id_card).digest('hex') : undefined;

  const updates: string[] = [];
  const values: any[] = [];

  if (real_name !== undefined) { updates.push('real_name = ?'); values.push(real_name); }
  if (access_card_id !== undefined) { updates.push('access_card_id = ?'); values.push(access_card_id); }
  if (unit_building !== undefined) { updates.push('unit_building = ?'); values.push(unit_building); }
  if (unit_number !== undefined) { updates.push('unit_number = ?'); values.push(unit_number); }
  if (idCardHash !== undefined) { updates.push('id_card_hash = ?'); values.push(idCardHash); }
  if (status !== undefined && (authReq.user!.role === 'platform_admin' || authReq.user!.role === 'property_admin')) {
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '没有需要更新的字段' });
    return;
  }

  values.push(residentId);
  db.prepare(`UPDATE residents SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT id, community_id, real_name, phone, access_card_id, unit_building, unit_number, role, status, created_at FROM residents WHERE id = ?').get(residentId);
  res.json({ success: true, data: updated });
});

export default router;
