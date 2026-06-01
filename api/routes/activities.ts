import { Router } from 'express';
import { ActivityController } from '../controllers/ActivityController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const activityController = new ActivityController();

router.get('/public', (req, res) => activityController.getPublicList(req, res));
router.get('/public/:id', (req, res) => activityController.getUserActivity(req, res));

router.get('/', authMiddleware(['admin', 'operator']), (req, res) => activityController.getList(req, res));
router.get('/:id', authMiddleware(['admin', 'operator']), (req, res) => activityController.getDetail(req, res));
router.post('/', authMiddleware(['admin', 'operator']), (req, res) => activityController.create(req, res));
router.put('/:id', authMiddleware(['admin', 'operator']), (req, res) => activityController.update(req, res));
router.patch('/:id/status', authMiddleware(['admin', 'operator']), (req, res) => activityController.updateStatus(req, res));
router.delete('/:id', authMiddleware(['admin']), (req, res) => activityController.delete(req, res));

export default router;
