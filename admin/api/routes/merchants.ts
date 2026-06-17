/**
 * 商户管理API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData, updateMerchantStatus } from '../data/mockData.js';

const router = Router();

/**
 * 获取商户列表
 * GET /api/merchants
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const district = req.query.district as string;
  const status = req.query.status as string;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  let merchants = [...data.mockMerchants];

  if (district) {
    merchants = merchants.filter((m) => m.district === district);
  }

  if (status) {
    merchants = merchants.filter((m) => m.verifiedStatus === status);
  }

  const start = (page - 1) * pageSize;
  const list = merchants.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: merchants.length,
      page,
      pageSize,
    },
  });
});

/**
 * 审核商户
 * PUT /api/merchants/:id/verify
 */
router.put('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { pass } = req.body;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const updatedMerchant = updateMerchantStatus(id, pass);

  if (!updatedMerchant) {
    res.status(404).json({
      success: false,
      message: '商户不存在',
    });
    return;
  }

  res.json({
    success: true,
    message: `商户已${pass ? '审核通过' : '驳回'}`,
    data: updatedMerchant,
  });
});

/**
 * 获取商户统计
 * GET /api/merchants/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const merchants = data.mockMerchants;

  const stats = {
    totalCount: merchants.length,
    verifiedCount: merchants.filter((m) => m.verifiedStatus === 'verified').length,
    pendingCount: merchants.filter((m) => m.verifiedStatus === 'pending').length,
    rejectedCount: merchants.filter((m) => m.verifiedStatus === 'rejected').length,
    activeCount: merchants.filter((m) => m.isActive).length,
    byCategory: [
      { category: '餐饮美食', count: merchants.filter((m) => m.category === '餐饮美食').length },
      { category: '零售购物', count: merchants.filter((m) => m.category === '零售购物').length },
      { category: '酒店住宿', count: merchants.filter((m) => m.category === '酒店住宿').length },
      { category: '休闲娱乐', count: merchants.filter((m) => m.category === '休闲娱乐').length },
      { category: '生活服务', count: merchants.filter((m) => m.category === '生活服务').length },
    ],
  };

  res.json({
    success: true,
    data: stats,
  });
});

export default router;
