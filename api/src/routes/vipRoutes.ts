import { Router } from 'express';
import * as vipController from '../controllers/vipController.js';

const router = Router();

router.get('/:userId', vipController.getVipInfo);
router.get('/:userId/points', vipController.getPoints);
router.post('/:userId/points', vipController.addPoints);
router.post('/:userId/points/use', vipController.usePoints);
router.get('/:userId/coupons', vipController.getCoupons);
router.post('/coupons/buy1get1', vipController.issueBuy1Get1Coupon);
router.post('/checkin', vipController.checkIn);

export default router;
