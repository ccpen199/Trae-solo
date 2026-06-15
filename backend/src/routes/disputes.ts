import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { order_id, order_type, respondent_id, reason, description, evidence_photos, call_recordings } = req.body;

  if (!order_id || !order_type || !respondent_id || !reason) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  const db = getDB();
  const disputeId = uuidv4();

  db.prepare(`
    INSERT INTO disputes (id, order_id, order_type, complainant_id, respondent_id, reason, description, evidence_photos, call_recordings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    disputeId, order_id, order_type, req.user!.id, respondent_id,
    reason, description || '', JSON.stringify(evidence_photos || []), JSON.stringify(call_recordings || [])
  );

  res.json({ success: true, dispute_id: disputeId });
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (req.user!.role !== 'admin') {
    whereClause += ' AND (complainant_id = ? OR respondent_id = ?)';
    params.push(req.user!.id, req.user!.id);
  }

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const disputes = db.prepare(`
    SELECT d.*, 
           uc.username as complainant_name, uc.avatar as complainant_avatar,
           ur.username as respondent_name, ur.avatar as respondent_avatar,
           ua.username as arbitrator_name
    FROM disputes d
    LEFT JOIN users uc ON d.complainant_id = uc.id
    LEFT JOIN users ur ON d.respondent_id = ur.id
    LEFT JOIN users ua ON d.arbitrator_id = ua.id
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM disputes d
    ${whereClause}
  `).get(...params) as any;

  const result = disputes.map(d => ({
    ...d,
    evidence_photos: JSON.parse(d.evidence_photos || '[]'),
    call_recordings: JSON.parse(d.call_recordings || '[]'),
  }));

  res.json({ disputes: result, total: total.count });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const dispute = db.prepare(`
    SELECT d.*, 
           uc.username as complainant_name, uc.avatar as complainant_avatar, uc.phone as complainant_phone,
           ur.username as respondent_name, ur.avatar as respondent_avatar, ur.phone as respondent_phone,
           ua.username as arbitrator_name
    FROM disputes d
    LEFT JOIN users uc ON d.complainant_id = uc.id
    LEFT JOIN users ur ON d.respondent_id = ur.id
    LEFT JOIN users ua ON d.arbitrator_id = ua.id
    WHERE d.id = ?
  `).get(req.params.id) as any;

  if (!dispute) {
    return res.status(404).json({ error: '纠纷不存在' });
  }

  if (req.user!.role !== 'admin' && dispute.complainant_id !== req.user!.id && dispute.respondent_id !== req.user!.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  dispute.evidence_photos = JSON.parse(dispute.evidence_photos || '[]');
  dispute.call_recordings = JSON.parse(dispute.call_recordings || '[]');

  res.json(dispute);
});

router.post('/:id/resolve', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { resolution, status } = req.body;

  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id) as any;
  if (!dispute) {
    return res.status(404).json({ error: '纠纷不存在' });
  }

  db.prepare(`
    UPDATE disputes 
    SET status = ?, resolution = ?, arbitrator_id = ?, resolved_at = datetime('now')
    WHERE id = ?
  `).run(status || 'resolved', resolution || '', req.user!.id, req.params.id);

  res.json({ success: true, message: '纠纷已处理' });
});

export default router;
