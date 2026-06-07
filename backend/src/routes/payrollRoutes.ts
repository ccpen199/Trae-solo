import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  generatePayroll,
  getMyPayrolls,
  getPayrollDetail,
  markAsViewed,
  updateBankTransferStatus
} from '../controllers/payrollController';

const router = Router();

router.post('/payrolls/generate', authenticateToken, requireRole('enterprise', 'admin'), auditLog('generate_payroll', 'payrolls'), generatePayroll);
router.get('/payrolls/my', authenticateToken, requireRole('worker'), getMyPayrolls);
router.get('/payrolls/:id', authenticateToken, getPayrollDetail);
router.put('/payrolls/:id/viewed', authenticateToken, requireRole('worker'), markAsViewed);
router.put('/payrolls/:id/transfer', authenticateToken, requireRole('enterprise', 'admin'), auditLog('update_transfer_status', 'payrolls'), updateBankTransferStatus);

export default router;
