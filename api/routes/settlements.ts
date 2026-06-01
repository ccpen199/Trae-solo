import { Router, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/init.js';
import authMiddleware, { type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/my', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;

    let settlements: any[] = [];

    if (user.role === 'employer') {
      const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;
      settlements = db.prepare(`
        SELECT s.*, j.title, u.name as job_seeker_name
        FROM settlements s
        JOIN employment_contracts ec ON s.contract_id = ec.id
        JOIN job_applications ja ON ec.application_id = ja.id
        JOIN jobs j ON ja.job_id = j.id
        JOIN job_seekers js ON ja.job_seeker_id = js.id
        JOIN users u ON js.user_id = u.id
        WHERE j.employer_id = ?
        ORDER BY s.created_at DESC
      `).all(employer.id);
    } else if (user.role === 'job_seeker') {
      const jobSeeker = db.prepare('SELECT id FROM job_seekers WHERE user_id = ?').get(userId) as any;
      settlements = db.prepare(`
        SELECT s.*, j.title, e.company_name
        FROM settlements s
        JOIN employment_contracts ec ON s.contract_id = ec.id
        JOIN job_applications ja ON ec.application_id = ja.id
        JOIN jobs j ON ja.job_id = j.id
        JOIN employers e ON j.employer_id = e.id
        WHERE ja.job_seeker_id = ?
        ORDER BY s.created_at DESC
      `).all(jobSeeker.id);
    }

    res.json({ success: true, data: settlements });
  } catch (error) {
    console.error('Get my settlements error:', error);
    res.status(500).json({ success: false, error: '获取结算列表失败' });
  }
});

router.post('/:contractId/confirm', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { contractId } = req.params;

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'employer') {
      res.status(403).json({ success: false, error: '只有雇主可以确认结算' });
      return;
    }

    const employer = db.prepare('SELECT id FROM employers WHERE user_id = ?').get(userId) as any;

    const contract = db.prepare(`
      SELECT ec.*, ja.job_id, j.salary_amount, j.salary_type
      FROM employment_contracts ec
      JOIN job_applications ja ON ec.application_id = ja.id
      JOIN jobs j ON ja.job_id = j.id
      WHERE ec.id = ? AND j.employer_id = ?
    `).get(contractId, employer.id) as any;

    if (!contract) {
      res.status(404).json({ success: false, error: '合同不存在或无权限' });
      return;
    }

    const amount = contract.salary_amount;
    const taxAmount = amount * 0.03;
    const netAmount = amount - taxAmount;

    const settlementId = uuidv4();
    db.prepare(`
      INSERT INTO settlements (id, contract_id, amount, tax_amount, net_amount, status, employer_confirmed_at)
      VALUES (?, ?, ?, ?, ?, 'processing', CURRENT_TIMESTAMP)
    `).run(settlementId, contractId, amount, taxAmount, netAmount);

    const taxRecordId = uuidv4();
    db.prepare(`
      INSERT INTO tax_records (id, settlement_id, tax_type, taxable_amount, tax_amount, declaration_status)
      VALUES (?, ?, 'personal_income', ?, ?, 'pending')
    `).run(taxRecordId, settlementId, amount, taxAmount);

    res.json({ success: true, message: '结算已确认，正在处理中', data: { id: settlementId } });
  } catch (error) {
    console.error('Confirm settlement error:', error);
    res.status(500).json({ success: false, error: '确认结算失败' });
  }
});

router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (user.role !== 'admin') {
      res.status(403).json({ success: false, error: '只有管理员可以完成结算' });
      return;
    }

    db.prepare(`
      UPDATE settlements SET status = 'completed', platform_processed_at = CURRENT_TIMESTAMP, transferred_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    db.prepare(`
      UPDATE tax_records SET declaration_status = 'declared', declared_at = CURRENT_TIMESTAMP WHERE settlement_id = ?
    `).run(id);

    res.json({ success: true, message: '结算已完成' });
  } catch (error) {
    console.error('Complete settlement error:', error);
    res.status(500).json({ success: false, error: '完成结算失败' });
  }
});

export default router;
