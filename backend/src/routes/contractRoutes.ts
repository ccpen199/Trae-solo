import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  createContract,
  getMyContracts,
  getContractDetail,
  signContractByWorker,
  signContractByEnterprise
} from '../controllers/contractController';

const router = Router();

router.get('/contracts', authenticateToken, getMyContracts);
router.get('/contracts/:id', authenticateToken, getContractDetail);
router.post('/contracts', authenticateToken, requireRole('enterprise'), auditLog('create_contract', 'labor_contracts'), createContract);
router.put('/contracts/:id/sign/worker', authenticateToken, requireRole('worker'), auditLog('sign_contract_worker', 'labor_contracts'), signContractByWorker);
router.put('/contracts/:id/sign/enterprise', authenticateToken, requireRole('enterprise'), auditLog('sign_contract_enterprise', 'labor_contracts'), signContractByEnterprise);

export default router;
