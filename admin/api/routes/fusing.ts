/**
 * 熔断规则API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData, updateFusingRuleStatus } from '../data/mockData.js';

const router = Router();

/**
 * 获取熔断规则列表
 * GET /api/fusing
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();

  res.json({
    success: true,
    data: data.mockFusingRules,
  });
});

/**
 * 切换熔断规则状态
 * PUT /api/fusing/:id/toggle
 */
router.put('/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const updatedRule = updateFusingRuleStatus(id);

  if (!updatedRule) {
    res.status(404).json({
      success: false,
      message: '规则不存在',
    });
    return;
  }

  res.json({
    success: true,
    message: `规则已${updatedRule.isActive ? '启用' : '停用'}`,
    data: updatedRule,
  });
});

/**
 * 创建熔断规则
 * POST /api/fusing
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, module, ruleType, threshold, timeWindow, action, description } = req.body;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const newRule = {
    id: `fr-${Date.now()}`,
    name,
    module,
    ruleType,
    threshold,
    timeWindow,
    action,
    isActive: true,
    description,
  };

  res.json({
    success: true,
    message: '规则创建成功',
    data: newRule,
  });
});

/**
 * 获取熔断事件日志
 * GET /api/fusing/events
 */
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  await new Promise((resolve) => setTimeout(resolve, 200));

  const events = Array.from({ length: 50 }, (_, i) => ({
    id: `fe-${i + 1}`,
    ruleId: ['fr-001', 'fr-002', 'fr-003', 'fr-004', 'fr-005'][i % 5],
    ruleName: ['异常充值检测', '高频充值检测', '重复核销检测', '高频预约检测', '异常消费检测'][i % 5],
    module: ['transport', 'transport', 'tourism', 'tourism', 'transport'][i % 5],
    targetId: `target-${i}`,
    targetType: ['citizen', 'citizen', 'reservation', 'citizen', 'citizen'][i % 5],
    triggeredAt: new Date(Date.now() - i * 3600000 * 6),
    handled: i < 40,
    handledAt: i < 40 ? new Date(Date.now() - i * 3600000 * 6 + 300000) : undefined,
    handledBy: i < 40 ? '超级管理员' : undefined,
  }));

  const start = (page - 1) * pageSize;
  const list = events.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: events.length,
      page,
      pageSize,
    },
  });
});

export default router;
