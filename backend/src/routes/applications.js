import express from 'express';
import {
  createApplication,
  updateApplication,
  submitApplication,
  managerReview,
  riskReview,
  finalApproval,
  confirmContract,
  getApplicationById,
  getApplicationsByBorrower,
  getApplicationsForManager,
  getApplicationsForRisk,
  getApplicationsForApproval,
  assignToManager
} from '../services/applicationService.js';
import { db } from '../database/init.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const user = req.user;
    let applications = [];

    if (user.role === 'borrower') {
      applications = getApplicationsByBorrower(user.id);
    } else if (user.role === 'manager') {
      applications = getApplicationsForManager(user.id);
    } else if (user.role === 'risk_expert') {
      applications = getApplicationsForRisk();
    } else if (user.role === 'approval_director') {
      applications = getApplicationsForApproval();
    }

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: error.message || '服务器错误' });
  }
});

router.get('/dashboard-stats', async (req, res) => {
  try {
    const { getDashboardStats } = await import('../services/applicationService.js');
    const stats = getDashboardStats(req.user.role, req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('borrower'), async (req, res) => {
  try {
    const { loan_amount, loan_term, purpose } = req.body;
    const userId = req.user.id;

    if (!loan_amount || !loan_term) {
      return res.status(400).json({ error: '请填写贷款金额和期限' });
    }

    const result = createApplication(userId, {
      loan_amount: parseFloat(loan_amount),
      loan_term: parseInt(loan_term),
      purpose
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: error.message || '创建申请失败' });
  }
});

router.put('/:id', requireRole('borrower'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const userId = req.user.id;
    const { loan_amount, loan_term, purpose } = req.body;

    const result = updateApplication(applicationId, userId, {
      loan_amount: loan_amount !== undefined ? parseFloat(loan_amount) : undefined,
      loan_term: loan_term !== undefined ? parseInt(loan_term) : undefined,
      purpose
    });

    res.json(result);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: error.message || '更新申请失败' });
  }
});

router.post('/:id/submit', requireRole('borrower'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const userId = req.user.id;

    const result = await submitApplication(applicationId, userId);
    res.json(result);
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: error.message || '提交失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const app = getApplicationById(applicationId);

    if (!app) {
      return res.status(404).json({ error: '申请不存在' });
    }

    const schedules = db.prepare(`
      SELECT * FROM repayment_schedules 
      WHERE application_id = ? 
      ORDER BY period
    `).all(applicationId);

    const comments = db.prepare(`
      SELECT ac.*, u.name as user_name
      FROM approval_comments ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.application_id = ?
      ORDER BY ac.created_at DESC
    `).all(applicationId);

    const riskHits = db.prepare(`
      SELECT * FROM risk_hits 
      WHERE application_id = ?
    `).all(applicationId);

    const contract = db.prepare(`
      SELECT * FROM electronic_contracts 
      WHERE application_id = ?
    `).get(applicationId);

    res.json({
      application: app,
      schedules,
      comments,
      riskHits,
      contract
    });
  } catch (error) {
    console.error('Get application detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/assign', requireRole('manager'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { assignee_id } = req.body;
    const managerId = req.user.id;

    const result = assignToManager(applicationId, managerId, assignee_id || managerId);
    res.json(result);
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/manager-review', requireRole('manager'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { action, comment } = req.body;
    const managerId = req.user.id;

    if (!['approve', 'reject', 'return', 'escalate'].includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }

    const result = await managerReview(applicationId, managerId, action, comment);
    res.json(result);
  } catch (error) {
    console.error('Manager review error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/risk-review', requireRole('risk_expert'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { action, comment } = req.body;
    const expertId = req.user.id;

    if (!['approve', 'reject', 'return'].includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }

    const result = await riskReview(applicationId, expertId, action, comment);
    res.json(result);
  } catch (error) {
    console.error('Risk review error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/final-approval', requireRole('approval_director'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { action, comment } = req.body;
    const directorId = req.user.id;

    if (!['approve', 'reject', 'return'].includes(action)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }

    const result = await finalApproval(applicationId, directorId, action, comment);
    res.json(result);
  } catch (error) {
    console.error('Final approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/confirm-contract', requireRole('borrower'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const userId = req.user.id;

    const result = confirmContract(applicationId, userId);
    res.json(result);
  } catch (error) {
    console.error('Confirm contract error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/make-payment', requireRole('borrower'), async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { schedule_id, amount } = req.body;
    const { processRepayment } = await import('../engines/collectionBillingEngine.js');

    if (!schedule_id || !amount) {
      return res.status(400).json({ error: '请提供还款计划ID和金额' });
    }

    const result = await processRepayment(schedule_id, amount, 'manual_payment');
    res.json(result);
  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
