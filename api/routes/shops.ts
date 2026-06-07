import { Router, type Request, type Response } from 'express';
import * as shopService from '../services/shopService.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const city = req.query.city as string;
    const district = req.query.district as string;
    const isOnline = req.query.isOnline !== undefined ? req.query.isOnline === 'true' : undefined;

    const result = await shopService.getShops({ page, pageSize, city, district, isOnline });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取花店列表成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取花店列表失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const shop = await shopService.getShopById(id);

    if (!shop) {
      const response: ApiResponse = {
        success: false,
        message: '花店不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: shop,
      message: '获取花店详情成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取花店详情失败',
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const shop = await shopService.createShop(req.body);
    const response: ApiResponse = {
      success: true,
      data: shop,
      message: '创建花店成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '创建花店失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const shop = await shopService.updateShop(id, req.body);

    if (!shop) {
      const response: ApiResponse = {
        success: false,
        message: '花店不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: shop,
      message: '更新花店成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新花店失败',
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await shopService.deleteShop(id);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: '花店不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '删除花店成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '删除花店失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id/rating', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const shop = await shopService.updateShopRating(id);

    if (!shop) {
      const response: ApiResponse = {
        success: false,
        message: '花店不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: shop,
      message: '更新花店评级成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新花店评级失败',
    };
    res.status(500).json(response);
  }
});

export default router;
