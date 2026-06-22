import express from 'express';
import {
  checkContent,
  submitReport,
  getMyReports,
  getReportsForModeration,
  processReport,
  getFilterStats
} from '../controllers/moderationController';
import { protect, authorize } from '../middleware/authMiddleware';
import upload from '../config/multer';

const router = express.Router();

router.post('/check-content', protect, checkContent);

router.route('/reports')
  .post(protect, upload.fields([
    { name: 'evidenceImages', maxCount: 10 }
  ]), submitReport)
  .get(protect, getMyReports);

router.get('/reports/moderation', protect, authorize('admin'), getReportsForModeration);

router.put('/reports/:id/process', protect, authorize('admin'), processReport);

router.get('/filter-stats', protect, authorize('admin'), getFilterStats);

export default router;
