import { Router } from 'express';
import { PerformanceController } from '../controllers/PerformanceController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const controller = new PerformanceController();

router.get('/', authMiddleware, (req, res) => controller.list(req, res));
router.get('/user/:userId', authMiddleware, (req, res) => controller.getByUser(req, res));
router.get('/period/:period', authMiddleware, (req, res) => controller.getByPeriod(req, res));
router.post('/', authMiddleware, requireRole('admin'), (req, res) => controller.create(req, res));

export default router;
