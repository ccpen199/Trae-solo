import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const alertController = new AlertController();

router.get('/', authMiddleware, (req, res) => alertController.list(req, res));
router.post('/', authMiddleware, requireRole('platform', 'admin'), (req, res) => alertController.create(req, res));
router.get('/:id', authMiddleware, (req, res) => alertController.getById(req, res));
router.post('/:id/resolve', authMiddleware, requireRole('platform', 'admin'), (req, res) => alertController.resolve(req, res));

export default router;
