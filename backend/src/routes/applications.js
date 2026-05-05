import express from 'express';
import {
  createApplication,
  updateApplication,
  getApplications,
  getApplicationDetail,
  approverApprove,
  financeApprove,
  batchFinanceApprove,
  archiveApplication
} from '../controllers/applicationController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createApplication);
router.put('/:id', authenticate, updateApplication);
router.get('/', authenticate, getApplications);
router.get('/:id', authenticate, getApplicationDetail);

router.post('/:id/approver-approve', authenticate, requireRole(['approver', 'admin']), approverApprove);

router.post('/:id/finance-approve', authenticate, requireRole(['finance', 'admin']), financeApprove);
router.post('/batch-finance-approve', authenticate, requireRole(['finance', 'admin']), batchFinanceApprove);

router.post('/:id/archive', authenticate, requireRole(['finance', 'admin']), archiveApplication);

export default router;
