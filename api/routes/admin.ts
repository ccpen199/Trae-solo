import { Router, type Request, type Response } from 'express';
import * as adminService from '../services/adminService.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adminService.getDashboardStats();

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: '获取仪表板数据成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取仪表板数据失败',
    };
    res.status(500).json(response);
  }
});

router.get('/ratings', async (req: Request, res: Response): Promise<void> => {
  try {
    const ratings = await adminService.calculateShopRatings();

    const response: ApiResponse = {
      success: true,
      data: ratings,
      message: '获取花店评级成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取花店评级失败',
    };
    res.status(500).json(response);
  }
});

router.get('/ratings/:shopId', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = parseInt(req.params.shopId);
    const rating = await adminService.getShopRatingDetail(shopId);

    if (!rating) {
      const response: ApiResponse = {
        success: false,
        message: '花店不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: rating,
      message: '获取花店评级详情成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取花店评级详情失败',
    };
    res.status(500).json(response);
  }
});

router.get('/hot-products', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const city = req.query.city as string;
    const district = req.query.district as string;
    const category = req.query.category as 'flower' | 'cake' | 'gift' | undefined;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await adminService.getHotProducts({ page, pageSize, city, district, category, startDate, endDate });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取热销榜成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取热销榜失败',
    };
    res.status(500).json(response);
  }
});

router.get('/sales-ranking', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const city = req.query.city as string;
    const district = req.query.district as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await adminService.getShopSalesRanking({ page, pageSize, city, district, startDate, endDate });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取花店销售排行成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取花店销售排行失败',
    };
    res.status(500).json(response);
  }
});

router.put('/shops/:shopId/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const shopId = parseInt(req.params.shopId);
    const success = await adminService.updateShopStats(shopId);

    const response: ApiResponse = {
      success,
      message: success ? '更新花店统计成功' : '更新花店统计失败',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新花店统计失败',
    };
    res.status(500).json(response);
  }
});

export default router;
