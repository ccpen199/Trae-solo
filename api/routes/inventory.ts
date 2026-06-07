import { Router, type Request, type Response } from 'express';
import * as inventoryService from '../services/inventoryService.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const shopId = req.query.shopId !== undefined ? parseInt(req.query.shopId as string) : undefined;
    const productId = req.query.productId !== undefined ? parseInt(req.query.productId as string) : undefined;
    const batchNo = req.query.batchNo as string;

    const result = await inventoryService.getInventory({ page, pageSize, shopId, productId, batchNo });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取库存列表成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取库存列表失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const inventory = await inventoryService.getInventoryById(id);

    if (!inventory) {
      const response: ApiResponse = {
        success: false,
        message: '库存记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: inventory,
      message: '获取库存详情成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取库存详情失败',
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const inventory = await inventoryService.createInventory(req.body);
    const response: ApiResponse = {
      success: true,
      data: inventory,
      message: '创建库存记录成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '创建库存记录失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const inventory = await inventoryService.updateInventory(id, req.body);

    if (!inventory) {
      const response: ApiResponse = {
        success: false,
        message: '库存记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: inventory,
      message: '更新库存记录成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新库存记录失败',
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await inventoryService.deleteInventory(id);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: '库存记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '删除库存记录成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '删除库存记录失败',
    };
    res.status(500).json(response);
  }
});

router.post('/wastage', async (req: Request, res: Response): Promise<void> => {
  try {
    const wastage = await inventoryService.recordWastage(req.body);
    const response: ApiResponse = {
      success: true,
      data: wastage,
      message: '登记花材损耗成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '登记花材损耗失败',
    };
    res.status(500).json(response);
  }
});

router.get('/wastage', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const shopId = req.query.shopId !== undefined ? parseInt(req.query.shopId as string) : undefined;
    const productId = req.query.productId !== undefined ? parseInt(req.query.productId as string) : undefined;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const result = await inventoryService.getWastageList({ page, pageSize, shopId, productId, startDate, endDate });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取损耗记录成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取损耗记录失败',
    };
    res.status(500).json(response);
  }
});

export default router;
