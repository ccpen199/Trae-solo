import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { authenticateToken } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const accountController = new AccountController();

router.get('/', authenticateToken, (req, res) => accountController.getAccounts(req, res));
router.post('/', authenticateToken, auditLog('create', 'account'), (req, res) => accountController.createAccount(req, res));
router.get('/:id', authenticateToken, (req, res) => accountController.getAccountById(req, res));
router.put('/:id', authenticateToken, auditLog('update', 'account'), (req, res) => accountController.updateAccount(req, res));
router.delete('/:id', authenticateToken, auditLog('delete', 'account'), (req, res) => accountController.deleteAccount(req, res));
router.get('/:id/valuations', authenticateToken, (req, res) => accountController.getValuations(req, res));
router.post('/:id/valuations', authenticateToken, auditLog('add_valuation', 'account'), (req, res) => accountController.addValuation(req, res));

export default router;
