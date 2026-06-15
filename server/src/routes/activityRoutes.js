import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getActivities,
  getActivityDetail,
  createActivity,
  joinActivity,
  leaveActivity,
  getMyActivities,
} from '../controllers/activityController.js';

const router = express.Router();

router.get('/', getActivities);
router.get('/my', authMiddleware, getMyActivities);
router.get('/:id', getActivityDetail);
router.post('/', authMiddleware, createActivity);
router.post('/:id/join', authMiddleware, joinActivity);
router.post('/:id/leave', authMiddleware, leaveActivity);

export default router;
