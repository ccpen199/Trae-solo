/**
 * 景区管理API路由
 */
import { Router, type Request, type Response } from 'express';
import { getData, updateScenicCapacity } from '../data/mockData.js';

const router = Router();

/**
 * 获取景区列表
 * GET /api/scenics
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const district = req.query.district as string;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const data = getData();
  let scenics = [...data.mockScenics];

  if (district) {
    scenics = scenics.filter((s) => s.district === district);
  }

  const start = (page - 1) * pageSize;
  const list = scenics.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: scenics.length,
      page,
      pageSize,
    },
  });
});

/**
 * 获取景区详情
 * GET /api/scenics/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const scenic = data.mockScenics.find((s) => s.id === id);

  if (!scenic) {
    res.status(404).json({
      success: false,
      message: '景区不存在',
    });
    return;
  }

  const reservations = data.mockReservations.filter((r) => r.scenicId === id);

  res.json({
    success: true,
    data: {
      ...scenic,
      reservations,
    },
  });
});

/**
 * 更新景区限流
 * PUT /api/scenics/:id/capacity
 */
router.put('/:id/capacity', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { capacity } = req.body;

  await new Promise((resolve) => setTimeout(resolve, 300));
  const updatedScenic = updateScenicCapacity(id, capacity);

  if (!updatedScenic) {
    res.status(404).json({
      success: false,
      message: '景区不存在',
    });
    return;
  }

  res.json({
    success: true,
    message: '限流更新成功',
    data: updatedScenic,
  });
});

/**
 * 获取景区预约列表
 * GET /api/scenics/:id/reservations
 */
router.get('/:id/reservations', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  await new Promise((resolve) => setTimeout(resolve, 200));
  const data = getData();
  const reservations = data.mockReservations.filter((r) => r.scenicId === id);

  const start = (page - 1) * pageSize;
  const list = reservations.slice(start, start + pageSize);

  res.json({
    success: true,
    data: {
      list,
      total: reservations.length,
      page,
      pageSize,
    },
  });
});

export default router;
