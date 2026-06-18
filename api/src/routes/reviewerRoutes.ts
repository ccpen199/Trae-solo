import { Router } from 'express';
import { reviewerController } from '../controllers/reviewerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('reviewer', 'admin'));

router.get('/tasks', reviewerController.getTasks);
router.get('/tasks/:id', reviewerController.getTaskById);
router.post('/tasks/:id/claim', reviewerController.claimTask);
router.post('/tasks/:id/complete', reviewerController.completeTask);
router.get('/reports', reviewerController.getMyReports);
router.post('/reports', reviewerController.submitReport);
router.post('/reports/auto-generate', reviewerController.generateAutoReport);
router.get('/reports/:reportId/sources', reviewerController.getDataSources);
router.get('/indicators', reviewerController.getIndicators);

export default router;
