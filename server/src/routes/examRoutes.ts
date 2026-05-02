import { Router } from 'express';
import * as examController from '../controllers/examController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticate);

router.get('/', examController.getExams);
router.get('/:id', examController.getExam);

router.post('/:examId/start', requireRole([UserRole.EXAMINEE]), examController.startExam);
router.post('/:userExamId/save', requireRole([UserRole.EXAMINEE]), examController.saveAnswer);
router.post('/:userExamId/submit', requireRole([UserRole.EXAMINEE]), examController.submitExam);
router.post('/:userExamId/anomaly', requireRole([UserRole.EXAMINEE]), examController.reportAnomaly);
router.get('/user-exam/:userExamId', examController.getUserExam);

router.use(requireRole([UserRole.ADMIN]));

router.post('/', examController.createExam);
router.put('/:id', examController.updateExam);
router.post('/:id/publish', examController.publishExam);
router.post('/:examId/examinees', examController.addExaminees);
router.get('/:examId/examinees', examController.getExamExaminees);

export default router;
