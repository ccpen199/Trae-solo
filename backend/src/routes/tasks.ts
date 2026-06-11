import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();
const taskController = new TaskController();

router.get('/', authMiddleware, (req, res) => taskController.list(req, res));
router.get('/:id', authMiddleware, (req, res) => taskController.getById(req, res));
router.post('/', authMiddleware, requireRole('platform', 'admin'), (req, res) => taskController.create(req, res));
router.post('/:id/assign', authMiddleware, requireRole('platform', 'admin'), (req, res) => taskController.assign(req, res));
router.post('/:id/start', authMiddleware, requireRole('ops'), (req, res) => taskController.start(req, res));
router.post('/:id/complete', authMiddleware, requireRole('ops'), (req, res) => taskController.complete(req, res));
router.post('/:id/fail', authMiddleware, requireRole('ops'), (req, res) => taskController.fail(req, res));

export default router;
