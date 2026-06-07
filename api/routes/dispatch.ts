import { Router, type Request, type Response } from 'express';
import * as dispatchService from '../services/dispatchService.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.post('/assign/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId;
    const result = await dispatchService.intelligentDispatch(orderId);

    const response: ApiResponse = {
      success: !!result.shop && !!result.rider,
      data: result,
      message: result.reason,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '智能分单失败',
    };
    res.status(500).json(response);
  }
});

router.get('/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await dispatchService.getPendingOrdersForDispatch();

    const response: ApiResponse = {
      success: true,
      data: orders,
      message: '获取待调度订单成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取待调度订单失败',
    };
    res.status(500).json(response);
  }
});

router.get('/riders', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const isOnline = req.query.isOnline !== undefined ? req.query.isOnline === 'true' : undefined;

    const result = await dispatchService.getRiders({ page, pageSize, isOnline });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取骑手列表成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取骑手列表失败',
    };
    res.status(500).json(response);
  }
});

router.put('/riders/:id/location', async (req: Request, res: Response): Promise<void> => {
  try {
    const riderId = parseInt(req.params.id);
    const { lat, lng } = req.body;
    const rider = await dispatchService.updateRiderLocation(riderId, lat, lng);

    if (!rider) {
      const response: ApiResponse = {
        success: false,
        message: '骑手不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: rider,
      message: '更新骑手位置成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '更新骑手位置失败',
    };
    res.status(500).json(response);
  }
});

router.post('/temperature', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, temperature, lat, lng } = req.body;
    const success = await dispatchService.recordTemperatureData(orderId, temperature, lat, lng);

    const response: ApiResponse = {
      success,
      message: success ? '记录温度数据成功' : '记录温度数据失败',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '记录温度数据失败',
    };
    res.status(500).json(response);
  }
});

router.get('/temperature', async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await dispatchService.getTemperatureMonitoring();

    const response: ApiResponse = {
      success: true,
      data: vehicles,
      message: '获取温控数据成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取温控数据失败',
    };
    res.status(500).json(response);
  }
});

router.get('/temperature/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId;
    const history = await dispatchService.getTemperatureHistory(orderId);

    const response: ApiResponse = {
      success: true,
      data: history,
      message: '获取温度历史成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取温度历史失败',
    };
    res.status(500).json(response);
  }
});

export default router;
