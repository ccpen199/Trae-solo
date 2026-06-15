import { Router } from 'express';
import { authMiddleware, adminMiddleware, type AuthRequest } from '../middleware/auth.ts';
import {
  getReviewRecords,
  getReviewRecordById,
  approveReview,
  rejectReview,
  getReviewStats,
} from '../services/reviewService.ts';
import { success, error, paginatedSuccess, parsePagination } from '../utils/response.ts';

const router = Router();

router.get('/', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { status, contentType } = req.query;
  
  const result = getReviewRecords({
    page,
    pageSize,
    status: status as string,
    contentType: contentType as string,
  });
  
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/stats', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const stats = getReviewStats();
  return success(res, stats);
});

router.get('/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { id } = req.params;
  const record = getReviewRecordById(id);
  
  if (!record) {
    return error(res, '审核记录不存在', 404, 404);
  }
  
  return success(res, record);
});

router.post('/:id/approve', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const record = approveReview(id, req.userId);
  
  if (!record) {
    return error(res, '审核失败', 400, 400);
  }
  
  return success(res, record, '审核通过');
});

router.post('/:id/reject', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const { reason } = req.body;
  const record = rejectReview(id, req.userId, reason || '内容不符合规范');
  
  if (!record) {
    return error(res, '审核失败', 400, 400);
  }
  
  return success(res, record, '已驳回');
});

export default router;
