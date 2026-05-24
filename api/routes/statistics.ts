import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getSummary,
  getConversionFunnel,
  getPriceAdjustmentStats,
  getInspectionExceptionStats,
  getCancellationReasons,
  getSalesEfficiency
} from '../services/statistics.service.js';

const router = Router();

router.get(
  '/summary',
  authenticate,
  requirePermission('statistics', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以查看统计数据', 403));
        return;
      }

      const summary = await getSummary();
      res.status(200).json(successResponse(summary, '获取统计概览成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取统计概览失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/conversion',
  authenticate,
  requirePermission('statistics', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以查看统计数据', 403));
        return;
      }

      const funnel = await getConversionFunnel();
      res.status(200).json(successResponse(funnel, '获取转化漏斗数据成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取转化漏斗数据失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/price-adjustments',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以查看统计数据', 403));
        return;
      }

      const stats = await getPriceAdjustmentStats();
      res.status(200).json(successResponse(stats, '获取价格调整统计成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取价格调整统计失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/inspection-exceptions',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以查看统计数据', 403));
        return;
      }

      const stats = await getInspectionExceptionStats();
      res.status(200).json(successResponse(stats, '获取检测异常统计成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取检测异常统计失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/cancellation-reasons',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以查看统计数据', 403));
        return;
      }

      const reasons = await getCancellationReasons();
      res.status(200).json(successResponse(reasons, '获取退订原因统计成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取退订原因统计失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/sales-efficiency',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以查看统计数据', 403));
        return;
      }

      const efficiency = await getSalesEfficiency();
      res.status(200).json(successResponse(efficiency, '获取销售效率统计成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取销售效率统计失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
