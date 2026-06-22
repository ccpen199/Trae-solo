import express from 'express';
import {
  createTransaction,
  payDeposit,
  requestStagePayment,
  confirmStageAndRelease,
  getMyTransactions,
  getTransactionById,
  raiseDispute
} from '../controllers/transactionController';
import { protect, authorize } from '../middleware/authMiddleware';
import upload from '../config/multer';

const router = express.Router();

router.route('/')
  .post(protect, authorize('homeowner', 'admin'), createTransaction)
  .get(protect, getMyTransactions);

router.get('/:id', protect, getTransactionById);

router.post('/:id/pay-deposit', protect, authorize('homeowner', 'admin'), payDeposit);

router.post('/:id/request-stage', protect, authorize('designer', 'admin'), requestStagePayment);

router.post('/:id/confirm-stage', protect, authorize('homeowner', 'admin'), upload.fields([
  { name: 'acceptanceImages', maxCount: 20 }
]), confirmStageAndRelease);

router.post('/:id/dispute', protect, raiseDispute);

export default router;
