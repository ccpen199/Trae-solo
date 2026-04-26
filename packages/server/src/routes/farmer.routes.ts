import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source.js';
import { Order, OrderStatus, PaymentMethod, DeliveryMethod } from '../entities/Order.js';
import { Farmer } from '../entities/Farmer.js';
import { CreditAccount } from '../entities/CreditAccount.js';
import { farmerOrderService, CreateFarmerOrderDto } from '../services/farmer-order.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.js';

const router = Router();
const orderRepository = AppDataSource.getRepository(Order);
const farmerRepository = AppDataSource.getRepository(Farmer);
const creditAccountRepository = AppDataSource.getRepository(CreditAccount);

router.get(
  '/payment-methods',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(PaymentMethod),
    });
  }
);

router.get(
  '/delivery-methods',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(DeliveryMethod),
    });
  }
);

router.get(
  '/order-statuses',
  (req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(OrderStatus),
    });
  }
);

router.get(
  '/orders',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { status, farmerId, retailStoreId, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.farmer', 'farmer')
        .leftJoinAndSelect('order.retailStore', 'retailStore')
        .leftJoinAndSelect('order.items', 'items')
        .orderBy('order.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('order.status = :status', { status });
      }

      if (farmerId) {
        queryBuilder.andWhere('order.farmerId = :farmerId', { farmerId });
      }

      if (retailStoreId) {
        queryBuilder.andWhere('order.retailStoreId = :retailStoreId', { retailStoreId });
      }

      if (req.user?.farmerId) {
        queryBuilder.andWhere('order.farmerId = :farmerId', { farmerId: req.user.farmerId });
      }

      if (req.user?.retailStoreId) {
        queryBuilder.andWhere('order.retailStoreId = :retailStoreId', { retailStoreId: req.user.retailStoreId });
      }

      const [orders, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
      });
    }
  }
);

router.get(
  '/orders/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const order = await farmerOrderService.getOrderWithDetails(id);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : '订单不存在',
      });
    }
  }
);

router.post(
  '/orders',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const dto: CreateFarmerOrderDto = req.body;

      if (req.user.farmerId && !dto.farmerId) {
        dto.farmerId = req.user.farmerId;
      }

      if (req.user.retailStoreId && !dto.retailStoreId) {
        dto.retailStoreId = req.user.retailStoreId;
      }

      if (dto.expectedDeliveryDate && typeof dto.expectedDeliveryDate === 'string') {
        dto.expectedDeliveryDate = new Date(dto.expectedDeliveryDate);
      }

      const result = await farmerOrderService.createFarmerOrder(dto, req.user.userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '创建订单失败',
      });
    }
  }
);

router.post(
  '/orders/:id/confirm-payment',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const order = await farmerOrderService.confirmOrderPayment(id, req.user.userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '确认付款失败',
      });
    }
  }
);

router.post(
  '/orders/:id/ship',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const order = await farmerOrderService.shipOrder(id, req.user.userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Ship order error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '发货失败',
      });
    }
  }
);

router.post(
  '/orders/:id/complete',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const order = await farmerOrderService.completeOrder(id, req.user.userId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      console.error('Complete order error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '完成订单失败',
      });
    }
  }
);

router.get(
  '/farmers',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF] }),
  async (req: Request, res: Response) => {
    try {
      const { search, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = farmerRepository
        .createQueryBuilder('farmer')
        .leftJoinAndSelect('farmer.region', 'region')
        .orderBy('farmer.createdAt', 'DESC');

      if (search) {
        queryBuilder.andWhere(
          '(farmer.name LIKE :search OR farmer.phone LIKE :search OR farmer.code LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [farmers, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          farmers,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get farmers error:', error);
      res.status(500).json({
        success: false,
        message: '获取农户列表失败',
      });
    }
  }
);

router.get(
  '/farmers/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const farmer = await farmerRepository.findOne({
        where: { id },
        relations: ['creditRecords', 'region'],
      });

      if (!farmer) {
        res.status(404).json({
          success: false,
          message: '农户不存在',
        });
        return;
      }

      const creditAccount = await creditAccountRepository.findOne({
        where: { farmerId: id },
      });

      res.json({
        success: true,
        data: {
          farmer,
          creditAccount,
        },
      });
    } catch (error) {
      console.error('Get farmer error:', error);
      res.status(500).json({
        success: false,
        message: '获取农户详情失败',
      });
    }
  }
);

router.get(
  '/credit-accounts',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      let accounts;

      if (req.user?.farmerId) {
        accounts = await creditAccountRepository.find({
          where: { farmerId: req.user.farmerId },
        });
      } else {
        accounts = await creditAccountRepository.find({
          relations: ['farmer'],
          order: { createdAt: 'DESC' },
        });
      }

      res.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      console.error('Get credit accounts error:', error);
      res.status(500).json({
        success: false,
        message: '获取信用账户列表失败',
      });
    }
  }
);

export default router;
