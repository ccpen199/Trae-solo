import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source.js';
import { Product, ProductCategory, ProductStatus } from '../entities/Product.js';
import { ProductBatch, BatchStatus } from '../entities/ProductBatch.js';
import { Manufacturer } from '../entities/Manufacturer.js';
import { PricePolicy, PricePolicyType, PriceLockDirection } from '../entities/PricePolicy.js';
import { PricePolicyStatus } from '../types/common.js';
import { productService, CreateProductDto, CreateBatchDto, CreatePricePolicyDto } from '../services/product.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { UserRole } from '../types/common.js';
import { In } from 'typeorm';

const router = Router();
const productRepository = AppDataSource.getRepository(Product);
const batchRepository = AppDataSource.getRepository(ProductBatch);
const manufacturerRepository = AppDataSource.getRepository(Manufacturer);
const pricePolicyRepository = AppDataSource.getRepository(PricePolicy);

router.get('/categories', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(ProductCategory),
  });
});

router.get('/statuses', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(ProductStatus),
  });
});

router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { category, status, manufacturerId, search, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const queryBuilder = productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.manufacturer', 'manufacturer')
        .leftJoinAndSelect('product.batches', 'batches')
        .orderBy('product.createdAt', 'DESC');

      if (category) {
        queryBuilder.andWhere('product.category = :category', { category });
      }

      if (status) {
        queryBuilder.andWhere('product.status = :status', { status });
      }

      if (manufacturerId) {
        queryBuilder.andWhere('product.manufacturerId = :manufacturerId', { manufacturerId });
      }

      if (search) {
        queryBuilder.andWhere(
          '(product.name LIKE :search OR product.sku LIKE :search OR product.barcode LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [products, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: '获取产品列表失败',
      });
    }
  }
);

router.get(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN, UserRole.RETAIL_STORE_OWNER, UserRole.RETAIL_STORE_STAFF, UserRole.FARMER] }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const product = await productRepository.findOne({
        where: { id },
        relations: ['manufacturer', 'batches', 'pricePolicies', 'pricePolicies.region'],
      });

      if (!product) {
        res.status(404).json({
          success: false,
          message: '产品不存在',
        });
        return;
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: '获取产品详情失败',
      });
    }
  }
);

router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const dto: CreateProductDto = req.body;

      const product = await productService.createProduct(dto, req.user.userId);

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '创建产品失败',
      });
    }
  }
);

router.put(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      const product = await productService.updateProduct(id, updates, req.user.userId);

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '更新产品失败',
      });
    }
  }
);

router.post(
  '/:id/submit',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const product = await productService.submitProductForReview(id, req.user.userId);

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Submit product error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '提交审核失败',
      });
    }
  }
);

router.post(
  '/:id/approve',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { id } = req.params;

      const product = await productService.approveProduct(id, req.user.userId);

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Approve product error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '审批产品失败',
      });
    }
  }
);

router.get(
  '/:productId/batches',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN, UserRole.WAREHOUSE_MANAGER] }),
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { status } = req.query;

      const query = batchRepository
        .createQueryBuilder('batch')
        .where('batch.productId = :productId', { productId })
        .orderBy('batch.createdAt', 'DESC');

      if (status) {
        query.andWhere('batch.status = :status', { status });
      }

      const batches = await query.getMany();

      res.json({
        success: true,
        data: batches,
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

router.post(
  '/:productId/batches',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { productId } = req.params;
      const dto: CreateBatchDto = { ...req.body, productId };

      const batch = await productService.createBatch(dto, req.user.userId);

      res.json({
        success: true,
        data: batch,
      });
    } catch (error) {
      console.error('Create batch error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '创建批次失败',
      });
    }
  }
);

router.post(
  '/batches/:batchId/quality-check',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { batchId } = req.params;
      const { passed, reportNumber, notes } = req.body;

      const batch = await productService.completeQualityCheck(
        batchId,
        passed,
        reportNumber,
        notes,
        req.user.userId
      );

      res.json({
        success: true,
        data: batch,
      });
    } catch (error) {
      console.error('Quality check error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '质检失败',
      });
    }
  }
);

router.get(
  '/:productId/price-policies',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { status } = req.query;

      const query = pricePolicyRepository
        .createQueryBuilder('policy')
        .leftJoinAndSelect('policy.region', 'region')
        .where('policy.productId = :productId', { productId })
        .orderBy('policy.createdAt', 'DESC');

      if (status) {
        query.andWhere('policy.status = :status', { status });
      }

      const policies = await query.getMany();

      res.json({
        success: true,
        data: policies,
      });
    } catch (error) {
      console.error('Get price policies error:', error);
      res.status(500).json({
        success: false,
        message: '获取价格政策列表失败',
      });
    }
  }
);

router.post(
  '/:productId/price-policies',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { productId } = req.params;
      const dto: CreatePricePolicyDto = { ...req.body, productId };

      if (dto.startDate && typeof dto.startDate === 'string') {
        dto.startDate = new Date(dto.startDate);
      }
      if (dto.endDate && typeof dto.endDate === 'string') {
        dto.endDate = new Date(dto.endDate);
      }

      const policy = await productService.createPricePolicy(dto, req.user.userId);

      res.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      console.error('Create price policy error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '创建价格政策失败',
      });
    }
  }
);

router.post(
  '/price-policies/:policyId/activate',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { policyId } = req.params;

      const policy = await productService.activatePricePolicy(policyId, req.user.userId);

      res.json({
        success: true,
        data: policy,
      });
    } catch (error) {
      console.error('Activate price policy error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '激活价格政策失败',
      });
    }
  }
);

router.post(
  '/price-policies/:policyId/sync',
  authMiddleware.authenticate,
  authMiddleware.authorize({ roles: [UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.MANUFACTURER_ADMIN] }),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '未登录' });
        return;
      }

      const { policyId } = req.params;

      const result = await productService.syncPricePolicyToDistributionNodes(policyId, req.user.userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Sync price policy error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '同步价格政策失败',
      });
    }
  }
);

router.post(
  '/validate-price',
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    try {
      const { productId, regionId, price, policyType } = req.body;

      if (!productId || price === undefined) {
        res.status(400).json({
          success: false,
          message: '产品ID和价格不能为空',
        });
        return;
      }

      const result = await productService.validatePrice(
        productId,
        regionId || null,
        price,
        policyType || PricePolicyType.RETAIL
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Validate price error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '价格验证失败',
      });
    }
  }
);

router.get(
  '/manufacturers/list',
  authMiddleware.authenticate,
  async (req: Request, res: Response) => {
    try {
      const manufacturers = await manufacturerRepository.find({
        order: { createdAt: 'DESC' },
      });

      res.json({
        success: true,
        data: manufacturers,
      });
    } catch (error) {
      console.error('Get manufacturers error:', error);
      res.status(500).json({
        success: false,
        message: '获取厂家列表失败',
      });
    }
  }
);

export default router;
