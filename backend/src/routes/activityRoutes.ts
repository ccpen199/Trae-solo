import { Router } from 'express';
import { ActivityService } from '../services/activityService';
import { asyncHandler, getAuthUserId } from '../middleware';
import type { ActivityCreateInput } from '../types';

const router = Router();

router.post('/', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const input = req.body as ActivityCreateInput;
  const activity = ActivityService.create(userId, input);
  if (!activity) {
    res.status(400);
    res.locals.error = { code: 'CREATE_FAILED', message: '创建活动失败，请检查信用分或实名认证状态' };
    return res.json(null);
  }
  return res.json(activity);
}));

router.get('/', asyncHandler((req, res) => {
  const result = ActivityService.list({
    city: req.query.city as string,
    category: req.query.category as never,
    status: req.query.status as never,
    userId: req.query.userId as string,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20
  });
  return res.json({
    ...result,
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
    totalPages: Math.ceil(result.total / (parseInt(req.query.pageSize as string) || 20)),
    hasMore: (parseInt(req.query.page as string) || 1) * (parseInt(req.query.pageSize as string) || 20) < result.total
  });
}));

router.get('/:id', asyncHandler((req, res) => {
  const activity = ActivityService.getById(req.params.id);
  if (!activity) {
    res.status(404);
    res.locals.error = { code: 'NOT_FOUND', message: '活动不存在' };
    return res.json(null);
  }
  return res.json(activity);
}));

router.post('/:id/apply', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const result = ActivityService.apply(req.params.id, userId);
  if (!result.success) {
    res.status(400);
    res.locals.error = { code: 'APPLY_FAILED', message: result.message };
    return res.json(null);
  }
  return res.json(result);
}));

router.post('/:id/cancel', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const ok = ActivityService.cancelApplication(req.params.id, userId);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'CANCEL_FAILED', message: '取消失败' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

router.get('/:id/recommended-matches', asyncHandler((req, res) => {
  const matches = ActivityService.getRecommendedMatches(req.params.id);
  return res.json(matches.map(m => ({
    user: {
      id: m.user.id,
      nickname: m.user.nickname,
      avatar: m.user.avatar,
      age: m.user.age,
      gender: m.user.gender,
      city: m.user.location.city,
      school: m.user.education.school,
      industry: m.user.career.industry,
      position: m.user.career.position,
      interests: m.user.interestTags,
      creditScore: m.user.creditScore,
      verified: m.user.verification.verified
    },
    matchScore: m.matchScore,
    reasons: m.reasons
  })));
}));

router.post('/:id/feedback', asyncHandler((req, res) => {
  const fromUserId = getAuthUserId(req);
  const { toUserId, score, comment } = req.body as { toUserId: string; score: number; comment: string };
  const ok = ActivityService.submitFeedback(req.params.id, fromUserId, toUserId, score, comment);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'FEEDBACK_FAILED', message: '提交失败，活动未完成或评分无效' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

router.post('/:id/attendance', asyncHandler((req, res) => {
  const userId = getAuthUserId(req);
  const { attended } = req.body as { attended: boolean };
  const ok = ActivityService.markAttendance(req.params.id, userId, attended);
  if (!ok) {
    res.status(400);
    res.locals.error = { code: 'ATTENDANCE_FAILED', message: '标记失败' };
    return res.json(null);
  }
  return res.json({ success: true });
}));

export default router;
