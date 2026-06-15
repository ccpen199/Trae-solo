import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { order_id, order_type, claim_amount, claim_reason, description, evidence } = req.body;

  if (!order_id || !order_type || !claim_amount || !claim_reason) {
    return res.status(400).json({ error: '请填写必要信息' });
  }

  const db = getDB();
  const claimId = uuidv4();
  const policyNo = 'PICC' + Date.now().toString().slice(-10);

  db.prepare(`
    INSERT INTO insurance_claims (id, order_id, order_type, claimant_id, claim_amount, claim_reason, description, evidence, policy_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    claimId, order_id, order_type, req.user!.id, claim_amount,
    claim_reason, description || '', JSON.stringify(evidence || []), policyNo
  );

  res.json({ success: true, claim_id: claimId, policy_no: policyNo });
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (req.user!.role !== 'admin') {
    whereClause += ' AND claimant_id = ?';
    params.push(req.user!.id);
  }

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const claims = db.prepare(`
    SELECT ic.*, u.username as claimant_name, u.avatar as claimant_avatar
    FROM insurance_claims ic
    LEFT JOIN users u ON ic.claimant_id = u.id
    ${whereClause}
    ORDER BY ic.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset) as any[];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM insurance_claims ic
    ${whereClause}
  `).get(...params) as any;

  const result = claims.map(c => ({
    ...c,
    evidence: JSON.parse(c.evidence || '[]'),
  }));

  res.json({ claims: result, total: total.count });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const claim = db.prepare(`
    SELECT ic.*, u.username as claimant_name, u.avatar as claimant_avatar, u.phone as claimant_phone
    FROM insurance_claims ic
    LEFT JOIN users u ON ic.claimant_id = u.id
    WHERE ic.id = ?
  `).get(req.params.id) as any;

  if (!claim) {
    return res.status(404).json({ error: '理赔申请不存在' });
  }

  if (req.user!.role !== 'admin' && claim.claimant_id !== req.user!.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  claim.evidence = JSON.parse(claim.evidence || '[]');

  res.json(claim);
});

router.post('/:id/process', authMiddleware, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const { status, payout_amount } = req.body;

  const claim = db.prepare('SELECT * FROM insurance_claims WHERE id = ?').get(req.params.id) as any;
  if (!claim) {
    return res.status(404).json({ error: '理赔申请不存在' });
  }

  db.prepare(`
    UPDATE insurance_claims 
    SET status = ?, payout_amount = ?, processed_at = datetime('now')
    WHERE id = ?
  `).run(status || 'approved', payout_amount || 0, req.params.id);

  res.json({ success: true, message: '理赔已处理' });
});

router.post('/:id/simulate-picc', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const db = getDB();
  const claim = db.prepare('SELECT * FROM insurance_claims WHERE id = ?').get(req.params.id) as any;
  
  if (!claim) {
    return res.status(404).json({ error: '理赔申请不存在' });
  }

  const simulatedResult = {
    company: '中国人民保险(PICC)',
    policy_no: claim.policy_no,
    claim_amount: claim.claim_amount,
    approved_amount: claim.claim_amount * 0.8,
    status: 'approved',
    reference_id: 'PICC-' + uuidv4().slice(0, 8).toUpperCase(),
    estimated_payout_days: 3,
  };

  db.prepare(`
    UPDATE insurance_claims 
    SET status = 'approved', payout_amount = ?, processed_at = datetime('now')
    WHERE id = ?
  `).run(simulatedResult.approved_amount, req.params.id);

  res.json({ success: true, insurance_response: simulatedResult });
});

export default router;
