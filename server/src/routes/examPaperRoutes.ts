import { Router } from 'express';
import * as examPaperController from '../controllers/examPaperController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate);

router.get('/', examPaperController.getPapers);
router.get('/:id', examPaperController.getPaper);

router.use(requireRole([UserRole.ADMIN, UserRole.QUESTION_SETTER]));

router.post('/intelligent', examPaperController.createIntelligentPaper);
router.post('/manual', examPaperController.createManualPaper);
router.put('/:id', examPaperController.updatePaper);
router.post('/:id/publish', examPaperController.publishPaper);
router.post('/:id/archive', examPaperController.archivePaper);
router.delete('/:id', examPaperController.deletePaper);

export default router;
