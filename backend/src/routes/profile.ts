import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import ProfileEngineService from '../engines/ProfileEngineService';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { force } = req.query;
    const citizenId = req.citizenId!;

    const entry = await ProfileEngineService.getFullProfile(citizenId, force === 'true');

    res.json({
      code: 0,
      message: 'OK',
      data: {
        profile: entry.profile,
        tags: entry.tags,
        recommendations: entry.recommendations,
        reminders: entry.reminders,
        meta: {
          lastUpdated: entry.lastUpdated,
          computationTime: `${entry.computationTime}ms`
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/tags', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const citizenId = req.citizenId!;
    const result = await ProfileEngineService.getUserTags(citizenId);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        profile: {
          name: result.profile.name,
          age: result.profile.age,
          gender: result.profile.gender,
          district: result.profile.district,
          verifiedLevel: result.profile.verifiedLevel
        },
        tags: result.tags,
        tagStats: {
          total: result.tags.length,
          byCategory: result.tags.reduce((acc: any, tag) => {
            acc[tag.category] = (acc[tag.category] || 0) + 1;
            return acc;
          }, {}),
          highWeightTags: result.tags.filter(t => t.weight >= 0.7).length
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/recommendations', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const citizenId = req.citizenId!;
    const result = await ProfileEngineService.getRecommendations(citizenId);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        recommendedServiceIds: result.serviceIds,
        reminders: result.reminders,
        matchedPolicies: result.matchedPolicies,
        strategy: [
          '画像标签匹配推荐',
          '高频服务优先排序',
          '生活事件关联触发',
          '地理区域画像过滤'
        ]
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/reminders', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const citizenId = req.citizenId!;
    const entry = await ProfileEngineService.getFullProfile(citizenId);

    const urgentCount = entry.reminders.filter(r => r.priority === 'urgent').length;
    const highCount = entry.reminders.filter(r => r.priority === 'high').length;

    res.json({
      code: 0,
      message: 'OK',
      data: {
        reminders: entry.reminders,
        stats: {
          total: entry.reminders.length,
          urgent: urgentCount,
          high: highCount,
          normal: entry.reminders.length - urgentCount - highCount
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/reminders/:id/dismiss', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const citizenId = req.citizenId!;
    const reminderId = req.params.id;

    const success = await ProfileEngineService.dismissReminder(citizenId, reminderId);
    if (!success) throw new AppError('提醒不存在', 404);

    res.json({
      code: 0,
      message: '提醒已忽略',
      data: { dismissed: true, reminderId },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/behavior', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const citizenId = req.citizenId!;
    const { action, serviceId, serviceCategory, metadata } = req.body;

    if (!action) throw new AppError('action不能为空', 400);

    await ProfileEngineService.recordBehavior(citizenId, action, {
      serviceId, serviceCategory, metadata
    });

    res.status(201).json({
      code: 0,
      message: '行为记录已上报',
      data: { recorded: true },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/behavior/trend', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const citizenId = req.citizenId!;
    const days = parseInt(req.query.days as string || '30', 10);

    const trend = await ProfileEngineService.getBehaviorTrend(citizenId, days);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        periodDays: days,
        trend,
        summary: {
          totalActions: trend.reduce((s, d) => s + d.actionCount, 0),
          avgDaily: Math.round(trend.reduce((s, d) => s + d.actionCount, 0) / days * 100) / 100,
          activeDays: trend.filter(d => d.actionCount > 0).length,
          topCategory: Object.entries(
            trend.reduce((acc, d) => {
              for (const [k, v] of Object.entries(d.categoryBreakdown)) acc[k] = (acc[k] || 0) + v;
              return acc;
            }, {} as Record<string, number>)
          ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
        }
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.patch('/preferences', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const citizenId = req.citizenId!;
    const result = await ProfileEngineService.updateUserPreferences(citizenId, req.body);

    res.json({
      code: 0,
      message: '偏好设置已更新',
      data: {
        preferences: result.profile.preferences,
        lastUpdated: result.lastUpdated
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

export default router;
