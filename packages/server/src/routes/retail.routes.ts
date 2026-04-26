import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source.js';
import { PickupRequest } from '../entities/PickupRequest.js';
import { RetailStore } from '../entities/RetailStore.js';
import { Warehouse } from '../entities/Warehouse.js';
import { PickupRequestStatus } from '../types/common.js';
import { retailService, CreatePickupRequestDto } from '../services/retail.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.js';

const router = Router();
const pickupRepository = AppDataSource.getRepository(PickupRequest);
const retailRepository = AppDataSource.getRepository(RetailStore);
const warehouseRepository = AppDataSource.getRepository(Warehouse);

router.get(
  '/stores',
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    try {
      const { search, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = retailRepository
        .createQueryBuilder('store')
        .leftJoinAndSelect('store.region', 'region')
        .orderBy('store.createdAt', 'DESC');

      if (search) {
        queryBuilder.andWhere(
          '(store.name LIKE :search OR store.code LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [stores, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          stores,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get stores error:', error);
      res.status(500).json({
        success: false,
        message: '获取门店列表失败',
      });
    }
  }
);

router.get(
  '/pickup-requests',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      const { status, retailStoreId, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = pickupRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.retailStore', 'retailStore')
        .leftJoinAndSelect('request.assignedWarehouse', 'assignedWarehouse')
        .leftJoinAndSelect('request.logisticsOrders', 'logisticsOrders')
        .orderBy('request.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('request.status = :status', { status });
      }

      if (retailStoreId) {
        queryBuilder.andWhere('request.retailStoreId = :retailStoreId', { retailStoreId });
      }

      if (req.user?.retailStoreId) {
        queryBuilder.andWhere('request.retailStoreId = :retailStoreId', { retailStoreId: req.user.retailStoreId });
      }

      const [requests, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get pickup requests error:', error);
      res.status(500).json({
        success: false,
        message: '获取提货申请列表失败',
      });
    }
  }
);

router.get(
  '/pickup-requests/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const request = await retailService.getPickupRequestWithDetails(id);

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      console.error('Get pickup request error:', error);
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : '提货申请不存在',
      });
    }
  }
);

router.post(
  '/pickup-requests',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const dto: CreatePickupRequestDto = req.body;

      if (req.user.retailStoreId && !dto.retailStoreId) {
        dto.retailStoreId = req.user.retailStoreId;
      }

      if (dto.expectedDeliveryDate && typeof dto.expectedDeliveryDate === 'string') {
        dto.expectedDeliveryDate = new Date(dto.expectedDeliveryDate);
      }

      const request = await retailService.createPickupRequest(dto, req.user.userId);

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      console.error('Create pickup request error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '创建提货申请失败',
      });
    }
  }
);

router.post(
  '/pickup-requests/:id/process',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const request = await retailService.processPickupRequest(id, req.user.userId);

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      console.error('Process pickup request error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '处理提货申请失败',
      });
    }
  }
);

router.post(
  '/pickup-requests/:id/confirm-delivery',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const request = await retailService.confirmPickupDelivery(id, req.user.userId);

      res.json({
        success: true,
        data: request,
      });
    } catch (error) {
      console.error('Confirm pickup delivery error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '确认收货失败',
      });
    }
  }
);

router.get(
  '/warehouses',
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    try {
      const { regionId, type } = req.query;

      const queryBuilder = warehouseRepository
        .createQueryBuilder('warehouse')
        .leftJoinAndSelect('warehouse.region', 'region')
        .orderBy('warehouse.sortOrder', 'ASC');

      if (regionId) {
        queryBuilder.andWhere('warehouse.regionId = :regionId', { regionId });
      }

      if (type) {
        queryBuilder.andWhere('warehouse.type = :type', { type });
      }

      const warehouses = await queryBuilder.getMany();

      res.json({
        success: true,
        data: warehouses,
      });
    } catch (error) {
      console.error('Get warehouses error:', error);
      res.status(500).json({
        success: false,
        message: '获取仓库列表失败',
      });
    }
  }
);

router.get(
  '/pickup-requests/statuses',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(PickupRequestStatus),
    });
  }
);

export default router;
