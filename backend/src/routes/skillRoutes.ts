import { Router } from 'express';
import multer from 'multer';
import { authenticateToken, requireRole } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import {
  getExamQuestions,
  submitExam,
  uploadPracticalVideo,
  submitPractical,
  getMyAssessments,
  getAssessmentDetail
} from '../controllers/skillController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

router.get('/exam/questions/:tradeId', authenticateToken, requireRole('worker'), getExamQuestions);
router.post('/exam/submit', authenticateToken, requireRole('worker'), auditLog('submit_exam', 'skill_assessments'), submitExam);
router.post('/practical/upload', authenticateToken, requireRole('worker'), upload.single('video'), uploadPracticalVideo);
router.post('/practical/submit', authenticateToken, requireRole('worker'), auditLog('submit_practical', 'skill_assessments'), submitPractical);
router.get('/assessments/my', authenticateToken, requireRole('worker'), getMyAssessments);
router.get('/assessments/:id', authenticateToken, getAssessmentDetail);

export default router;
