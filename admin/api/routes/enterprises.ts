/**
 * 企业服务API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData, updateEnterpriseStatus } from '../data/mockData.js';

const router = Router();

/**
 * 获取企业列表
 * GET /api/enterprises
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const district = req.query.district as string;
  const status = req.query.status as string;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  let enterprises = [...data.mockEnterprises];

  if (district) {
    enterprises = enterprises.filter((e) => e.district === district);
  }

  if (status) {
    enterprises = enterprises.filter((e) => e.verifiedStatus === status);
  }

  const start = (page - 1) * pageSize;
  const list = enterprises.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: enterprises.length,
      page,
      pageSize,
    },
  });
});

/**
 * 获取企业详情
 * GET /api/enterprises/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const enterprise = data.mockEnterprises.find((e) => e.id === id);

  if (!enterprise) {
    res.status(404).json({
      success: false,
      message: '企业不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: enterprise,
  });
});

/**
 * 审核企业
 * PUT /api/enterprises/:id/verify
 */
router.put('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { pass, reason } = req.body;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const updatedEnterprise = updateEnterpriseStatus(id, pass, reason);

  if (!updatedEnterprise) {
    res.status(404).json({
      success: false,
      message: '企业不存在',
    });
    return;
  }

  res.json({
    success: true,
    message: `企业已${pass ? '审核通过' : '驳回'}`,
    data: updatedEnterprise,
  });
});

/**
 * 获取企业统计
 * GET /api/enterprises/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const enterprises = data.mockEnterprises;

  const stats = {
    totalCount: enterprises.length,
    verifiedCount: enterprises.filter((e) => e.verifiedStatus === 'verified').length,
    pendingCount: enterprises.filter((e) => e.verifiedStatus === 'pending').length,
    rejectedCount: enterprises.filter((e) => e.verifiedStatus === 'rejected').length,
    byIndustry: [
      { industry: '高新技术', count: enterprises.filter((e) => e.industry === '高新技术').length },
      { industry: '文化旅游', count: enterprises.filter((e) => e.industry === '文化旅游').length },
      { industry: '商贸服务', count: enterprises.filter((e) => e.industry === '商贸服务').length },
      { industry: '智能制造', count: enterprises.filter((e) => e.industry === '智能制造').length },
      { industry: '现代服务业', count: enterprises.filter((e) => e.industry === '现代服务业').length },
    ],
  };

  res.json({
    success: true,
    data: stats,
  });
});

export default router;
