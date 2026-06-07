import { Router } from 'express';
import { ApplicationController } from '../controllers/ApplicationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateToken, ApplicationController.create);
router.get('/', authenticateToken, ApplicationController.getMyApplications);
router.get('/stats', authenticateToken, ApplicationController.getStats);
router.get('/:id', authenticateToken, ApplicationController.getById);
router.get('/:id/timeline', authenticateToken, ApplicationController.getTimeline);
router.post('/:id/signature', authenticateToken, ApplicationController.submitSignature);

export default router;
