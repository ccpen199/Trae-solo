import { Router } from 'express';
import * as questionController from '../controllers/questionController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate);

router.get('/types', questionController.getQuestionTypes);
router.get('/difficulties', questionController.getDifficultyLevels);
router.get('/statistics', questionController.getStatistics);

router.get('/', questionController.getQuestions);
router.get('/:id', questionController.getQuestion);

router.use(requireRole([UserRole.ADMIN, UserRole.QUESTION_SETTER]));

router.post('/', questionController.createQuestion);
router.post('/batch', questionController.batchCreateQuestions);
router.put('/:id', questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);

export default router;
