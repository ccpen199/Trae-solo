import { Router } from 'express';
import { SettlementController } from '../controllers/SettlementController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const settlementController = new SettlementController();

router.get('/', authMiddleware, (req, res) => settlementController.list(req, res));
router.post('/generate', authMiddleware, requireRole('platform', 'admin'), (req, res) => settlementController.generate(req, res));
router.post('/:id/confirm', authMiddleware, requireRole('platform', 'admin'), (req, res) => settlementController.confirm(req, res));
router.post('/:id/pay', authMiddleware, requireRole('admin'), (req, res) => settlementController.pay(req, res));

export default router;
