import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getCircles,
  getCircleDetail,
  joinCircle,
  leaveCircle,
  createCircle,
} from '../controllers/circleController.js';

const router = express.Router();

router.get('/', getCircles);
router.get('/:id', getCircleDetail);
router.post('/', authMiddleware, createCircle);
router.post('/:id/join', authMiddleware, joinCircle);
router.post('/:id/leave', authMiddleware, leaveCircle);

export default router;
