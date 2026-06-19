import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken, requireCommunity } from '../middleware/auth';
import type { AuthenticatedRequest, PropertyService } from '../types';

const router = Router();

router.post('/access-control', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { gate_id } = req.body;

  const db = getDb();

  const result = db.prepare(
    `INSERT INTO property_services (community_id, resident_id, type, title, description, status, external_ref, response_data)
     VALUES (?, ?, 'access_control', ?, ?, 'completed', ?, ?)`
  ).run(
    authReq.community!.id,
    authReq.user!.id,
    '开门请求',
    `门禁ID: ${gate_id || 'default'}`,
    `GATE-${Date.now()}`,
    JSON.stringify({ success: true, message: '门禁已开启', gate_id: gate_id || 'default', opened_at: new Date().toISOString() })
  );

  const service = db.prepare('SELECT * FROM property_services WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: service });
});

router.post('/payment', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { amount, fee_type, period } = req.body;

  if (!amount || !fee_type) {
    res.status(400).json({ success: false, error: '金额和费用类型不能为空' });
    return;
  }

  const db = getDb();

  const externalRef = `PAY-${Date.now()}`;
  const result = db.prepare(
    `INSERT INTO property_services (community_id, resident_id, type, title, description, status, external_ref, response_data)
     VALUES (?, ?, 'payment', ?, ?, 'completed', ?, ?)`
  ).run(
    authReq.community!.id,
    authReq.user!.id,
    '物业缴费',
    `${fee_type} - ${period || '当期'} - ${amount}元`,
    externalRef,
    JSON.stringify({ success: true, amount, fee_type, period: period || '当期', transaction_id: externalRef, paid_at: new Date().toISOString() })
  );

  const service = db.prepare('SELECT * FROM property_services WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, data: service });
});

router.post('/repair', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { title, description } = req.body;

  if (!title) {
    res.status(400).json({ success: false, error: '报修标题不能为空' });
    return;
  }

  const db = getDb();

  const result = db.prepare(
    `INSERT INTO property_services (community_id, resident_id, type, title, description, status)
     VALUES (?, ?, 'repair', ?, ?, 'pending')`
  ).run(authReq.community!.id, authReq.user!.id, title, description || '');

  const service = db.prepare('SELECT * FROM property_services WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: service });
});

router.get('/services', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM property_services WHERE resident_id = ?').get(authReq.user!.id) as any).cnt;
  const services = db.prepare(
    'SELECT * FROM property_services WHERE resident_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(authReq.user!.id, limit, offset);

  res.json({
    success: true,
    data: { items: services, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export default router;
