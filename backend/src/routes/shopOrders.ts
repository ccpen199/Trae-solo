import { Router } from 'express';
import { ShopOrderController } from '../controllers/ShopOrderController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const controller = new ShopOrderController();

router.get('/', authMiddleware, (req, res) => controller.list(req, res));
router.post('/', authMiddleware, requireRole('platform', 'admin'), (req, res) => controller.create(req, res));
router.put('/:id/status', authMiddleware, requireRole('platform', 'admin'), (req, res) => controller.updateStatus(req, res));
router.post('/sync', authMiddleware, requireRole('platform', 'admin'), (req, res) => controller.sync(req, res));

export default router;
