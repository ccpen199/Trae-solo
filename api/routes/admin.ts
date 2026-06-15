import { Router } from 'express';
import { authMiddleware, adminMiddleware, type AuthRequest } from '../middleware/auth.ts';
import { success, error, paginatedSuccess, parsePagination } from '../utils/response.ts';
import { getCourses, updateCourse } from '../services/courseService.ts';
import { getOrders, updateOrder } from '../services/orderService.ts';
import { getTransactions, getPlatformFinanceSummary } from '../services/paymentService.ts';
import { getReviewStats } from '../services/reviewService.ts';
import { findUserById, getCreators } from '../services/userService.ts';

const router = Router();

router.get('/dashboard', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const reviewStats = getReviewStats();
  const financeSummary = getPlatformFinanceSummary();
  
  const courses = getCourses({ page: 1, pageSize: 1000 });
  const orders = getOrders({ page: 1, pageSize: 1000 });
  const creators = getCreators(1, 1000);
  
  const stats = {
    totalCourses: courses.total,
    publishedCourses: courses.items.filter(c => c.status === 'published').length,
    totalOrders: orders.total,
    completedOrders: orders.items.filter(o => o.status === 'completed').length,
    totalCreators: creators.total,
    totalRevenue: financeSummary.totalRevenue,
    todayRevenue: financeSummary.todayRevenue,
    pendingReviews: reviewStats.pending,
    pendingSettlements: financeSummary.pendingSettlements,
  };
  
  return success(res, stats);
});

router.get('/courses', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { status, category, keyword } = req.query;
  
  const result = getCourses({
    page,
    pageSize,
    status: status as string,
    category: category as string,
    keyword: keyword as string,
  });
  
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.put('/courses/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const course = updateCourse(id, req.body);
  return success(res, course, '课程已更新');
});

router.get('/orders', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { status, category, keyword } = req.query;
  
  const result = getOrders({
    page,
    pageSize,
    status: status as string,
    category: category as string,
    keyword: keyword as string,
  });
  
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.put('/orders/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const order = updateOrder(id, req.body);
  return success(res, order, '订单已更新');
});

router.get('/transactions', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { type, status } = req.query;
  
  const result = getTransactions({
    page,
    pageSize,
    type: type as string,
    status: status as string,
  });
  
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/finance', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const summary = getPlatformFinanceSummary();
  return success(res, summary);
});

router.get('/users', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const result = getCreators(page, pageSize);
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/users/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = findUserById(id);
  
  if (!user) {
    return error(res, '用户不存在', 404, 404);
  }
  
  return success(res, user);
});

router.post('/orders/:id/arbitrate', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body;
  
  const order = updateOrder(id, { 
    status: decision === 'refund' ? 'cancelled' : 'completed' 
  });
  
  return success(res, { order, decision, reason }, '仲裁完成');
});

export default router;
