import { Router } from 'express';
import { getPropertyKPI, getMerchantAnalytics, getMemberProfile } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/property/kpi', authMiddleware(['property']), getPropertyKPI);
router.get('/merchant', authMiddleware(['merchant']), getMerchantAnalytics);
router.get('/profile', authMiddleware(), getMemberProfile);

export default router;
