import { Router } from 'express';
import { CustomerGroupController } from '../controllers/CustomerGroupController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const controller = new CustomerGroupController();

router.get('/', authMiddleware, (req, res) => controller.list(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.getById(req, res));
router.post('/', authMiddleware, requireRole('platform', 'admin'), (req, res) => controller.create(req, res));

export default router;
