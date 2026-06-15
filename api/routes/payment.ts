import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.ts';
import { getWallet, getTransactions, withdraw, getSettlementSummary } from '../services/paymentService.ts';
import { success, error, paginatedSuccess, parsePagination } from '../utils/response.ts';

const router = Router();

router.get('/wallet', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const wallet = getWallet(req.userId);
  return success(res, wallet);
});

router.get('/transactions', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { page, pageSize } = parsePagination(req.query);
  const { type, status } = req.query;
  
  const result = getTransactions({
    page,
    pageSize,
    userId: req.userId,
    type: type as string,
    status: status as string,
  });
  
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/settlement', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { period = 'month' } = req.query;
  const summary = getSettlementSummary(req.userId, period as string);
  return success(res, summary);
});

router.post('/withdraw', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return error(res, '提现金额无效', 400, 400);
  }
  
  const result = withdraw(req.userId, Number(amount));
  if (result.success) {
    return success(res, null, result.message);
  }
  return error(res, result.message, 400, 400);
});

export default router;
