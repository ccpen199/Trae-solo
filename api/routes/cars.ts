import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getCars,
  getCarById,
  createCar,
  updateCar,
  checkVinDuplicate
} from '../services/car.service.js';
import type { Car } from '../types/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('car', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { dealerId, status, brand } = req.query;

      const filters: { dealerId?: number; status?: string; brand?: string } = {};

      if (req.user?.role === 'dealer') {
        filters.dealerId = req.user.userId;
      } else if (dealerId !== undefined) {
        filters.dealerId = parseInt(dealerId as string, 10);
      }

      if (status !== undefined) {
        filters.status = status as string;
      }

      if (brand !== undefined) {
        filters.brand = brand as string;
      }

      const cars = await getCars(filters);
      res.status(200).json(successResponse(cars, '获取车源列表成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取车源列表失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('car', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'dealer') {
        res.status(403).json(errorResponse('只有车商可以发布车源', 403));
        return;
      }

      const data = req.body as Partial<Car> & { dealerId: number };
      data.dealerId = req.user.userId;

      const car = await createCar(data);
      res.status(201).json(successResponse(car, '发布车源成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '发布车源失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/vin/:vin',
  authenticate,
  requirePermission('car', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { vin } = req.params;
      const isDuplicate = await checkVinDuplicate(vin);
      res.status(200).json(successResponse({ duplicate: isDuplicate }, 'VIN校验完成'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'VIN校验失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('car', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的车源ID', 400));
        return;
      }

      const car = await getCarById(id);
      if (!car) {
        res.status(404).json(errorResponse('车源不存在', 404));
        return;
      }

      if (req.user?.role === 'dealer' && car.dealerId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限查看此车源', 403));
        return;
      }

      res.status(200).json(successResponse(car, '获取车源详情成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取车源详情失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requirePermission('car', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的车源ID', 400));
        return;
      }

      const existingCar = await getCarById(id);
      if (!existingCar) {
        res.status(404).json(errorResponse('车源不存在', 404));
        return;
      }

      if (req.user?.role === 'dealer' && existingCar.dealerId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限修改此车源', 403));
        return;
      }

      const data = req.body as Partial<Car>;
      const operatorId = req.user!.userId;

      const updatedCar = await updateCar(id, data, operatorId);
      res.status(200).json(successResponse(updatedCar, '更新车源成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新车源失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
