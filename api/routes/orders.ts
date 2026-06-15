import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.ts';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  acceptOrder,
  confirmOrder,
  payDeposit,
  startService,
  completeOrder,
  cancelOrder,
  disputeOrder,
  getOrderTraces,
  getOrderReview,
  addOrderReview,
  matchCreators,
} from '../services/orderService.ts';
import { success, error, paginatedSuccess, parsePagination } from '../utils/response.ts';
import { settleServicePayment, createServiceDepositPayment } from '../services/paymentService.ts';

const router = Router();

router.get('/', (req, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { category, keyword, status, location, creatorId, requesterId } = req.query;
  
  const result = getOrders({
    page,
    pageSize,
    category: category as string,
    keyword: keyword as string,
    status: status as string,
    location: location as string,
    creatorId: creatorId as string,
    requesterId: requesterId as string,
  });
  
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/my', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { page, pageSize } = parsePagination(req.query);
  const { role } = req.query;
  
  if (role === 'creator') {
    const result = getOrders({ page, pageSize, creatorId: req.userId });
    return paginatedSuccess(res, result.items, result.total, page, pageSize);
  }
  
  const result = getOrders({ page, pageSize, requesterId: req.userId });
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const order = getOrderById(id);
  
  if (!order) {
    return error(res, '订单不存在', 404, 404);
  }
  
  return success(res, order);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const order = createOrder(req.userId, req.body);
  return success(res, order, '订单创建成功');
});

router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const order = getOrderById(id);
  
  if (!order) {
    return error(res, '订单不存在', 404, 404);
  }
  
  if (order.requesterId !== req.userId && req.userRole !== 'admin') {
    return error(res, '无权限修改', 403, 403);
  }
  
  const updated = updateOrder(id, req.body);
  return success(res, updated, '订单更新成功');
});

router.post('/:id/accept', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const order = acceptOrder(id, req.userId);
  
  if (!order) {
    return error(res, '接单失败', 400, 400);
  }
  
  return success(res, order, '接单成功');
});

router.post('/:id/confirm', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const order = confirmOrder(id, req.userId);
  
  if (!order) {
    return error(res, '确认失败', 400, 400);
  }
  
  return success(res, order, '确认成功');
});

router.post('/:id/pay-deposit', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const order = getOrderById(id);
  
  if (!order) {
    return error(res, '订单不存在', 404, 404);
  }
  
  const updated = payDeposit(id, req.userId);
  if (updated && order.creatorId) {
    createServiceDepositPayment(req.userId, id, order.deposit, order.creatorId);
  }
  
  return success(res, updated, '定金支付成功');
});

router.post('/:id/start', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const order = startService(id, req.userId);
  
  if (!order) {
    return error(res, '开始服务失败', 400, 400);
  }
  
  return success(res, order, '服务已开始');
});

router.post('/:id/complete', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const order = completeOrder(id, req.userId);
  
  if (!order) {
    return error(res, '完成服务失败', 400, 400);
  }
  
  if (order.creatorId) {
    settleServicePayment(id, order.price, order.deposit, order.creatorId, order.requesterId);
  }
  
  return success(res, order, '服务已完成');
});

router.post('/:id/cancel', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const { reason } = req.body;
  const order = cancelOrder(id, req.userId, reason || '用户取消');
  
  return success(res, order, '订单已取消');
});

router.post('/:id/dispute', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const { reason } = req.body;
  const order = disputeOrder(id, req.userId, reason || '');
  
  return success(res, order, '已提交争议申请');
});

router.get('/:id/traces', (req, res) => {
  const { id } = req.params;
  const traces = getOrderTraces(id);
  return success(res, traces);
});

router.get('/:id/review', (req, res) => {
  const { id } = req.params;
  const review = getOrderReview(id);
  return success(res, review);
});

router.post('/:id/review', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const { rating, content } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return error(res, '评分必须在1-5之间', 400, 400);
  }
  
  const review = addOrderReview(id, req.userId, rating, content || '');
  return success(res, review, '评价成功');
});

router.get('/:id/match-creators', (req, res) => {
  const { id } = req.params;
  const creators = matchCreators(id, 5);
  return success(res, creators);
});

export default router;
