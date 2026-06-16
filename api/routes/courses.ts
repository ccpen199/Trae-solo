import { Router } from 'express';
import { authMiddleware, creatorMiddleware, type AuthRequest } from '../middleware/auth.ts';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  submitForReview,
  getChaptersByCourseId,
  addChapter,
  updateChapter,
  deleteChapter,
  getCourseReviews,
  addCourseReview,
  purchaseCourse,
  hasCourseAccess,
  getUserCourses,
} from '../services/courseService.ts';
import { success, error, paginatedSuccess, parsePagination } from '../utils/response.ts';
import { createCoursePayment, getSettlementSummary } from '../services/paymentService.ts';
import { createReviewRecord } from '../services/reviewService.ts';

const router = Router();

router.get('/', (req, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { category, keyword, creatorId, status } = req.query;
  
  const result = getCourses({
    page,
    pageSize,
    category: category as string,
    keyword: keyword as string,
    creatorId: creatorId as string,
    status: status as string,
  });
  
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/my', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  const { page, pageSize } = parsePagination(req.query);
  const result = getUserCourses(req.userId, page, pageSize);
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const course = getCourseById(id);
  
  if (!course) {
    return error(res, '课程不存在', 404, 404);
  }
  
  return success(res, course);
});

router.post('/', authMiddleware, creatorMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const course = createCourse(req.userId, req.body);
  return success(res, course, '课程创建成功');
});

router.put('/:id', authMiddleware, creatorMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const course = getCourseById(id);
  
  if (!course) {
    return error(res, '课程不存在', 404, 404);
  }
  
  if (course.creatorId !== req.userId && req.userRole !== 'admin') {
    return error(res, '无权限修改', 403, 403);
  }
  
  const updated = updateCourse(id, req.body);
  return success(res, updated, '课程更新成功');
});

router.post('/:id/submit', authMiddleware, creatorMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const course = getCourseById(id);
  
  if (!course) {
    return error(res, '课程不存在', 404, 404);
  }
  
  if (course.creatorId !== req.userId) {
    return error(res, '无权限操作', 403, 403);
  }
  
  submitForReview(id, req.userId);
  createReviewRecord('course', id, req.userId);
  
  return success(res, null, '已提交审核');
});

router.get('/:id/chapters', (req, res) => {
  const { id } = req.params;
  const chapters = getChaptersByCourseId(id);
  return success(res, chapters);
});

router.post('/:id/chapters', authMiddleware, creatorMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const course = getCourseById(id);
  
  if (!course) {
    return error(res, '课程不存在', 404, 404);
  }
  
  if (course.creatorId !== req.userId) {
    return error(res, '无权限操作', 403, 403);
  }
  
  const chapter = addChapter(id, req.body);
  return success(res, chapter, '章节添加成功');
});

router.put('/chapters/:chapterId', authMiddleware, creatorMiddleware, (req: AuthRequest, res) => {
  const { chapterId } = req.params;
  const updated = updateChapter(chapterId, req.body);
  return success(res, updated, '章节更新成功');
});

router.delete('/chapters/:chapterId', authMiddleware, creatorMiddleware, (req: AuthRequest, res) => {
  const { chapterId } = req.params;
  const result = deleteChapter(chapterId);
  if (result) {
    return success(res, null, '删除成功');
  }
  return error(res, '删除失败', 500, 500);
});

router.get('/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { page, pageSize } = parsePagination(req.query);
  const result = getCourseReviews(id, page, pageSize);
  return paginatedSuccess(res, result.items, result.total, page, pageSize);
});

router.post('/:id/reviews', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const { rating, content } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    return error(res, '评分必须在1-5之间', 400, 400);
  }
  
  const review = addCourseReview(id, req.userId, rating, content || '');
  return success(res, review, '评价成功');
});

router.post('/:id/purchase', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const { purchaseType = 'one_time' } = req.body;
  
  const course = getCourseById(id);
  if (!course) {
    return error(res, '课程不存在', 404, 404);
  }
  
  if (hasCourseAccess(req.userId, id)) {
    return success(res, { alreadyOwned: true }, '已拥有该课程');
  }
  
  const amount = purchaseType === 'subscription' 
    ? (course.subscriptionPrice || course.price)
    : course.price;
  
  purchaseCourse(req.userId, course.id, purchaseType);
  
  const transaction = createCoursePayment(req.userId, course.id, amount, course.creatorId);
  
  return success(res, { transaction, alreadyOwned: false }, '购买成功');
});

router.get('/:id/access', authMiddleware, (req: AuthRequest, res) => {
  if (!req.userId) {
    return error(res, '用户未认证', 401, 401);
  }
  
  const { id } = req.params;
  const access = hasCourseAccess(req.userId, id);
  return success(res, { hasAccess: access });
});

export default router;
