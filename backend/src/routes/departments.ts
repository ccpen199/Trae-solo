import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { DepartmentAdapterManager, getAdapter } from '../adapters/DepartmentAdapterManager';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { category } = req.query;
    const adapters = category
      ? DepartmentAdapterManager.getAdaptersByCategory(category as string)
      : DepartmentAdapterManager.getAllAdapters();

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: adapters.length,
        departments: adapters.map(a => ({
          code: (a as any).code,
          name: (a as any).name,
          category: (a as any).category,
          health: a.getHealth()
        }))
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/health/status', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.role !== 'admin') {
      throw new AppError('仅管理员可查看详细健康状态', 403);
    }

    const statuses = DepartmentAdapterManager.getAllHealthStatus();

    const summary = Object.values(statuses).reduce((acc: any, h) => {
      acc.total++;
      acc[h.status] = (acc[h.status] || 0) + 1;
      acc.avgResponseTime = (acc.avgResponseTime || 0) + h.avgResponseTime;
      return acc;
    }, { total: 0, online: 0, degraded: 0, offline: 0 });

    summary.avgResponseTime = summary.total > 0
      ? Math.round(summary.avgResponseTime / summary.total)
      : 0;

    res.json({
      code: 0,
      message: 'OK',
      data: {
        summary,
        detailedStatus: statuses,
        updatedAt: new Date().toISOString()
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.get('/:code', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const adapter = getAdapter(req.params.code);
    if (!adapter) throw new AppError('委办局适配器不存在', 404);

    res.json({
      code: 0,
      message: 'OK',
      data: {
        code: (adapter as any).code,
        name: (adapter as any).name,
        category: (adapter as any).category,
        health: adapter.getHealth()
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

router.post('/:code/proxy/*', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const adapter = getAdapter(req.params.code);
    if (!adapter) throw new AppError('委办局适配器不存在', 404);

    const endpoint = (req.params as any)[0];
    if (!endpoint) throw new AppError('请指定代理的接口路径', 400);

    const method = req.method as any;
    const result = await adapter.request({
      endpoint: `/${endpoint}`,
      method: ['GET', 'POST', 'PUT', 'DELETE'].includes(method) ? method : 'GET',
      params: method === 'GET' ? req.query as any : undefined,
      data: method !== 'GET' ? req.body : undefined,
      citizenId: req.citizenId,
      idempotent: method === 'GET'
    });

    res.status(result.success ? 200 : 502).json({
      code: 0,
      message: result.message,
      data: {
        proxySuccess: result.success,
        upstreamCode: result.code,
        upstreamData: result.data,
        meta: result.meta
      },
      requestId: (req as any).requestId
    });

  } catch (err) { next(err); }
});

export default router;
