import { Router, type Request, type Response } from 'express';
import * as orderService from '../services/orderService.js';
import type { ApiResponse, OrderStatus } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const userId = req.query.userId !== undefined ? parseInt(req.query.userId as string) : undefined;
    const shopId = req.query.shopId !== undefined ? parseInt(req.query.shopId as string) : undefined;
    const status = req.query.status as OrderStatus | undefined;
    const riderId = req.query.riderId !== undefined ? parseInt(req.query.riderId as string) : undefined;

    const result = await orderService.getOrders({ page, pageSize, userId, shopId, status, riderId });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取订单列表成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取订单列表失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const order = await orderService.getOrderById(id);

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: '订单不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: order,
      message: '获取订单详情成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取订单详情失败',
    };
    res.status(500).json(response);
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await orderService.createOrder(req.body);
    const response: ApiResponse = {
      success: true,
      data: order,
      message: '创建订单成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '创建订单失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { status, riderId } = req.body;
    const order = await orderService.updateOrderStatus(id, status, riderId);

    if (!order) {
      const response: ApiResponse = {
        success: false,
        message: '订单不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: order,
      message: '更新订单状态成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新订单状态失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id/logistics', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const logistics = await orderService.getOrderLogistics(id);

    const response: ApiResponse = {
      success: true,
      data: logistics,
      message: '获取物流信息成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取物流信息失败',
    };
    res.status(500).json(response);
  }
});

router.post('/:id/logistics', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.id;
    const node = await orderService.addLogisticsNode({ ...req.body, orderId });
    const response: ApiResponse = {
      success: true,
      data: node,
      message: '添加物流节点成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '添加物流节点失败',
    };
    res.status(500).json(response);
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const deleted = await orderService.deleteOrder(id);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        message: '订单不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '删除订单成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '删除订单失败',
    };
    res.status(500).json(response);
  }
});

export default router;
