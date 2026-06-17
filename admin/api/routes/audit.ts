/**
 * 审计日志API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData } from '../data/mockData.js';

const router = Router();

/**
 * 获取审计日志列表
 * GET /api/audit
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const module = req.query.module as string;
  const riskLevel = req.query.riskLevel as string;
  const sensitiveOnly = req.query.sensitiveOnly as string;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  let logs = [...data.mockAuditLogs];

  if (module) {
    logs = logs.filter((l) => l.module === module);
  }

  if (riskLevel) {
    logs = logs.filter((l) => l.riskLevel === riskLevel);
  }

  if (sensitiveOnly === 'true') {
    logs = logs.filter((l) => l.isSensitive);
  }

  const start = (page - 1) * pageSize;
  const list = logs.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: logs.length,
      page,
      pageSize,
    },
  });
});

/**
 * 获取审计统计
 * GET /api/audit/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const logs = data.mockAuditLogs;

  const stats = {
    totalCount: logs.length,
    sensitiveCount: logs.filter((l) => l.isSensitive).length,
    highRiskCount: logs.filter((l) => l.riskLevel === 'high').length,
    mediumRiskCount: logs.filter((l) => l.riskLevel === 'medium').length,
    lowRiskCount: logs.filter((l) => l.riskLevel === 'low').length,
    byModule: [
      { module: '身份主干', count: logs.filter((l) => l.module === '身份主干').length },
      { module: '交通业务', count: logs.filter((l) => l.module === '交通业务').length },
      { module: '文旅业务', count: logs.filter((l) => l.module === '文旅业务').length },
      { module: '企业服务', count: logs.filter((l) => l.module === '企业服务').length },
      { module: '商业服务', count: logs.filter((l) => l.module === '商业服务').length },
      { module: '系统管理', count: logs.filter((l) => l.module === '系统管理').length },
    ],
    todayCount: logs.filter((l) => {
      const now = new Date();
      const logDate = new Date(l.createdAt);
      return logDate.toDateString() === now.toDateString();
    }).length,
  };

  res.json({
    success: true,
    data: stats,
  });
});

export default router;
