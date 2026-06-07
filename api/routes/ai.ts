import express from 'express';
import { AIController } from '../controllers/AIController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/summarize', authMiddleware, AIController.summarizeContent);
router.get('/activity', authMiddleware, AIController.getActivitySummary);
router.get('/ticket/:id/progress', authMiddleware, AIController.getTicketProgressSummary);
router.get('/highlights', authMiddleware, AIController.getCommunityHighlights);
router.post('/reply', authMiddleware, AIController.getSmartReply);

export default router;
