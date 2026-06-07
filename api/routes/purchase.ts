import { Router } from 'express';
import { 
  eligibilityCheck, 
  subscribe, 
  sign, 
  loanPreapproval,
  getMyOrders
} from '../controllers/purchaseController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

router.post('/eligibility-check', authMiddleware, eligibilityCheck);
router.post('/subscribe', authMiddleware, subscribe);
router.post('/sign', authMiddleware, sign);
router.post('/loan-preapproval', authMiddleware, loanPreapproval);
router.get('/orders', authMiddleware, getMyOrders);

export default router;
