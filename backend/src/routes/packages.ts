import { Router } from 'express';
import { PackageController } from '../controllers/PackageController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const packageController = new PackageController();

router.get('/', authMiddleware, (req, res) => packageController.list(req, res));
router.get('/:id', authMiddleware, (req, res) => packageController.getById(req, res));
router.post('/inbound', authMiddleware, requireRole('platform', 'admin'), (req, res) => packageController.inbound(req, res));
router.post('/outbound', authMiddleware, requireRole('ops', 'platform', 'admin'), (req, res) => packageController.outbound(req, res));
router.post('/sign', authMiddleware, requireRole('ops', 'platform', 'admin'), (req, res) => packageController.sign(req, res));
router.post('/exception', authMiddleware, requireRole('ops', 'platform', 'admin'), (req, res) => packageController.markException(req, res));

export default router;
