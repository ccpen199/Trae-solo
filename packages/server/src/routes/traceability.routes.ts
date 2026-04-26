import { Router, Request, Response } from 'express';
import { traceabilityService, TraceabilityQuery } from '../services/traceability.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.js';
import { AppDataSource } from '../data-source.js';
import { ProductBatch, BatchStatus } from '../entities/ProductBatch.js';
import { LogisticsOrder } from '../entities/LogisticsOrder.js';
import { LogisticsTemperature } from '../entities/LogisticsTemperature.js';

const router = Router();
const batchRepository = AppDataSource.getRepository(ProductBatch);
const logisticsRepository = AppDataSource.getRepository(LogisticsOrder);
const temperatureRepository = AppDataSource.getRepository(LogisticsTemperature);

router.post(
  '/chain',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT, UserRole.MANUFACTURER_ADMIN, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      const { batchNumber, orderNumber, productSku, logisticsTrackingNumber } = req.body;

      const query: TraceabilityQuery = {};

      if (batchNumber) {
        query.batchNumber = batchNumber;
      }
      if (orderNumber) {
        query.orderNumber = orderNumber;
      }
      if (productSku) {
        query.productSku = productSku;
      }
      if (logisticsTrackingNumber) {
        query.logisticsTrackingNumber = logisticsTrackingNumber;
      }

      if (!query.batchNumber && !query.orderNumber && !query.productSku && !query.logisticsTrackingNumber) {
        res.status(400).json({
          success: false,
          message: '至少需要提供一个查询条件：批次号、订单号、产品SKU或物流单号',
        });
        return;
      }

      const traceabilityChain = await traceabilityService.getFullTraceabilityChain(query);

      if (!traceabilityChain) {
        res.status(404).json({
          success: false,
          message: '未找到相关追溯信息',
        });
        return;
      }

      res.json({
        success: true,
        data: traceabilityChain,
      });
    } catch (error) {
      console.error('Get traceability chain error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取追溯链失败',
      });
    }
  }
);

router.get(
  '/batch/:batchNumber',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT, UserRole.MANUFACTURER_ADMIN, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      const { batchNumber } = req.params;

      const traceabilityChain = await traceabilityService.getFullTraceabilityChain({
        batchNumber,
      });

      if (!traceabilityChain) {
        res.status(404).json({
          success: false,
          message: '未找到该批次的追溯信息',
        });
        return;
      }

      res.json({
        success: true,
        data: traceabilityChain,
      });
    } catch (error) {
      console.error('Get batch traceability error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取批次追溯信息失败',
      });
    }
  }
);

router.get(
  '/order/:orderNumber',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT, UserRole.RETAIL_STORE_OWNER, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { orderNumber } = req.params;

      const traceabilityChain = await traceabilityService.getFullTraceabilityChain({
        orderNumber,
      });

      if (!traceabilityChain) {
        res.status(404).json({
          success: false,
          message: '未找到该订单的追溯信息',
        });
        return;
      }

      res.json({
        success: true,
        data: traceabilityChain,
      });
    } catch (error) {
      console.error('Get order traceability error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取订单追溯信息失败',
      });
    }
  }
);

router.get(
  '/logistics/:trackingNumber',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      const { trackingNumber } = req.params;

      const traceabilityChain = await traceabilityService.getFullTraceabilityChain({
        logisticsTrackingNumber: trackingNumber,
      });

      if (!traceabilityChain) {
        res.status(404).json({
          success: false,
          message: '未找到该物流单的追溯信息',
        });
        return;
      }

      res.json({
        success: true,
        data: traceabilityChain,
      });
    } catch (error) {
      console.error('Get logistics traceability error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '获取物流追溯信息失败',
      });
    }
  }
);

router.get(
  '/batches',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      const { status, productId, search, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = batchRepository
        .createQueryBuilder('batch')
        .leftJoinAndSelect('batch.product', 'product')
        .leftJoinAndSelect('product.manufacturer', 'manufacturer')
        .orderBy('batch.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('batch.status = :status', { status });
      }

      if (productId) {
        queryBuilder.andWhere('batch.productId = :productId', { productId });
      }

      if (search) {
        queryBuilder.andWhere(
          '(batch.batchNumber LIKE :search OR product.name LIKE :search OR product.sku LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [batches, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          batches,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get batches error:', error);
      res.status(500).json({
        success: false,
        message: '获取批次列表失败',
      });
    }
  }
);

