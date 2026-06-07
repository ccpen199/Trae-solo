import { Router, type Request, type Response } from 'express';
import * as productService from '../services/productService.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const festival = req.query.festival as string;
    const scene = req.query.scene as string;
    const minPrice = req.query.minPrice !== undefined ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice !== undefined ? parseFloat(req.query.maxPrice as string) : undefined;
    const category = req.query.category as 'flower' | 'cake' | 'gift' | undefined;
    const city = req.query.city as string;
    const district = req.query.district as string;
    const shopId = req.query.shopId !== undefined ? parseInt(req.query.shopId as string) : undefined;
    const keyword = req.query.keyword as string;

    const result = await productService.getProducts({
      page,
      pageSize,
      festival,
      scene,
      minPrice,
      maxPrice,
      category,
      city,
      district,
      shopId,
      keyword,
    });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取商品列表成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取商品列表失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(id);

    if (!product) {
      const response: ApiResponse = {
        success: false,
        message: '商品不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: product,
      message: '获取商品详情成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取商品详情失败',
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await productService.createProduct(req.body);
    const response: ApiResponse = {
      success: true,
      data: product,
      message: '创建商品成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '创建商品失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.updateProduct(id, req.body);

    if (!product) {
      const response: ApiResponse = {
        success: false,
        message: '商品不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: product,
      message: '更新商品成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新商品失败',
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await productService.deleteProduct(id);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: '商品不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '删除商品成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '删除商品失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id/stock', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const product = await productService.updateProductStock(id, quantity);

    if (!product) {
      const response: ApiResponse = {
        success: false,
        message: '商品不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: product,
      message: '更新库存成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新库存失败',
    };
    res.status(500).json(response);
  }
});

export default router;
