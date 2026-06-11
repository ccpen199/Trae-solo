import { Router } from 'express';
import { getMerchants, getMerchantDetail, getProducts, getCoupons, getOrders, createOrder, redeemCoupon } from '../controllers/mall.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/merchants', authMiddleware(), getMerchants);
router.get('/merchants/:id', authMiddleware(), getMerchantDetail);
router.get('/products', authMiddleware(), getProducts);
router.get('/coupons', authMiddleware(), getCoupons);
router.get('/orders', authMiddleware(), getOrders);
router.post('/orders', authMiddleware(['owner', 'tenant']), createOrder);
router.post('/coupons/:couponId/redeem', authMiddleware(['owner', 'tenant']), redeemCoupon);

export default router;