router.get(
  '/logistics-orders',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.CUSTOMER_SERVICE] }),
  async (req: Request, res: Response) => {
    try {
      const { status, batchId, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = logisticsRepository
        .createQueryBuilder('logistics')
        .leftJoinAndSelect('logistics.originWarehouse', 'originWarehouse')
        .leftJoinAndSelect('logistics.destinationWarehouse', 'destinationWarehouse')
        .leftJoinAndSelect('logistics.temperatureRecords', 'temperatureRecords')
        .orderBy('logistics.createdAt', 'DESC');

      if (status) {
        queryBuilder.andWhere('logistics.status = :status', { status });
      }

      const [logisticsOrders, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          logisticsOrders,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get logistics orders error:', error);
      res.status(500).json({
        success: false,
        message: '获取物流订单列表失败',
      });
    }
  }
);

router.get(
  '/temperature/:logisticsOrderId',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.CUSTOMER_SERVICE, UserRole.EXPERT] }),
  async (req: Request, res: Response) => {
    try {
      const { logisticsOrderId } = req.params;
      const { fromDate, toDate } = req.query;

      const queryBuilder = temperatureRepository
        .createQueryBuilder('temperature')
        .where('temperature.logisticsOrderId = :logisticsOrderId', { logisticsOrderId })
        .orderBy('temperature.recordedAt', 'ASC');

      if (fromDate) {
        queryBuilder.andWhere('temperature.recordedAt >= :fromDate', { fromDate: new Date(fromDate as string) });
      }

      if (toDate) {
        queryBuilder.andWhere('temperature.recordedAt <= :toDate', { toDate: new Date(toDate as string) });
      }

      const temperatures = await queryBuilder.getMany();

      const logistics = await logisticsRepository.findOne({
        where: { id: logisticsOrderId },
      });

      const stats = calculateTemperatureStats(temperatures, logistics);

      res.json({
        success: true,
        data: {
          temperatures,
          stats,
        },
      });
    } catch (error) {
      console.error('Get temperature records error:', error);
      res.status(500).json({
        success: false,
        message: '获取温度记录失败',
      });
    }
  }
);

function calculateTemperatureStats(
  temperatures: LogisticsTemperature[],
  logistics: LogisticsOrder | null
) {
  if (temperatures.length === 0) {
    return {
      totalReadings: 0,
      avgTemperature: null,
      minTemperature: null,
      maxTemperature: null,
      outOfRangeCount: 0,
      outOfRangePercentage: 0,
      compliant: true,
      targetMin: logistics?.targetTemperatureMin,
      targetMax: logistics?.targetTemperatureMax,
    };
  }

  const tempValues = temperatures.map(t => t.temperature);
  const avgTemp = tempValues.reduce((sum, t) => sum + t, 0) / tempValues.length;
  const minTemp = Math.min(...tempValues);
  const maxTemp = Math.max(...tempValues);

  let outOfRangeCount = 0;
  if (logistics?.targetTemperatureMin !== null && logistics?.targetTemperatureMax !== null) {
    outOfRangeCount = temperatures.filter(
      t => t.temperature < logistics.targetTemperatureMin! || t.temperature > logistics.targetTemperatureMax!
    ).length;
  }

  const outOfRangePercentage = (outOfRangeCount / temperatures.length) * 100;

  return {
    totalReadings: temperatures.length,
    avgTemperature: parseFloat(avgTemp.toFixed(2)),
    minTemperature: minTemp,
    maxTemperature: maxTemp,
    outOfRangeCount,
    outOfRangePercentage: parseFloat(outOfRangePercentage.toFixed(2)),
    compliant: outOfRangeCount === 0,
    targetMin: logistics?.targetTemperatureMin,
    targetMax: logistics?.targetTemperatureMax,
  };
}

export default router;
