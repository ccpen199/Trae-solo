import express from 'express';
import {
  createDiary,
  getDiaries,
  getDiaryById,
  updateDiary,
  toggleLike,
  addComment,
  addBudgetItem,
  getMyDiaries
} from '../controllers/diaryController';
import { protect } from '../middleware/authMiddleware';
import upload from '../config/multer';

const router = express.Router();

router.route('/')
  .get(protect, getDiaries)
  .post(protect, upload.fields([
    { name: 'images', maxCount: 30 },
    { name: 'floorPlanImage', maxCount: 1 },
    { name: 'sketchupFile', maxCount: 1 }
  ]), createDiary);

router.get('/mine', protect, getMyDiaries);

router.route('/:id')
  .get(protect, getDiaryById)
  .put(protect, upload.fields([
    { name: 'images', maxCount: 20 }
  ]), updateDiary);

router.post('/:id/like', protect, toggleLike);

router.post('/:id/comments', protect, addComment);

router.post('/:id/budget-items', protect, addBudgetItem);

export default router;
