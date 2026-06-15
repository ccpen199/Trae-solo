import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getPointRecords,
  getCoupons,
  redeemCoupon,
  getDonations,
  donate,
} from '../controllers/pointController.js';

const router = express.Router();

router.get('/records', authMiddleware, getPointRecords);
router.get('/coupons', getCoupons);
router.post('/coupons/:id/redeem', authMiddleware, redeemCoupon);
router.get('/donations', getDonations);
router.post('/donations/:id/donate', authMiddleware, donate);

export default router;
