import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import {
  getStats,
  getHeatmapData,
  getPendingPosts,
  reviewPost,
  getUsers,
  createCoupon,
  createDonation,
  initSeedData,
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/stats', authMiddleware, adminMiddleware, getStats);
router.get('/heatmap', authMiddleware, adminMiddleware, getHeatmapData);
router.get('/posts/pending', authMiddleware, adminMiddleware, getPendingPosts);
router.put('/posts/:id/review', authMiddleware, adminMiddleware, reviewPost);
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.post('/coupons', authMiddleware, adminMiddleware, createCoupon);
router.post('/donations', authMiddleware, adminMiddleware, createDonation);
router.post('/seed', initSeedData);

export default router;
