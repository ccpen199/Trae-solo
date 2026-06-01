import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateToken } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const transactionController = new TransactionController();

router.get('/', authenticateToken, (req, res) => transactionController.getTransactions(req, res));
router.post('/', authenticateToken, auditLog('create', 'transaction'), (req, res) => transactionController.createTransaction(req, res));
router.put('/:id', authenticateToken, auditLog('update', 'transaction'), (req, res) => transactionController.updateTransaction(req, res));
router.delete('/:id', authenticateToken, auditLog('delete', 'transaction'), (req, res) => transactionController.deleteTransaction(req, res));

router.get('/transfers', authenticateToken, (req, res) => transactionController.getTransfers(req, res));
router.post('/transfers', authenticateToken, auditLog('create', 'transfer'), (req, res) => transactionController.createTransfer(req, res));

router.get('/categories', authenticateToken, (req, res) => transactionController.getCategories(req, res));
router.get('/tags', authenticateToken, (req, res) => transactionController.getTags(req, res));
router.post('/tags', authenticateToken, auditLog('create', 'tag'), (req, res) => transactionController.createTag(req, res));

router.get('/monthly-summary/:year/:month', authenticateToken, (req, res) => transactionController.getMonthlySummary(req, res));

export default router;
