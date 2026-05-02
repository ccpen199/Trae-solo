import { Router } from 'express';
import authRoutes from './authRoutes';
import questionRoutes from './questionRoutes';
import examPaperRoutes from './examPaperRoutes';
import examRoutes from './examRoutes';
import gradingRoutes from './gradingRoutes';
import statisticsRoutes from './statisticsRoutes';
import knowledgePointRoutes from './knowledgePointRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/exam-papers', examPaperRoutes);
router.use('/exams', examRoutes);
router.use('/grading', gradingRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/knowledge-points', knowledgePointRoutes);

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Online Exam System API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
