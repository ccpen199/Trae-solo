/**
 * 市民管理API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData } from '../data/mockData.js';

const router = Router();

/**
 * 获取市民列表
 * GET /api/citizens
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const district = req.query.district as string;
  const verified = req.query.verified as string;
  const keyword = req.query.keyword as string;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  let citizens = [...data.mockCitizens];

  if (district) {
    citizens = citizens.filter((c) => c.district === district);
  }

  if (verified !== undefined && verified !== '') {
    citizens = citizens.filter((c) => c.realNameVerified === (verified === 'true'));
  }

  if (keyword) {
    citizens = citizens.filter(
      (c) =>
        c.name.includes(keyword) ||
        c.phone.includes(keyword) ||
        c.idCardNumber.includes(keyword)
    );
  }

  const start = (page - 1) * pageSize;
  const list = citizens.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: citizens.length,
      page,
      pageSize,
    },
  });
});

/**
 * 获取市民详情
 * GET /api/citizens/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const citizen = data.mockCitizens.find((c) => c.id === id);

  if (!citizen) {
    res.status(404).json({
      success: false,
      message: '市民信息不存在',
    });
    return;
  }

  const cards = data.mockTransportCards.filter((c) => c.citizenId === id);
  const reservations = data.mockReservations.filter((r) => r.citizenId === id);
  const transactions = data.mockTransactions.filter((t) => t.cardId.startsWith('tc-')).slice(0, 10);

  res.json({
    success: true,
    data: {
      ...citizen,
      cards,
      reservations,
      transactions,
    },
  });
});

/**
 * 更新市民认证状态
 * PUT /api/citizens/:id/verify
 */
router.put('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { verified, faceVerified } = req.body;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  const citizen = data.mockCitizens.find((c) => c.id === id);

  if (!citizen) {
    res.status(404).json({
      success: false,
      message: '市民信息不存在',
    });
    return;
  }

  res.json({
    success: true,
    message: '更新成功',
    data: {
      ...citizen,
      realNameVerified: verified !== undefined ? verified : citizen.realNameVerified,
      faceVerified: faceVerified !== undefined ? faceVerified : citizen.faceVerified,
      realNameVerifiedAt: verified ? new Date() : citizen.realNameVerifiedAt,
    },
  });
});

export default router;
