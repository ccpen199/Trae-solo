import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import FeedbackAnalyticsEngine from '../engines/FeedbackAnalyticsEngine';

const router = Router();

router.use(authMiddleware);

router.post('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { serviceId, rating, tags, content, applicationId, images } = req.body;

    if (!serviceId || !rating) {
      throw new AppError('serviceId和rating为必填项', 400);
    }

    if (rating < 1 || rating > 5) {
      throw new AppError('评分需在1-5之间', 400);
    }

    const result = await FeedbackAnalyticsEngine.submitFeedback({
      serviceId,
      citizenId: req.citizenId!,
      rating,
      tags: tags || [],
      content: content || '',
      applicationId,
      images: images || []
    });

    const statusCode = result.autoCreatedWorkOrder ? 201 : 200;
    res.status(statusCode).json({
      code: 0,
      message: rating <= 3 ? '感谢您的反馈，我们已生成督办工单并将尽快处理' : '感谢您的评价，您的满意是我们前进的动力',
      data: {
        feedback: {
          id: result.feedback.id,
          rating: result.feedback.rating,
          status: result.feedback._status,
          createdAt: result.feedback.createdAt,
          willCreateWorkOrder: !!result.autoCreatedWorkOrder
        },
        workOrder: result.autoCreatedWorkOrder ? {
          id: result.autoCreatedWorkOrder.id,
          title: result.autoCreatedWorkOrder.title,
          priority: result.autoCreatedWorkOrder.priority,
          assignee: result.autoCreatedWorkOrder.assignee,
          dueDate: result.autoCreatedWorkOrder.dueDate
        } : null,
        clusterInfo: result.clusterInfo ? {
          similarIssuesFound: result.clusterInfo.similarCount,
          clusterKeywords: result.clusterInfo.similarCount > 0 ? undefined : undefined
        } : null
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/mine', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status, page, pageSize } = req.query;
    const engine = (FeedbackAnalyticsEngine as any);
    const all = Array.from((engine.feedbacks as Map<string, any>).values())
      .filter((f: any) => f.citizenId === req.citizenId);

    const filtered = status
      ? all.filter((f: any) => f._status === status)
      : all;

    filtered.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const p = parseInt(page as string || '1', 10);
    const ps = parseInt(pageSize as string || '10', 10);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: filtered.length,
        page: p,
        pageSize: ps,
        feedbacks: filtered.slice((p - 1) * ps, p * ps).map((f: any) => ({
          id: f.id,
          serviceId: f.serviceId,
          rating: f.rating,
          tags: f.tags,
          content: f.content,
          status: f._status,
          assignedTo: f._assignedTo,
          resolution: f._resolution,
          resolvedAt: f._resolvedAt,
          createdAt: f.createdAt
        }))
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/clusters', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.role !== 'admin' && req.role !== 'staff') {
      throw new AppError('仅管理员可查看聚类结果', 403);
    }

    const { limit } = req.query;
    const clusters = await FeedbackAnalyticsEngine.getClusters({
      limit: parseInt(limit as string || '50', 10)
    });

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: clusters.length,
        clusters: clusters.map(c => ({
          ...c,
          sampleFeedbackId: c.feedbackIds[0],
          severity: c.size >= 10 ? 'critical' : c.size >= 5 ? 'high' : c.size >= 3 ? 'medium' : 'low'
        }))
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/work-orders', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.role !== 'admin' && req.role !== 'staff') {
      throw new AppError('仅工作人员可查看工单列表', 403);
    }

    const { status, priority, assignee, limit } = req.query;
    const workOrders = await FeedbackAnalyticsEngine.getWorkOrders({
      status: status as string,
      priority: priority as string,
      assignee: assignee as string,
      limit: parseInt(limit as string || '100', 10)
    });

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: workOrders.length,
        stats: {
          pending: workOrders.filter(w => w.status === 'pending').length,
          in_progress: workOrders.filter(w => w.status === 'in_progress').length,
          urgent: workOrders.filter(w => w.priority === 'urgent').length,
          overdue: workOrders.filter(w => new Date(w.dueDate) < new Date() &&
            ['pending', 'in_progress', 'escalated'].includes(w.status)).length
        },
        workOrders
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.patch('/work-orders/:id', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.role !== 'admin' && req.role !== 'staff') {
      throw new AppError('仅工作人员可操作工单', 403);
    }

    const wo = await FeedbackAnalyticsEngine.updateWorkOrder(req.params.id, req.body);
    if (!wo) throw new AppError('工单不存在', 404);

    res.json({
      code: 0,
      message: '工单已更新',
      data: { workOrder: wo },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/analytics/dashboard', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.role !== 'admin') {
      throw new AppError('仅管理员可查看数据分析', 403);
    }

    const days = parseInt(req.query.days as string || '30', 10);
    const dashboard = await FeedbackAnalyticsEngine.getAnalyticsDashboard(days);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        periodDays: days,
        ...dashboard
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

export default router;
