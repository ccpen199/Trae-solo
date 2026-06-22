import express from 'express';
import {
  applyDesigner,
  updateDesignerProfile,
  getApprovedDesigners,
  getDesignerById,
  matchDesignersForDiary,
  reviewDesigner
} from '../controllers/designerController';
import { protect, authorize, authorizeDesigner } from '../middleware/authMiddleware';
import upload from '../config/multer';

const router = express.Router();

router.post('/apply', protect, upload.fields([
  { name: 'certificationImages', maxCount: 10 },
  { name: 'portfolioImages', maxCount: 50 }
]), applyDesigner);

router.put('/profile', protect, authorizeDesigner, upload.fields([
  { name: 'certificationImages', maxCount: 10 }
]), updateDesignerProfile);

router.get('/', getApprovedDesigners);

router.get('/match/:diaryId', protect, matchDesignersForDiary);

router.get('/:id', getDesignerById);

router.post('/:id/review', protect, authorize('homeowner', 'admin'), reviewDesigner);

export default router;
